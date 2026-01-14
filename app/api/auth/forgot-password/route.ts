// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordReset, getUserByEmail } from '@/lib/auth/appwrite-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists first
    const user = await getUserByEmail(email)
    
    if (!user) {
      // Return generic success message for security
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link' },
        { status: 200 }
      )
    }

    try {
      // Try to send password reset
      await sendPasswordReset(email)
      
      return NextResponse.json(
        { message: 'Password reset email sent successfully' },
        { status: 200 }
      )
    } catch (resetError: any) {
      console.error('Password reset error:', resetError)
      
      // Still return success for security
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link' },
        { status: 200 }
      )
    }

  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    // Always return the same message for security
    return NextResponse.json(
      { message: 'If an account exists with this email, you will receive a password reset link' },
      { status: 200 }
    )
  }
}