"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  fallback: string
  onUploadComplete: (fileUrl: string, fileId: string) => void
  onRemove?: () => void
  className?: string
}

export function AvatarUpload({ currentAvatarUrl, fallback, onUploadComplete, onRemove, className }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null)

  const { uploadFile, isUploading, progress } = useFileUpload({
    prefix: "AVATARS",
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    onSuccess: (fileUrl, fileId) => {
      setPreviewUrl(fileUrl)
      onUploadComplete(fileUrl, fileId)
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    await uploadFile(file)
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onRemove?.()
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || undefined} alt="Avatar" />
          <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
            <div className="text-xs font-medium">{progress}%</div>
          </div>
        )}
        {previewUrl && !isUploading && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={isUploading} asChild>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? "Change" : "Upload"} Photo
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        </Button>
      </div>
    </div>
  )
}
