import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  return NextResponse.json(session)
}
