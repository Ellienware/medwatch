"use client"

import type React from "react"
import { resetPassword } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const result = await resetPassword(email)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result?.message) {
      setSuccess(result.message)
      setSubmitted(true)
    }

    setLoading(false)
  }

  if (submitted && success) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
        
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">What to do next:</p>
          <ul className="mt-2 space-y-1 text-sm text-blue-700">
            <li>• Check your email inbox for the reset link</li>
            <li>• The link expires in 1 hour</li>
            <li>• Check spam folder if you don't see it</li>
            <li>• Contact support if you need assistance</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Button asChild className="w-full h-11">
            <Link href="/auth/sign-in">
              Back to Sign In
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-11"
            onClick={() => {
              setEmail("")
              setSubmitted(false)
              setSuccess("")
            }}
          >
            Send Another Reset Link
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Enter the email address associated with your account
        </p>
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>
    </form>
  )
}