// components/ui/image-upload.tsx
"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Image as ImageIcon, Trash2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  endpoint: string
  maxSize?: number // in bytes
  accept?: string
  disabled?: boolean
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  endpoint,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = "image/*",
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    // Validate file type
    if (accept && !accept.includes(file.type) && accept !== "image/*") {
      setError("Invalid file type")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("file", file)
      formData.append("endpoint", endpoint)

      // Upload to your API endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange("")
    setError(null)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {value ? (
        <div className="space-y-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-md border">
            <img
              src={value}
              alt="Uploaded"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Label
            htmlFor="image-upload"
            className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 hover:border-muted-foreground/50"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Upload an image</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to {Math.round(maxSize / 1024 / 1024)}MB
                </p>
              </div>
            </div>
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />
        </div>
      )}

      {isUploading && (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {value && (
        <div className="text-xs text-muted-foreground">
          <p>Current image URL:</p>
          <code className="mt-1 block truncate rounded bg-muted p-1 text-[10px]">
            {value}
          </code>
        </div>
      )}
    </div>
  )
}