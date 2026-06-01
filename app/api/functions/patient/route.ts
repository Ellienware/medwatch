import { NextRequest, NextResponse } from 'next/server'
import { AppwriteFunctionsService } from '@/lib/appwrite/functions'
import { FUNCTIONS } from '@/lib/appwrite/config'
import { getCurrentUser } from '@/lib/auth/actions'

export async function POST(request: NextRequest) {
  try {
    // Get current user using your Appwrite auth
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Add user context to the payload
    // Use auth_user_id instead of $id
    const payload = {
      ...body,
      userId: user.auth_user_id, // This is the Appwrite user ID
      userEmail: user.email,
      userRole: user.role,
      clinicId: user.clinic_id,
    }

    // Execute the function
    const result = await AppwriteFunctionsService.securePatientOperation(
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const executionId = searchParams.get('executionId')
  const functionId = searchParams.get('functionId') || FUNCTIONS.SECURE_PATIENT

  if (!executionId) {
    return NextResponse.json(
      { success: false, error: 'Execution ID required' },
      { status: 400 }
    )
  }

  try {
    const status = await AppwriteFunctionsService.getExecutionStatus(functionId, executionId)
    return NextResponse.json({ success: true, data: status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}