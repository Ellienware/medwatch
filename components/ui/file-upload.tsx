"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, File, ImageIcon, FileText, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFileUpload, type FilePrefix } from "@/hooks/use-file-upload"

interface FileUploadProps {
  prefix?: FilePrefix
  maxSize?: number
  allowedTypes?: string[]
  maxFiles?: number
  accept?: Record<string, string[]>
  onUploadComplete?: (fileUrl: string, fileId: string) => void
  onMultipleUploadComplete?: (results: Array<{ fileUrl: string; fileId: string }>) => void
  className?: string
}

export function FileUpload({
  prefix,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes,
  maxFiles = 1,
  accept,
  onUploadComplete,
  onMultipleUploadComplete,
  className,
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const { uploadFile, uploadMultiple, isUploading, progress, reset } = useFileUpload({
    prefix,
    maxSize,
    allowedTypes,
    onSuccess: (fileUrl, fileId) => {
      onUploadComplete?.(fileUrl, fileId)
      setSelectedFiles([])
    },
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (maxFiles === 1) {
        setSelectedFiles([acceptedFiles[0]])
      } else {
        setSelectedFiles((prev) => [...prev, ...acceptedFiles].slice(0, maxFiles))
      }
    },
    [maxFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: accept || {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    disabled: isUploading,
  })

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    if (selectedFiles.length === 1) {
      await uploadFile(selectedFiles[0])
    } else {
      const results = await uploadMultiple(selectedFiles)
      if (results && onMultipleUploadComplete) {
        onMultipleUploadComplete(results.map((r) => ({ fileUrl: r.fileUrl, fileId: r.fileId })))
      }
      setSelectedFiles([])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-8 w-8" />
    if (type.startsWith("video/")) return <Video className="h-8 w-8" />
    if (type.includes("pdf")) return <FileText className="h-8 w-8" />
    return <File className="h-8 w-8" />
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            isUploading && "pointer-events-none opacity-50",
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn("mb-4 h-12 w-12 text-muted-foreground", isDragActive && "text-primary")} />
          <p className="mb-2 text-center text-sm font-medium">
            {isDragActive ? "Drop files here" : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Maximum file size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
            {maxFiles > 1 && ` • Up to ${maxFiles} files`}
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{getFileIcon(file.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                {!isUploading && (
                  <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {isUploading && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">Uploading... {progress}%</p>
          </div>
        )}

        {selectedFiles.length > 0 && !isUploading && (
          <div className="mt-4 flex gap-2">
            <Button onClick={handleUpload} className="flex-1">
              Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Files` : "File"}
            </Button>
            <Button variant="outline" onClick={() => setSelectedFiles([])}>
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
