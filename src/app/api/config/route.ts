import { NextResponse } from 'next/server';
import { PLATFORM_FEE_BPS, MIN_ESCROW_AMOUNT } from '@/lib/solana';

export async function GET() {
  try {
    // Public configuration that clients can use
    const config = {
      platformFee: PLATFORM_FEE_BPS / 100, // Convert basis points to decimal (200 -> 0.02)
      minBountyAmount: MIN_ESCROW_AMOUNT / 1_000_000_000, // Convert lamports to SOL
      maxResponseDays: 21, // Default response deadline from schema
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Config fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
