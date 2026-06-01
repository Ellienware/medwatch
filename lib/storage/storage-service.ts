import { createServerClient } from "@/lib/appwrite/server-client"
import { createBrowserClient } from "@/lib/appwrite/browser-client"
import { STORAGE_BUCKET_ID, FILE_PREFIXES } from "@/lib/appwrite/config"
import { ID, Permission, Role } from "appwrite"
import type { UploadProgress } from "appwrite"
import logger from "@/lib/logging/logger"

export type FilePrefix = keyof typeof FILE_PREFIXES

interface UploadOptions {
  prefix?: FilePrefix
  permissions?: string[]
  onProgress?: (progress: UploadProgress) => void
}

interface UploadResult {
  fileId: string
  fileName: string
  fileUrl: string
  size: number
}

/**
 * Storage service for handling file uploads to Appwrite
 */
export class StorageService {
  private isServer: boolean

  constructor(isServer = false) {
    this.isServer = isServer
  }

  private async getStorage() {
    if (this.isServer) {
      const client = await createServerClient()
      return client.storage
    } else {
      return createBrowserClient().storage
    }
  }

  /**
   * Upload a file to Appwrite storage
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      const storage = await this.getStorage()
      const { prefix, permissions, onProgress } = options

      // Generate file name with prefix
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const fileName = prefix
        ? `${FILE_PREFIXES[prefix]}${timestamp}_${sanitizedName}`
        : `${timestamp}_${sanitizedName}`

      logger.info("Uploading file", { fileName, size: file.size, type: file.type })

      // Set default permissions if not provided
      const filePermissions = permissions || [
        Permission.read(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ]

      // Upload file
      const response = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file,
        filePermissions,
        onProgress
      )

      const fileUrl = this.getFileUrl(response.$id)

      logger.info("File uploaded successfully", {
        fileId: response.$id,
        fileName: response.name,
      })

      return {
        fileId: response.$id,
        fileName: response.name,
        fileUrl,
        size: file.size,
      }
    } catch (error) {
      logger.error("Failed to upload file", error, { fileName: file.name })
      throw new Error("Failed to upload file")
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[], options: UploadOptions = {}): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options))
    return Promise.all(uploadPromises)
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const storage = await this.getStorage()
      await storage.deleteFile(STORAGE_BUCKET_ID, fileId)
      logger.info("File deleted successfully", { fileId })
    } catch (error) {
      logger.error("Failed to delete file", error, { fileId })
      throw new Error("Failed to delete file")
    }
  }

  /**
   * Get file URL for viewing/downloading
   */
  getFileUrl(fileId: string): string {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    return `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/view?project=${projectId}`
  }

  /**
   * Get file download URL
   */
  getFileDownloadUrl(fileId: string): string {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    return `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/download?project=${projectId}`
  }

  /**
   * Get file preview URL (for images)
   */
  getFilePreview(fileId: string, width = 400, height = 400, quality = 80): string {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    return `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/preview?project=${projectId}&width=${width}&height=${height}&quality=${quality}`
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    options?: { maxSize?: number; allowedTypes?: string[] },
  ): { valid: boolean; error?: string } {
    const maxSize = options?.maxSize || 10 * 1024 * 1024 // 10MB default
    const allowedTypes = options?.allowedTypes || []

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit`,
      }
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      }
    }

    return { valid: true }
  }

  /**
   * Helper method to convert UploadProgress to simple percentage
   */
  static createProgressCallback(
    callback: (progress: number) => void
  ): (progress: UploadProgress) => void {
    return (progress: UploadProgress) => {
      // Type assertion to 'any' to bypass TypeScript checking
      const progressAny = progress as any
      
      // Option 1: Check if it's a number (percentage)
      if (typeof progressAny === 'number') {
        callback(progressAny)
        return
      }
      
      // Option 2: Check for 'progress' property (percentage)
      if (typeof progressAny.progress === 'number') {
        callback(progressAny.progress)
        return
      }
      
      // Option 3: Check for uploaded/total pattern
      if (typeof progressAny.total === 'number' && progressAny.total > 0) {
        const uploaded = progressAny.uploaded || progressAny.loaded || progressAny.sizeUploaded || progressAny.chunksUploaded || 0
        const percentage = (uploaded / progressAny.total) * 100
        callback(percentage)
        return
      }
      
      // Option 4: Check for sizeTotal pattern
      if (typeof progressAny.sizeTotal === 'number' && progressAny.sizeTotal > 0) {
        const uploaded = progressAny.sizeUploaded || 0
        const percentage = (uploaded / progressAny.sizeTotal) * 100
        callback(percentage)
        return
      }
      
      // Option 5: Check for chunks pattern
      if (typeof progressAny.chunksTotal === 'number' && progressAny.chunksTotal > 0) {
        const uploaded = progressAny.chunksUploaded || 0
        const percentage = (uploaded / progressAny.chunksTotal) * 100
        callback(percentage)
        return
      }
      
      // Default: progress is unknown
      callback(0)
    }
  }
}

// Export singleton instances
export const serverStorageService = new StorageService(true)
export const clientStorageService = new StorageService(false)

export const storageService = clientStorageService
