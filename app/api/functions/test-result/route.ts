import { NextRequest, NextResponse } from 'next/server'
import { AppwriteFunctionsService } from '@/lib/appwrite/functions'
import { FUNCTIONS } from '@/lib/appwrite/config'
import { getCurrentUser } from '@/lib/auth/actions'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const payload = {
      ...body,
      userId: user.auth_user_id, // Use auth_user_id
      userEmail: user.email,
      userRole: user.role,
      clinicId: user.clinic_id,
    }

    const result = await AppwriteFunctionsService.secureTestResultOperation(
      body.action || 'list',
      payload
    )
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Function proxy error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}