// lib/utils/password.ts
/**
 * Generate a random password
 */
export function generatePassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Generate a temporary password for new staff
 */
export function generateTemporaryPassword(): string {
  // Generate a more user-friendly temporary password
  const adjectives = ["Happy", "Sunny", "Quick", "Bright", "Clever", "Gentle", "Brave", "Calm"]
  const nouns = ["Tiger", "Eagle", "Dolphin", "Panda", "Phoenix", "Wolf", "Lion", "Falcon"]
  const numbers = Math.floor(100 + Math.random() * 900) // 3-digit number
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  
  return `${adjective}${noun}${numbers}!`
}