/**
 * AES-256-GCM Encryption Utilities for PHI/Sensitive Data
 *
 * Provides enterprise-grade encryption for Protected Health Information (PHI)
 * and other sensitive data in compliance with POPIA and healthcare regulations.
 *
 * Features:
 * - AES-256-GCM authenticated encryption
 * - Unique IV per record for security
 * - Authentication tags for data integrity
 * - Secure key derivation from environment variables
 */

import { webcrypto } from "crypto"

const crypto = webcrypto as unknown as Crypto

// Encryption configuration
const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits (recommended for GCM)
const TAG_LENGTH = 128 // 128 bits (standard for GCM)

/**
 * Get encryption key from environment variable
 * Key should be a base64-encoded 32-byte key
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }

  // Validate key format (should be base64 and decode to 32 bytes)
  try {
    const decoded = Buffer.from(key, "base64")
    if (decoded.length !== 32) {
      throw new Error("Encryption key must be 32 bytes (256 bits)")
    }
  } catch (error) {
    throw new Error("Invalid ENCRYPTION_KEY format. Must be base64-encoded 32-byte key")
  }

  return key
}

/**
 * Import the encryption key for use with Web Crypto API
 */
async function importKey(): Promise<CryptoKey> {
  const keyString = getEncryptionKey()
  const keyData = Buffer.from(keyString, "base64")

  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // not extractable
    ["encrypt", "decrypt"],
  )
}

/**
 * Encrypt sensitive data using AES-256-GCM
 *
 * @param plaintext - The data to encrypt
 * @returns Object containing encrypted data, IV, and auth tag
 */
export async function encrypt(plaintext: string): Promise<{
  ciphertext: string
  iv: string
  tag: string
}> {
  if (!plaintext || plaintext.trim() === "") {
    throw new Error("Cannot encrypt empty data")
  }

  try {
    // Generate unique IV for this encryption
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    // Import encryption key
    const key = await importKey()

    // Encode plaintext to bytes
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      data,
    )

    // Convert to Buffer for processing
    const encryptedBuffer = Buffer.from(encryptedData)

    // Split ciphertext and authentication tag
    // GCM appends the tag to the ciphertext
    const tagStart = encryptedBuffer.length - TAG_LENGTH / 8
    const ciphertext = encryptedBuffer.subarray(0, tagStart)
    const tag = encryptedBuffer.subarray(tagStart)

    return {
      ciphertext: ciphertext.toString("base64"),
      iv: Buffer.from(iv).toString("base64"),
      tag: tag.toString("base64"),
    }
  } catch (error) {
    console.error("[v0] Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 *
 * @param ciphertext - Base64-encoded encrypted data
 * @param iv - Base64-encoded initialization vector
 * @param tag - Base64-encoded authentication tag
 * @returns Decrypted plaintext
 */
export async function decrypt(ciphertext: string, iv: string, tag: string): Promise<string> {
  if (!ciphertext || !iv || !tag) {
    throw new Error("Ciphertext, IV, and tag are required for decryption")
  }

  try {
    // Import encryption key
    const key = await importKey()

    // Decode from base64
    const ciphertextBuffer = Buffer.from(ciphertext, "base64")
    const ivBuffer = Buffer.from(iv, "base64")
    const tagBuffer = Buffer.from(tag, "base64")

    // Concatenate ciphertext and tag (GCM expects them together)
    const encryptedData = Buffer.concat([ciphertextBuffer, tagBuffer])

    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivBuffer,
        tagLength: TAG_LENGTH,
      },
      key,
      encryptedData,
    )

    // Decode to string
    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  } catch (error) {
    console.error("[v0] Decryption error:", error)
    throw new Error("Failed to decrypt data - data may be corrupted or key is incorrect")
  }
}

/**
 * Encrypt multiple fields in an object
 * Fields to encrypt should be specified in the fieldsToEncrypt array
 *
 * @param data - Object containing fields to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @returns Object with encrypted fields (with _enc suffix) and encryption metadata
 */
export async function encryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: (keyof T)[],
): Promise<Record<string, any>> {
  const result: Record<string, any> = { ...data }

  for (const field of fieldsToEncrypt) {
    const value = data[field]

    if (value !== null && value !== undefined && value !== "") {
      const encrypted = await encrypt(String(value))

      // Store encrypted data with _enc suffix
      result[`${String(field)}_enc`] = encrypted.ciphertext
      result[`${String(field)}_iv`] = encrypted.iv
      result[`${String(field)}_tag`] = encrypted.tag

      // Remove plaintext field
      delete result[field]
    }
  }

  return result
}

/**
 * Decrypt multiple fields in an object
 *
 * @param data - Object containing encrypted fields (with _enc suffix)
 * @param fieldsToDecrypt - Array of original field names (without _enc suffix)
 * @returns Object with decrypted plaintext fields
 */
export async function decryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: string[],
): Promise<Record<string, any>> {
  const result: Record<string, any> = { ...data }

  for (const field of fieldsToDecrypt) {
    const encField = `${field}_enc`
    const ivField = `${field}_iv`
    const tagField = `${field}_tag`

    if (data[encField] && data[ivField] && data[tagField]) {
      try {
        const decrypted = await decrypt(data[encField], data[ivField], data[tagField])
        result[field] = decrypted
      } catch (error) {
        console.error(`[v0] Failed to decrypt field ${field}:`, error)
        result[field] = null // Set to null if decryption fails
      }

      // Remove encrypted fields from result
      delete result[encField]
      delete result[ivField]
      delete result[tagField]
    }
  }

  return result
}

/**
 * Generate a new encryption key (for initial setup)
 * This should be run once and the key stored securely in environment variables
 *
 * @returns Base64-encoded 32-byte encryption key
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(32))
  return Buffer.from(key).toString("base64")
}

/**
 * Validate that encryption is properly configured
 * This should be called on application startup
 */
export function validateEncryptionConfig(): boolean {
  try {
    getEncryptionKey()
    return true
  } catch (error) {
    console.error("[v0] Encryption configuration validation failed:", error)
    return false
  }
}
