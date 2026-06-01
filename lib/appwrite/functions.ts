import { Client, Functions } from 'node-appwrite'
import { serverClient } from './server-client'
import { FUNCTIONS } from './config'

export interface FunctionExecutionResult {
  success: boolean
  data?: any
  error?: string
  executionId?: string
  status?: string
  statusCode?: number
}

export class AppwriteFunctionsService {
  /**
   * Execute an Appwrite function server-side
   */
  static async executeServer(
    functionId: string,
    data?: any,
    async: boolean = false
  ): Promise<FunctionExecutionResult> {
    try {
      if (!functionId) {
        throw new Error('Function ID is required')
      }

      if (!serverClient.client.config.key) {
        throw new Error('Appwrite API key is not configured')
      }

      // Create a new Functions client
      const functions = new Functions(serverClient.client)
      
      console.log(`Executing server function: ${functionId}`, {
        data: data ? '***' : 'none',
        async
      })

      const execution = await functions.createExecution(
        functionId,
        JSON.stringify(data),
        async
      )
      
      console.log(`Function execution started: ${execution.$id}`, {
        status: execution.status,
        responseStatusCode: execution.responseStatusCode,
        responseBodyLength: execution.responseBody?.length || 0
      })

      // Check if response body exists and is valid JSON
      if (!execution.responseBody || execution.responseBody.trim() === '') {
        console.error('Function returned empty response')
        return {
          success: false,
          error: 'Function returned empty response',
          executionId: execution.$id,
          status: execution.status,
          statusCode: execution.responseStatusCode
        }
      }

      try {
        const result = JSON.parse(execution.responseBody)
        console.log('Function parsed successfully:', {
          success: result.success,
          hasError: !!result.error,
          hasData: !!result.data
        })
        
        return {
          ...result,
          executionId: execution.$id,
          status: execution.status,
          statusCode: execution.responseStatusCode
        }
      } catch (parseError: any) {
        console.error('Failed to parse function response:', {
          error: parseError.message,
          rawResponse: execution.responseBody.substring(0, 200)
        })
        
        return {
          success: false,
          error: `Invalid JSON response: ${parseError.message}`,
          executionId: execution.$id,
          status: execution.status,
          statusCode: execution.responseStatusCode,
          data: { rawResponse: execution.responseBody }
        }
      }
    } catch (error: any) {
      console.error('Server function execution failed:', {
        error: error.message,
        code: error.code,
        type: error.type
      })
      
      let errorMessage = error.message || 'Function execution failed'
      
      if (error.code === 404) {
        errorMessage = `Function not found. Check if function ID '${functionId}' is correct and the function is deployed.`
      } else if (error.code === 401 || error.code === 403) {
        errorMessage = 'Authentication failed. Check your Appwrite API key.'
      } else if (error.message?.includes('JSON')) {
        errorMessage = 'Invalid JSON response from function'
      }
      
      return {
        success: false,
        error: errorMessage,
        status: 'error',
        statusCode: error.code || 500
      }
    }
  }

  /**
   * Execute via fetch API for browser or simple server calls
   */
  static async executeViaFetch(
    functionId: string,
    data?: any,
    async: boolean = false
  ): Promise<FunctionExecutionResult> {
    try {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
      const apiKey = process.env.APPWRITE_API_KEY

      if (!endpoint || !projectId) {
        throw new Error('Appwrite configuration missing. Check NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.')
      }

      if (!functionId) {
        throw new Error('Function ID is required')
      }

      const url = `${endpoint}/functions/${functionId}/executions`
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
      }

      // Add API key for server-side execution
      if (typeof window === 'undefined' && apiKey) {
        headers['X-Appwrite-Key'] = apiKey
      }

      console.log(`Calling function via fetch: ${functionId}`, {
        async,
        hasData: !!data
      })

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          async,
          data: JSON.stringify(data)
        }),
      })

      const responseText = await response.text()
      
      if (!response.ok) {
        console.error(`Function call failed: ${response.status}`, responseText)
        
        let errorMessage = `Function execution failed: ${response.status}`
        if (response.status === 404) {
          errorMessage = `Function not found (404). Check if function ID '${functionId}' is correct.`
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'Authentication failed. Check your API key and permissions.'
        }
        
        return {
          success: false,
          error: errorMessage,
          statusCode: response.status
        }
      }

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Function returned empty response via fetch')
        return {
          success: false,
          error: 'Function returned empty response',
          statusCode: response.status
        }
      }

      try {
        const result = JSON.parse(responseText)
        console.log(`Function response received:`, {
          success: result.success,
          hasError: !!result.error
        })
        
        return result
      } catch (parseError: any) {
        console.error('Failed to parse function response via fetch:', {
          error: parseError.message,
          rawResponse: responseText.substring(0, 200)
        })
        
        return {
          success: false,
          error: `Invalid JSON response: ${parseError.message}`,
          data: { rawResponse: responseText },
          statusCode: response.status
        }
      }
    } catch (error: any) {
      console.error('Fetch function execution failed:', error)
      return {
        success: false,
        error: error.message || 'Function execution failed'
      }
    }
  }

  /**
   * Secure Patient Operations
   */
  static async securePatientOperation(action: string, payload: any): Promise<FunctionExecutionResult> {
    try {
      if (!FUNCTIONS.SECURE_PATIENT) {
        throw new Error('Secure patient function ID is not configured. Check SECURE_PATIENT_FUNCTION_ID.')
      }

      const data = {
        ...payload,
        action
      }

      console.log(`Secure patient operation: ${action}`, {
        userId: payload.userId,
        clinicId: payload.clinicId,
        hasPatientId: !!payload.patientId
      })

      // Use appropriate execution method
      let result: FunctionExecutionResult
      
      if (typeof window === 'undefined') {
        result = await this.executeServer(FUNCTIONS.SECURE_PATIENT, data)
      } else {
        result = await this.executeViaFetch(FUNCTIONS.SECURE_PATIENT, data)
      }

      console.log(`Secure patient operation ${action} result:`, {
        success: result.success,
        error: result.error,
        hasData: !!result.data
      })

      return result
    } catch (error: any) {
      console.error('Secure patient operation failed:', {
        error: error.message,
        stack: error.stack
      })
      return {
        success: false,
        error: error.message || 'Secure patient operation failed'
      }
    }
  }

  /**
   * Secure Test Result Operations
   */
  static async secureTestResultOperation(action: string, payload: any): Promise<FunctionExecutionResult> {
    try {
      if (!FUNCTIONS.SECURE_TEST_RESULT) {
        throw new Error('Secure test result function ID is not configured. Check SECURE_TEST_RESULT_FUNCTION_ID.')
      }

      const data = {
        ...payload,
        action
      }

      console.log(`Secure test result operation: ${action}`, {
        userId: payload.userId,
        clinicId: payload.clinicId,
        testResultId: payload.testResultId
      })

      // Use appropriate execution method
      let result: FunctionExecutionResult
      
      if (typeof window === 'undefined') {
        result = await this.executeServer(FUNCTIONS.SECURE_TEST_RESULT, data)
      } else {
        result = await this.executeViaFetch(FUNCTIONS.SECURE_TEST_RESULT, data)
      }

      console.log(`Secure test result operation ${action} result:`, {
        success: result.success,
        error: result.error,
        hasData: !!result.data
      })

      return result
    } catch (error: any) {
      console.error('Secure test result operation failed:', error)
      return {
        success: false,
        error: error.message || 'Secure test result operation failed'
      }
    }
  }

  /**
   * Get function execution status
   */
  static async getExecutionStatus(functionId: string, executionId: string): Promise<any> {
    try {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
      const apiKey = process.env.APPWRITE_API_KEY

      if (!endpoint || !projectId) {
        throw new Error('Appwrite configuration missing')
      }

      const url = `${endpoint}/functions/${functionId}/executions/${executionId}`
      
      const headers: Record<string, string> = {
        'X-Appwrite-Project': projectId,
      }

      if (typeof window === 'undefined' && apiKey) {
        headers['X-Appwrite-Key'] = apiKey
      }

      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to get execution status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error: any) {
      console.error('Get execution status failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}