import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, role } = body

    if (!name || !email || !role) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    try {
      await prisma.waitlist.create({
        data: {
          name,
          email,
          role,
        },
      })
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'Email already registered' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(
      { message: 'Successfully joined the waitlist' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
