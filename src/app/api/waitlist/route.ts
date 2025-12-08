import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, role } = body

    // In a real application, you would save this to a database
    console.log('Waitlist submission:', { name, email, role })

    return NextResponse.json(
      { message: 'Successfully joined the waitlist' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
