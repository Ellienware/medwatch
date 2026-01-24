import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordReset } from '@/lib/appwrite/auth'

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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log(`Processing password reset request for: ${email}`)

    // Call the Appwrite password reset function
    const result = await sendPasswordReset(email)

    if (!result.success) {
      const errorMsg = result.error?.toLowerCase() || ''
      
      // Handle specific errors
      if (errorMsg.includes('not found') || errorMsg.includes('no user')) {
        return NextResponse.json(
          { error: 'No account found with this email address' },
          { status: 404 }
        )
      }
      
      if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
        return NextResponse.json(
          { error: 'Too many reset attempts. Please wait before trying again.' },
          { status: 429 }
        )
      }
      
      if (errorMsg.includes('invalid')) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: result.error || 'Failed to send reset email' },
        { status: 400 }
      )
    }

    console.log(`Password reset email sent successfully to: ${email}`)
    
    return NextResponse.json(
      { 
        message: 'Password reset email sent. Please check your inbox.',
        email: email // Return the email for confirmation display
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Forgot password unexpected error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}