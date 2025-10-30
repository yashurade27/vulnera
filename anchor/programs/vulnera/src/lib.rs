use anchor_lang::prelude::*;
use anchor_lang::solana_program::{system_program, sysvar::clock::Clock};

declare_id!("5E6gim2SHCpuaJ4Lg3nq2nxs1So1t9MDU5ACdPdB1U6W");

// Platform fee in basis points (200 = 2%)
pub const DEFAULT_PLATFORM_FEE: u16 = 200;

// Minimum bounty amounts (in lamports)
pub const MIN_ESCROW_AMOUNT: u64 = 100_000_000; // 0.1 SOL

#[program]
pub mod vulnera_bounty {
    use super::*;

    /// Initializes a new bounty escrow.
    /// Companies deposit funds into escrow for bounty payouts.
    pub fn initialize(ctx: Context<Initialize>, escrow_amount: u64) -> Result<()> {
        require!(escrow_amount >= MIN_ESCROW_AMOUNT, VaultError::InvalidEscrowAmount);

        let vault = &mut ctx.accounts.vault;
        vault.owner = *ctx.accounts.owner.key;
        vault.escrow_amount = escrow_amount;

        // Transfer escrow amount
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            ctx.accounts.owner.key,
            &vault.key(),
            escrow_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.owner.to_account_info(),
                vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    /// Processes payment for an approved submission.
    /// Pays the bounty hunter and deducts platform fee.
    /// Parameters like reward_per_submission, max_submissions, current_paid_submissions are provided by backend.
    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        bounty_id: String,
        submission_id: String,
        custom_amount: Option<u64>,
        reward_per_submission: u64,
        max_submissions: u32,
        current_paid_submissions: u32,
    ) -> Result<()> {
        require!(current_paid_submissions < max_submissions, VaultError::MaxSubmissionsReached);

        let amount = custom_amount.unwrap_or(reward_per_submission);
        require!(amount <= ctx.accounts.vault.escrow_amount, VaultError::InsufficientFunds);

        let platform_fee = (amount.checked_mul(DEFAULT_PLATFORM_FEE as u64).ok_or(VaultError::Overflow)?).checked_div(10000).ok_or(VaultError::Overflow)?;
        let hunter_amount = amount.checked_sub(platform_fee).ok_or(VaultError::Underflow)?;

        // Transfer to hunter
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= hunter_amount;
        **ctx.accounts.hunter_wallet.to_account_info().try_borrow_mut_lamports()? += hunter_amount;

        // Transfer platform fee
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.platform_wallet.to_account_info().try_borrow_mut_lamports()? += platform_fee;

        ctx.accounts.vault.escrow_amount = ctx.accounts.vault.escrow_amount.checked_sub(amount).ok_or(VaultError::Underflow)?;

        emit!(PaymentProcessed {
            bounty_id,
            submission_id,
            hunter_wallet: *ctx.accounts.hunter_wallet.key,
            amount: hunter_amount,
            platform_fee,
        });

        Ok(())
    }

    /// Closes the bounty and returns remaining funds to the owner.
    pub fn close_bounty(ctx: Context<CloseBounty>, bounty_id: String) -> Result<()> {
        // By using the `close` constraint on the vault account in the `CloseBounty` struct,
        // the Solana runtime will automatically handle the transfer of all remaining lamports
        // to the owner. No manual transfer logic is needed here.

        emit!(BountyClosed {
            bounty_id,
            // We can get the actual remaining lamports from the account info before it's closed.
            remaining_amount: ctx.accounts.vault.to_account_info().lamports(),
        });

        Ok(())
    }

    /// Deposits additional funds into an existing bounty escrow.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.escrow_amount = vault.escrow_amount.checked_add(amount).ok_or(VaultError::Overflow)?;

        // Transfer funds from owner to vault
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            ctx.accounts.owner.key,
            &vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.owner.to_account_info(),
                vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 8, // Discriminator + owner + escrow_amount
        seeds = [b"bounty-escrow", owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, BountyEscrow>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"bounty-escrow", owner.key().as_ref()],
        bump,
        has_one = owner
    )]
    pub vault: Account<'info, BountyEscrow>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(mut, seeds = [b"bounty-escrow", owner.key().as_ref()], bump, has_one = owner)]
    pub vault: Account<'info, BountyEscrow>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub hunter_wallet: SystemAccount<'info>,
    #[account(mut)]
    pub platform_wallet: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseBounty<'info> {
    #[account(
        mut,
        seeds = [b"bounty-escrow", owner.key().as_ref()],
        bump,
        has_one = owner,
        // This is the crucial change:
        // It tells Solana to transfer all lamports from `vault` to `owner`
        // and then delete the `vault` account from the blockchain.
        close = owner
    )]
    pub vault: Account<'info, BountyEscrow>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BountyEscrow {
    pub owner: Pubkey,
    pub escrow_amount: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("Insufficient funds in the vault.")]
    InsufficientFunds,
    #[msg("Arithmetic overflow occurred.")]
    Overflow,
    #[msg("Arithmetic underflow occurred.")]
    Underflow,
    #[msg("Invalid escrow amount")]
    InvalidEscrowAmount,
    #[msg("Maximum submissions reached")]
    MaxSubmissionsReached,
}

#[event]
pub struct PaymentProcessed {
    pub bounty_id: String,
    pub submission_id: String,
    pub hunter_wallet: Pubkey,
    pub amount: u64,
    pub platform_fee: u64,
}

#[event]
pub struct BountyClosed {
    pub bounty_id: String,
    pub remaining_amount: u64,
}