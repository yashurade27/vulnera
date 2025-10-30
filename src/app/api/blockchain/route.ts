import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'Vulnera Blockchain API',
    version: '1.0.0',
    description: 'Solana blockchain integration for Vulnera Bug Bounty Platform',
    endpoints: {
      'POST /api/blockchain/verify-wallet': 'Verify wallet ownership via signature',
      'POST /api/blockchain/create-escrow': 'Create escrow account for bounty',
      'POST /api/blockchain/release-payment': 'Prepare payment parameters for bounty hunter',
      'POST /api/blockchain/withdraw-escrow': 'Withdraw remaining funds from closed bounty',
      'GET /api/blockchain/transaction/[signature]': 'Get transaction status and details',
      'POST /api/blockchain/verify-transaction': 'Verify transaction confirmation on Solana'
    },
    network: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    status: 'operational'
  })
}
