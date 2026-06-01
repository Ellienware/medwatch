export class LoggingService {
  private static instance: LoggingService
  private isDevelopment: boolean

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService()
    }
    return LoggingService.instance
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data)
  }

  warn(message: string, data?: any) {
    this.log('WARN', message, data)
  }

  error(message: string, data?: any) {
    this.log('ERROR', message, data)
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('DEBUG', message, data)
    }
  }

  private log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.sanitizeData(data)
    }

    if (level === 'ERROR') {
      console.error(JSON.stringify(logEntry, null, 2))
    } else if (level === 'WARN') {
      console.warn(JSON.stringify(logEntry, null, 2))
    } else if (this.isDevelopment) {
      console.log(JSON.stringify(logEntry, null, 2))
    }

    // In production, you would send this to a logging service
    // like Sentry, LogRocket, or a custom logging endpoint
  }

  private sanitizeData(data: any): any {
    if (!data) return {}
    
    const sanitized = { ...data }
    
    // Remove sensitive information
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'credit_card',
      'ssn',
      'social_security'
    ]
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })
    
    // Sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key])
      }
    })
    
    return sanitized
  }

  logCertificateGeneration(certificateId: string, userId: string, clinicId: string, success: boolean, error?: string) {
    this.info('Certificate generation attempt', {
      certificateId,
      userId,
      clinicId,
      success,
      error: error || null,
      timestamp: new Date().toISOString()
    })
  }

  logCertificateUpdate(certificateId: string, userId: string, changes: any) {
    this.info('Certificate updated', {
      certificateId,
      userId,
      changes,
      timestamp: new Date().toISOString()
    })
  }

  logEmailSent(certificateId: string, recipientType: 'patient' | 'employer', success: boolean, error?: string) {
    this.info('Certificate email sent', {
      certificateId,
      recipientType,
      success,
      error: error || null,
      timestamp: new Date().toISOString()
    })
  }
}

export const logger = LoggingService.getInstance()
