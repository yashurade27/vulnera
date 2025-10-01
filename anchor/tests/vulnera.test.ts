import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { VulneraBounty } from '../target/types/vulnera_bounty'
import { assert } from 'chai'

describe('vulnera_bounty', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.VulneraBounty as Program<VulneraBounty>
  const owner = provider.wallet.publicKey
  let hunter: anchor.web3.PublicKey
  let platformWallet: anchor.web3.PublicKey

  hunter = anchor.web3.Keypair.generate().publicKey
  platformWallet = anchor.web3.Keypair.generate().publicKey

  // Helper function to airdrop and confirm
  const fundAccount = async (provider: anchor.AnchorProvider, account: anchor.web3.PublicKey, amount: number) => {
    const airdropSignature = await provider.connection.requestAirdrop(account, amount)
    await provider.connection.confirmTransaction(airdropSignature)
  }

  // before(async () => {
  //   // Create test accounts
  //   hunter = anchor.web3.Keypair.generate().publicKey
  //   platformWallet = anchor.web3.Keypair.generate().publicKey
  // })

  const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('bounty-escrow'), owner.toBuffer()],
    program.programId,
  )

  it('Initializes a bounty escrow', async () => {
    const escrowAmount = new anchor.BN(anchor.web3.LAMPORTS_PER_SOL) // 1 SOL

    await program.methods
      .initialize(escrowAmount)
      .accounts({
        owner,
      })
      .rpc()

    const vaultAccount = await program.account.bountyEscrow.fetch(vaultPda)
    assert.ok(vaultAccount.owner.equals(owner))
    assert.ok(vaultAccount.escrowAmount.eq(escrowAmount))
  })

  it('Processes a payment', async () => {
    const rewardPerSubmission = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL) // 0.1 SOL
    const maxSubmissions = 5
    const currentPaidSubmissions = 0
    const bountyId = 'test-bounty'
    const submissionId = 'test-submission'

    const hunterBalanceBefore = await provider.connection.getBalance(hunter)
    const platformBalanceBefore = await provider.connection.getBalance(platformWallet)

    await program.methods
      .processPayment(
        bountyId,
        submissionId,
        null, // custom_amount
        rewardPerSubmission,
        maxSubmissions,
        currentPaidSubmissions,
      )
      .accounts({
        hunterWallet: hunter,
        platformWallet,
      })
      .rpc()

    const vaultAccount = await program.account.bountyEscrow.fetch(vaultPda)
    const expectedPlatformFee = rewardPerSubmission.mul(new anchor.BN(200)).div(new anchor.BN(10000)) // 2%
    const expectedHunterAmount = rewardPerSubmission.sub(expectedPlatformFee)

    assert.ok(vaultAccount.escrowAmount.eq(new anchor.BN(anchor.web3.LAMPORTS_PER_SOL).sub(rewardPerSubmission)))

    const hunterBalanceAfter = await provider.connection.getBalance(hunter)
    const platformBalanceAfter = await provider.connection.getBalance(platformWallet)

    assert.ok(hunterBalanceAfter === hunterBalanceBefore + expectedHunterAmount.toNumber())
    assert.ok(platformBalanceAfter === platformBalanceBefore + expectedPlatformFee.toNumber())
  })

  it('Closes the bounty', async () => {
    const bountyId = 'test-bounty'
    const ownerBalanceBefore = await provider.connection.getBalance(owner)

    await program.methods
      .closeBounty(bountyId)
      .accounts({
        vault: vaultPda,
        owner,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    const ownerBalanceAfter = await provider.connection.getBalance(owner)
    // Remaining should be 1 SOL - 0.1 SOL = 0.9 SOL
    assert.ok(ownerBalanceAfter > ownerBalanceBefore + 0.8 * anchor.web3.LAMPORTS_PER_SOL)
  })

  it('Fails to initialize with insufficient escrow amount', async () => {
    // 1. Create a brand new, unique owner for this test
    const testOwner = anchor.web3.Keypair.generate()

    // 2. Fund this new wallet so it can pay for the transaction
    await fundAccount(provider, testOwner.publicKey, anchor.web3.LAMPORTS_PER_SOL)

    const invalidAmount = new anchor.BN(50000) // Less than MIN_ESCROW_AMOUNT

    try {
      // 3. Call the instruction with the new owner
      await program.methods
        .initialize(invalidAmount)
        .accounts({
          owner: testOwner.publicKey, // Use the new owner's public key
        })
        .signers([testOwner]) // The new owner must sign to approve the transaction
        .rpc()
      assert.fail('Should have thrown an error')
    } catch (error) {
      // 4. Now the test will correctly catch your custom program error!
      assert.include(error.toString(), 'InvalidEscrowAmount')
    }
  })

  it('Fails to process payment when max submissions reached', async () => {
    // First, need to initialize again or use a new PDA
    const newOwner = anchor.web3.Keypair.generate()

    // ✅ FIX: Use the helper function to airdrop AND wait for confirmation
    await fundAccount(provider, newOwner.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)

    const [newVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('bounty-escrow'), newOwner.publicKey.toBuffer()],
      program.programId,
    )

    // This will now succeed because the newOwner wallet has funds
    await program.methods
      .initialize(new anchor.BN(anchor.web3.LAMPORTS_PER_SOL))
      .accounts({
        owner: newOwner.publicKey,
      })
      .signers([newOwner])
      .rpc()

    const rewardPerSubmission = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL)
    const maxSubmissions = 1
    const currentPaidSubmissions = 1 // Already at max

    try {
      await program.methods
        .processPayment('test', 'test', null, rewardPerSubmission, maxSubmissions, currentPaidSubmissions)
        .accounts({
          hunterWallet: hunter,
          platformWallet,
        })
        .rpc()
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.include(error.toString(), 'MaxSubmissionsReached')
    }
  })

  it('Fails to process payment with insufficient funds', async () => {
    const newOwner = anchor.web3.Keypair.generate()
    await fundAccount(provider, newOwner.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)

    const [newVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('bounty-escrow'), newOwner.publicKey.toBuffer()],
      program.programId,
    )

    // 1. Initialize with a VALID amount that is small (e.g., 0.5 SOL)
    await program.methods
      .initialize(new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL))
      .accounts({
        owner: newOwner.publicKey,
      })
      .signers([newOwner])
      .rpc()

    // 2. Now, try to pay a reward that is LARGER than the escrow balance
    const rewardPerSubmission = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL) // 1 SOL > 0.5 SOL

    try {
      await program.methods
        .processPayment('test', 'test', null, rewardPerSubmission, 5, 0)
        .accounts({
          hunterWallet: hunter,
          platformWallet,
        })
        .rpc()
      assert.fail('Should have thrown an error')
    } catch (error) {
      // 3. The test will now correctly catch the 'InsufficientFunds' error
      assert.include(error.toString(), 'InsufficientFunds')
    }
  })
})