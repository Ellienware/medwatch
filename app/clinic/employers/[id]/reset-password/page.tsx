"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Key, Mail } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function ResetEmployerPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const employerId = params.id as string

  const handleResetPassword = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/clinic/employers/${employerId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email")
      }

      toast.success("Password reset email sent successfully")
      router.push(`/clinic/employers/${employerId}`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred"
      toast.error(errorMsg)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clinic/employers/${employerId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Reset Employer Password</h1>
          <p className="text-muted-foreground">Send password reset instructions to employer</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password Reset
          </CardTitle>
          <CardDescription>
            This will send a password reset email to the employer's registered email address.
            They will receive instructions to set a new password for their portal access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Key className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>The employer will receive an email with password reset instructions</li>
                    <li>They must use the link in the email to set a new password</li>
                    <li>The reset link expires after 1 hour</li>
                    <li>If they don't receive the email, check spam folder or resend</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/clinic/employers/${employerId}`)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
