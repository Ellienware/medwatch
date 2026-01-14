"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Key, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  const userId = searchParams.get("userId")
  const secret = searchParams.get("secret")

  useEffect(() => {
    console.log('Reset password page loaded with:', {
      userId,
      secret: secret ? '***' + secret.substring(-10) : 'none',
      searchParams: Object.fromEntries(searchParams.entries())
    })
    
    if (userId && secret) {
      setIsValid(true)
      setIsValidating(false)
    } else {
      setError("Invalid or expired reset link. Please request a new password reset.")
      setIsValid(false)
      setIsValidating(false)
    }
  }, [userId, secret, searchParams])

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: [
        password.length >= minLength ? null : `At least ${minLength} characters`,
        hasUpperCase ? null : "One uppercase letter",
        hasLowerCase ? null : "One lowercase letter",
        hasNumbers ? null : "One number",
        hasSpecialChar ? null : "One special character",
      ].filter(Boolean) as string[],
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('FORM SUBMIT STARTED')
    console.log('Form data:', {
      userId,
      secret: secret ? '***' + secret.substring(-10) : 'none',
      password: formData.password,
      confirmPassword: formData.confirmPassword
    })
    
    if (!userId || !secret) {
      console.error('Missing userId or secret')
      toast.error("Invalid reset link")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      console.error('Passwords do not match:', {
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })
      toast.error("Passwords do not match")
      return
    }

    const { isValid: validPassword, errors } = validatePassword(formData.password)
    if (!validPassword) {
      console.error('Password validation failed:', errors)
      toast.error("Password must meet all requirements: " + errors.join(", "))
      return
    }

    console.log('All validations passed, calling API...')
    setIsLoading(true)

    try {
      const payload = {
        userId,
        secret,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      }
      
      console.log('Sending API request with payload:', {
        ...payload,
        secret: '***' + secret.substring(-10)
      })
      
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log('API response status:', response.status)
      console.log('API response headers:', Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log('API response data:', data)

      if (!response.ok) {
        console.error('API error response:', data)
        throw new Error(data.error || "Failed to reset password")
      }

      console.log('Password reset successful!')
      toast.success("Password reset successfully!")
      router.push("/auth/sign-in?message=password_reset")
    } catch (error) {
      console.error('Password reset catch error:', error)
      const errorMsg = error instanceof Error ? error.message : "Failed to reset password"
      toast.error(errorMsg)
    } finally {
      console.log('Form submission finished')
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Validating reset link...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/auth/forgot-password">
                  Request New Reset Link
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/sign-in">
                  Back to Sign In
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Key className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Create a new password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(e) => {
                    console.log('Password changed:', e.target.value)
                    setFormData({...formData, password: e.target.value})
                  }}
                  required
                  className="h-11"
                />
                <div className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    console.log('Confirm password changed:', e.target.value)
                    setFormData({...formData, confirmPassword: e.target.value})
                  }}
                  required
                  className="h-11"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading}
                onClick={() => console.log('Button clicked')}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}