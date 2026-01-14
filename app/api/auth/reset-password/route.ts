// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { updatePasswordRecovery } from '@/lib/appwrite/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Reset password API called')
    const body = await request.json()
    
    // Log partial info
    console.log('Request data:', {
      userId: body.userId,
      secret: body.secret ? '***' + body.secret.substring(-10) : 'missing',
      passwordLength: body.password ? body.password.length : 0,
      confirmPasswordLength: body.confirmPassword ? body.confirmPassword.length : 0
    })

    const { userId, secret, password, confirmPassword } = body

    if (!userId || !secret || !password) {
      console.error('Missing required fields:', { 
        userId: !!userId, 
        secret: !!secret, 
        password: !!password 
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      console.error('Password validation failed')
      return NextResponse.json(
        { 
          error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
        },
        { status: 400 }
      )
    }

    // Check if passwords match
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    console.log('Calling updatePasswordRecovery...')
    
    // Use confirmPassword if provided, otherwise use password
    const confirm = confirmPassword || password
    
    const result = await updatePasswordRecovery(userId, secret, password, confirm)

    console.log('updatePasswordRecovery result:', {
      success: result.success,
      error: result.error || 'none'
    })

    if (!result.success) {
      // Handle specific errors
      const errorMsg = result.error?.toLowerCase() || ''
      
      console.error('Password reset failed:', errorMsg)
      
      if (errorMsg.includes('invalid') || errorMsg.includes('expired')) {
        return NextResponse.json(
          { error: 'Invalid or expired reset link. Please request a new password reset.' },
          { status: 400 }
        )
      }
      
      if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          { status: 429 }
        )
      }
      
      if (errorMsg.includes('confirmation')) {
        return NextResponse.json(
          { error: 'Password confirmation failed. Please make sure both passwords match.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: result.error || 'Failed to reset password' },
        { status: 400 }
      )
    }

    console.log('Password reset successful for user:', userId)
    
    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Reset password unexpected error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    )
  }
}