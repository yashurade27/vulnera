use anchor_lang::prelude::*;

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
