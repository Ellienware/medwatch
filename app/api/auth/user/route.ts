import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Remove sensitive fields
    const { invitation_token, ...safeUser } = user

    return NextResponse.json(safeUser, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}