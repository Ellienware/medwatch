"use client"

import { useState } from "react"
import { clientStorageService } from "@/lib/storage/storage-service"
import { toast } from "sonner"
import type { FilePrefix } from "@/lib/storage/storage-service"

interface UseFileUploadOptions {
  prefix?: FilePrefix
  maxSize?: number
  allowedTypes?: string[]
  onSuccess?: (fileUrl: string, fileId: string) => void
  onError?: (error: Error) => void
}

interface UploadState {
  isUploading: boolean
  progress: number
  fileUrl: string | null
  fileId: string | null
  error: string | null
}

export type { FilePrefix }

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    fileUrl: null,
    fileId: null,
    error: null,
  })

  const uploadFile = async (file: File) => {
    // Validate file
    const validation = clientStorageService.validateFile(file, {
      maxSize: options.maxSize,
      allowedTypes: options.allowedTypes,
    })

    if (!validation.valid) {
      const errorMsg = validation.error || "Invalid file"
      setState((prev) => ({ ...prev, error: errorMsg }))
      toast.error(errorMsg)
      options.onError?.(new Error(errorMsg))
      return null
    }

    setState({
      isUploading: true,
      progress: 0,
      fileUrl: null,
      fileId: null,
      error: null,
    })

    try {
      const result = await clientStorageService.uploadFile(file, {
        prefix: options.prefix,
        onProgress: (progress) => {
          setState((prev) => ({ ...prev, progress }))
        },
      })

      setState({
        isUploading: false,
        progress: 100,
        fileUrl: result.fileUrl,
        fileId: result.fileId,
        error: null,
      })

      toast.success("File uploaded successfully")
      options.onSuccess?.(result.fileUrl, result.fileId)

      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to upload file"
      setState({
        isUploading: false,
        progress: 0,
        fileUrl: null,
        fileId: null,
        error: errorMsg,
      })
      toast.error(errorMsg)
      options.onError?.(error instanceof Error ? error : new Error(errorMsg))
      return null
    }
  }

  const uploadMultiple = async (files: File[]) => {
    setState({
      isUploading: true,
      progress: 0,
      fileUrl: null,
      fileId: null,
      error: null,
    })

    try {
      // Validate all files first
      for (const file of files) {
        const validation = clientStorageService.validateFile(file, {
          maxSize: options.maxSize,
          allowedTypes: options.allowedTypes,
        })

        if (!validation.valid) {
          throw new Error(validation.error || "Invalid file")
        }
      }

      const results = await clientStorageService.uploadFiles(files, {
        prefix: options.prefix,
      })

      setState({
        isUploading: false,
        progress: 100,
        fileUrl: results[0]?.fileUrl || null,
        fileId: results[0]?.fileId || null,
        error: null,
      })

      toast.success(`${results.length} file(s) uploaded successfully`)
      return results
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to upload files"
      setState({
        isUploading: false,
        progress: 0,
        fileUrl: null,
        fileId: null,
        error: errorMsg,
      })
      toast.error(errorMsg)
      options.onError?.(error instanceof Error ? error : new Error(errorMsg))
      return null
    }
  }

  const reset = () => {
    setState({
      isUploading: false,
      progress: 0,
      fileUrl: null,
      fileId: null,
      error: null,
    })
  }

  return {
    ...state,
    uploadFile,
    uploadMultiple,
    reset,
  }
}
