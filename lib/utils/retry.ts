/**
 * Retry logic with exponential backoff
 */

type RetryOptions = {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  factor?: number
  shouldRetry?: (error: Error) => boolean
}

// Helper function to check if error is retryable (network/timeout errors)
function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase()
  const errorName = error.name.toLowerCase()
  
  // List of retryable error patterns
  const retryablePatterns = [
    'fetch failed',
    'network',
    'timeout',
    'econnrefused',
    'enotfound',
    'econnreset',
    'eai_again',
    'socket',
    'connection',
    'aborted',
    'eaddrnotavail',
    'etimedout',
    'esockettimedout',
    'ehostunreach',
  ]
  
  // Check for retryable patterns
  for (const pattern of retryablePatterns) {
    if (errorMessage.includes(pattern) || errorName.includes(pattern)) {
      return true
    }
  }
  
  // Check for Appwrite specific retryable errors
  if ('code' in error) {
    const errorCode = (error as any).code
    // 5xx errors are server errors and can be retried
    if (typeof errorCode === 'number' && errorCode >= 500 && errorCode < 600) {
      return true
    }
  }
  
  return false
}

// Helper function to check if error should NOT be retried
function isNonRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase()
  
  // Client errors (4xx) should not be retried
  if ('code' in error) {
    const errorCode = (error as any).code
    if (typeof errorCode === 'number' && errorCode >= 400 && errorCode < 500) {
      return true
    }
  }
  
  // Specific non-retryable errors
  const nonRetryablePatterns = [
    'invalid query',
    'permission denied',
    'unauthorized',
    'forbidden',
    'not found',
    'validation',
    'invalid',
    'missing',
    'required',
  ]
  
  for (const pattern of nonRetryablePatterns) {
    if (errorMessage.includes(pattern)) {
      return true
    }
  }
  
  return false
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, initialDelay = 1000, maxDelay = 10000, factor = 2, shouldRetry = () => true } = options

  let lastError: Error
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      console.log(`Retry attempt ${attempt}/${maxAttempts}...`)
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt} failed:`, lastError.message)

      // Don't retry if this is the last attempt
      if (attempt === maxAttempts) {
        console.log(`Max attempts (${maxAttempts}) reached. Giving up.`)
        break
      }

      // Check if error is non-retryable (e.g., client errors)
      if (isNonRetryableError(lastError)) {
        console.log(`Non-retryable error detected: ${lastError.message}. Stopping retries.`)
        break
      }

      // Check if error is retryable (network/timeout errors)
      if (!isRetryableError(lastError)) {
        console.log(`Non-retryable error: ${lastError.message}. Stopping retries.`)
        break
      }

      // Check custom retry condition
      if (!shouldRetry(lastError)) {
        console.log(`Custom shouldRetry returned false for: ${lastError.message}`)
        break
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay)
      const jitter = Math.random() * 0.3 * baseDelay // ±30% jitter
      const delay = baseDelay + jitter

      console.log(`Waiting ${Math.round(delay)}ms before next retry...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      
      attempt++
    }
  }

  throw lastError!
}

/**
 * Enhanced Circuit breaker pattern for resilience with more detailed state
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private successCount = 0
  private state: "closed" | "open" | "half-open" = "closed"

  constructor(
    private threshold = 5,
    private timeout = 60000,
    private halfOpenSuccessThreshold = 2
  ) {}

  async execute<T>(fn: () => Promise<T>, context?: string): Promise<T> {
    const contextStr = context ? ` [${context}]` : ''
    
    // If circuit is open, check if we should try again
    if (this.state === "open") {
      const timeSinceFailure = Date.now() - this.lastFailureTime
      if (timeSinceFailure > this.timeout) {
        console.log(`Circuit breaker${contextStr}: Timeout passed, moving to half-open state`)
        this.state = "half-open"
        this.successCount = 0
      } else {
        console.log(`Circuit breaker${contextStr}: Circuit is OPEN (${timeSinceFailure}ms since last failure)`)
        throw new Error(`Circuit breaker is open. Service unavailable${contextStr}`)
      }
    }

    try {
      console.log(`Circuit breaker${contextStr}: Executing in ${this.state} state`)
      const result = await fn()
      
      // On success in half-open state, count successes
      if (this.state === "half-open") {
        this.successCount++
        console.log(`Circuit breaker${contextStr}: Half-open success ${this.successCount}/${this.halfOpenSuccessThreshold}`)
        
        // If we have enough successes, close the circuit
        if (this.successCount >= this.halfOpenSuccessThreshold) {
          console.log(`Circuit breaker${contextStr}: Success threshold reached, closing circuit`)
          this.state = "closed"
          this.failures = 0
          this.successCount = 0
        }
      } else {
        // Reset failure count on success in closed state
        this.failures = Math.max(0, this.failures - 1)
      }

      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()
      
      // Only open circuit for retryable errors
      const errorMsg = error instanceof Error ? error.message : String(error)
      const isRetryableErr = isRetryableError(error instanceof Error ? error : new Error(errorMsg))
      
      if (isRetryableErr && this.failures >= this.threshold) {
        console.log(`Circuit breaker${contextStr}: Threshold (${this.threshold}) exceeded, opening circuit`)
        this.state = "open"
      } else if (!isRetryableErr) {
        console.log(`Circuit breaker${contextStr}: Non-retryable error, keeping circuit ${this.state}`)
      }

      throw error
    }
  }

  reset() {
    console.log('Circuit breaker: Manual reset')
    this.failures = 0
    this.successCount = 0
    this.state = "closed"
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      timeSinceLastFailure: Date.now() - this.lastFailureTime,
    }
  }
}

// Create circuit breaker instances for different services
export const databaseCircuitBreaker = new CircuitBreaker(3, 30000, 1) // More sensitive for database
export const apiCircuitBreaker = new CircuitBreaker(5, 60000, 2) // Less sensitive for APIs

/**
 * Combined retry with circuit breaker
 */
export async function withResilience<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker,
  retryOptions?: RetryOptions,
  context?: string
): Promise<T> {
  return circuitBreaker.execute(async () => {
    return withRetry(fn, {
      shouldRetry: isRetryableError,
      ...retryOptions
    })
  }, context)
}
