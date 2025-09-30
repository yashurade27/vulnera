#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("3Hfod1h8nFotUMiFL3AeaWrtgiaU5jAq28UeH6veAqBp");

#[program]
pub mod vulnera {
    use super::*;

    pub fn close(_ctx: Context<CloseVulnera>) -> Result<()> {
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.vulnera.count = ctx.accounts.vulnera.count.checked_sub(1).unwrap();
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.vulnera.count = ctx.accounts.vulnera.count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn initialize(_ctx: Context<InitializeVulnera>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
        ctx.accounts.vulnera.count = value.clone();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVulnera<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  init,
  space = 8 + Vulnera::INIT_SPACE,
  payer = payer
    )]
    pub vulnera: Account<'info, Vulnera>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseVulnera<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  mut,
  close = payer, // close account and return lamports to payer
    )]
    pub vulnera: Account<'info, Vulnera>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub vulnera: Account<'info, Vulnera>,
}

#[account]
#[derive(InitSpace)]
pub struct Vulnera {
    count: u8,
}
