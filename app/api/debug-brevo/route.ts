import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY
    
    if (!brevoApiKey) {
      return NextResponse.json({
        success: false,
        error: 'BREVO_API_KEY not found in .env',
        tip: 'Add BREVO_API_KEY=xkeysib-your-key to .env.local'
      }, { status: 500 })
    }
    
    // Test if key format is correct
    const isValidFormat = brevoApiKey.startsWith('xkeysib-')
    
    // Try to make a simple API call
    const testResponse = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': brevoApiKey,
        'accept': 'application/json',
      },
    })
    
    const status = testResponse.status
    const statusText = testResponse.statusText
    
    let accountInfo = null
    if (status === 200) {
      accountInfo = await testResponse.json()
    }
    
    return NextResponse.json({
      success: true,
      diagnostics: {
        apiKeyExists: !!brevoApiKey,
        apiKeyLength: brevoApiKey.length,
        apiKeyFormatValid: isValidFormat,
        apiKeyPreview: brevoApiKey.substring(0, 20) + '...',
        apiTestStatus: status,
        apiTestStatusText: statusText,
        accountInfo: accountInfo ? {
          email: accountInfo.email,
          credits: accountInfo.credits,
          plan: accountInfo.plan?.[0]?.type
        } : null,
      },
      recommendations: [
        !brevoApiKey ? 'Add BREVO_API_KEY to .env.local' : null,
        !isValidFormat ? 'API key should start with "xkeysib-"' : null,
        status === 401 ? 'Invalid API key. Get a new one from Brevo dashboard' : null,
        status === 403 ? 'API key doesn\'t have required permissions' : null,
        status === 200 ? '✅ API key is working correctly!' : null,
      ].filter(Boolean)
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
