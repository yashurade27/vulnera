import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  generateKeyPairSigner,
  Instruction,
  isSolanaError,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import {
  fetchVulnera,
  getCloseInstruction,
  getDecrementInstruction,
  getIncrementInstruction,
  getInitializeInstruction,
  getSetInstruction,
} from '../src'
// @ts-ignore error TS2307 suggest setting `moduleResolution` but this is already configured
import { loadKeypairSignerFromFile } from 'gill/node'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

describe('vulnera', () => {
  let payer: KeyPairSigner
  let vulnera: KeyPairSigner

  beforeAll(async () => {
    vulnera = await generateKeyPairSigner()
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
  })

  it('Initialize Vulnera', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getInitializeInstruction({ payer: payer, vulnera: vulnera })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSER
    const currentVulnera = await fetchVulnera(rpc, vulnera.address)
    expect(currentVulnera.data.count).toEqual(0)
  })

  it('Increment Vulnera', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({
      vulnera: vulnera.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchVulnera(rpc, vulnera.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Increment Vulnera Again', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getIncrementInstruction({ vulnera: vulnera.address })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchVulnera(rpc, vulnera.address)
    expect(currentCount.data.count).toEqual(2)
  })

  it('Decrement Vulnera', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getDecrementInstruction({
      vulnera: vulnera.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchVulnera(rpc, vulnera.address)
    expect(currentCount.data.count).toEqual(1)
  })

  it('Set vulnera value', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getSetInstruction({ vulnera: vulnera.address, value: 42 })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    const currentCount = await fetchVulnera(rpc, vulnera.address)
    expect(currentCount.data.count).toEqual(42)
  })

  it('Set close the vulnera account', async () => {
    // ARRANGE
    expect.assertions(1)
    const ix = getCloseInstruction({
      payer: payer,
      vulnera: vulnera.address,
    })

    // ACT
    await sendAndConfirm({ ix, payer })

    // ASSERT
    try {
      await fetchVulnera(rpc, vulnera.address)
    } catch (e) {
      if (!isSolanaError(e)) {
        throw new Error(`Unexpected error: ${e}`)
      }
      expect(e.message).toEqual(`Account not found at address: ${vulnera.address}`)
    }
  })
})

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
  return await sendAndConfirmTransaction(signedTransaction)
}
