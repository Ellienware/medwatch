// components/clinic/certificates/download-certificate-button.tsx - Updated
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DownloadCertificateButtonProps {
  certificateId: string
  certificateType?: string
}

export function DownloadCertificateButton({ 
  certificateId,
  certificateType = "fit_to_work" 
}: DownloadCertificateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)

    try {
      // Use the fitness certificate endpoint for all certificates
      // (since all certificates must use the fixed fitness template)
      const response = await fetch("/api/certificates/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateId }),
      })

      if (!response.ok) {
        const error = await response.json()
        
        // Handle single page constraint error
        if (error.code === "SINGLE_PAGE_LIMIT") {
          toast.error("Certificate content is too large. Please reduce content or contact support.")
          return
        }
        
        throw new Error(error.error || "Failed to generate PDF")
      }

      const data = await response.json()

      if (data.pdfUrl) {
        // Open PDF in new tab
        window.open(data.pdfUrl, "_blank")
        toast.success("Fitness Certificate PDF generated successfully")
      }
    } catch (error) {
      console.error("[v0] Error downloading certificate:", error)
      toast.error(error instanceof Error ? error.message : "Failed to download certificate")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          PDF
        </>
      )}
    </Button>
  )
}
