use anchor_lang::prelude::*;
use anchor_lang::solana_program::{sysvar::clock::Clock};

declare_id!("3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp");

// Constant defining the lock-up period in seconds (15 days)
const LOCKUP_DURATION: i64 = 15 * 24 * 60 * 60;

#[program]
pub mod company_vault {
    use super::*;

    /// Initializes a new company vault.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for this instruction.
    /// * `bump` - The bump seed for the vault's PDA.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = *ctx.accounts.owner.key;
        vault.balance = 0;
        vault.deposit_timestamp = 0;
        Ok(())
    }

    /// Deposits funds into the company vault.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for this instruction.
    /// * `amount` - The amount of lamports to deposit.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, VaultError::ZeroDeposit);

        let vault = &mut ctx.accounts.vault;
        let owner = &ctx.accounts.owner;
        let clock = Clock::get()?;

        // Transfer lamports from the owner to the vault
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            owner.key,
            &vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                owner.to_account_info(),
                vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        vault.balance = vault.balance.checked_add(amount).ok_or(VaultError::Overflow)?;
        vault.deposit_timestamp = clock.unix_timestamp;

        emit!(DepositEvent {
            depositor: *owner.key,
            amount,
            timestamp: vault.deposit_timestamp,
        });

        Ok(())
    }

    /// Withdraws funds from the company vault to a specified recipient.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context for this instruction.
    /// * `amount` - The amount to withdraw.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let recipient = &ctx.accounts.recipient;
        let clock = Clock::get()?;

        // Check if the lock-up period has passed
        require!(
            clock.unix_timestamp >= vault.deposit_timestamp + LOCKUP_DURATION,
            VaultError::LockupPeriodNotExpired
        );

        // Check if the requested amount is valid
        require!(amount > 0, VaultError::ZeroWithdrawal);
        require!(amount <= vault.balance, VaultError::InsufficientFunds);

        // Perform the withdrawal
        vault.balance = vault.balance.checked_sub(amount).ok_or(VaultError::Underflow)?;

        // Transfer funds from vault to recipient
        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **recipient.to_account_info().try_borrow_mut_lamports()? += amount;


        emit!(WithdrawEvent {
            recipient: *recipient.key,
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 8 + 8, // Discriminator + owner pubkey + balance + timestamp
        seeds = [b"company-vault", owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, CompanyVault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"company-vault", owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, CompanyVault>,
    #[account(mut, address = vault.owner)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"company-vault", owner.key().as_ref()],
        bump,
        has_one = owner,
    )]
    pub vault: Account<'info, CompanyVault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: The recipient can be any account.
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}


#[account]
pub struct CompanyVault {
    pub owner: Pubkey,
    pub balance: u64,
    pub deposit_timestamp: i64,
}

#[error_code]
pub enum VaultError {
    #[msg("Cannot deposit zero amount.")]
    ZeroDeposit,
    #[msg("Lock-up period of 15 days has not expired yet.")]
    LockupPeriodNotExpired,
    #[msg("Withdrawal amount must be greater than zero.")]
    ZeroWithdrawal,
    #[msg("Insufficient funds in the vault.")]
    InsufficientFunds,
    #[msg("Arithmetic overflow occurred.")]
    Overflow,
    #[msg("Arithmetic underflow occurred.")]
    Underflow,
}

#[event]
pub struct DepositEvent {
    pub depositor: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct WithdrawEvent {
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}