import { NextResponse } from 'next/server'
import { Client, Functions } from 'node-appwrite'

export async function GET() {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!)

    const functions = new Functions(client)

    // Test both functions
    const testPayload = {
      action: "list",
      userId: "test",
      userEmail: "test@example.com",
      userRole: "doctor",
      clinicId: "test-clinic"
    }

    const patientFunctionId = "6980618c00097862b0ea"
    const testResultFunctionId = "698061eb002ae3d7943e"

    let patientResult: any = {}
    let testResult: any = {}

    // Test patient function
    try {
      console.log('Testing patient function...')
      const execution = await functions.createExecution(
        patientFunctionId,
        JSON.stringify(testPayload),
        false
      )
      
      patientResult = {
        success: true,
        executionId: execution.$id,
        status: execution.status,
        statusCode: execution.responseStatusCode,
        responseLength: execution.responseBody?.length || 0,
        responseBody: execution.responseBody || 'EMPTY',
        responsePreview: execution.responseBody?.substring(0, 500) || 'EMPTY'
      }
    } catch (error: any) {
      patientResult = {
        success: false,
        error: error.message,
        code: error.code,
        type: error.type,
        response: error.response || 'No response'
      }
    }

    // Test test result function
    try {
      console.log('Testing test result function...')
      const execution = await functions.createExecution(
        testResultFunctionId,
        JSON.stringify({ ...testPayload, action: "list" }),
        false
      )
      
      testResult = {
        success: true,
        executionId: execution.$id,
        status: execution.status,
        statusCode: execution.responseStatusCode,
        responseLength: execution.responseBody?.length || 0,
        responseBody: execution.responseBody || 'EMPTY',
        responsePreview: execution.responseBody?.substring(0, 500) || 'EMPTY'
      }
    } catch (error: any) {
      testResult = {
        success: false,
        error: error.message,
        code: error.code,
        type: error.type
      }
    }

    return NextResponse.json({
      environment: {
        hasEndpoint: !!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
        hasProjectId: !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
        hasApiKey: !!process.env.APPWRITE_API_KEY,
        patientFunctionId,
        testResultFunctionId
      },
      patientFunction: patientResult,
      testResultFunction: testResult,
      diagnosis: [
        patientResult.statusCode === 500 ? 'Patient function returns 500 - check Appwrite Function logs' : '',
        patientResult.responseLength === 0 ? 'Patient function returns empty response - function is crashing' : '',
        testResult.statusCode === 500 ? 'Test result function returns 500 - check Appwrite Function logs' : '',
        testResult.responseLength === 0 ? 'Test result function returns empty response - function is crashing' : '',
      ].filter(Boolean)
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}