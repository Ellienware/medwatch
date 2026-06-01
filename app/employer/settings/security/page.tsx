"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, Shield, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
export const dynamic = 'force-dynamic'
export default function SecuritySettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

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
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    const { isValid, errors } = validatePassword(formData.newPassword)
    if (!isValid) {
      toast.error("Password must meet all requirements: " + errors.join(", "))
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password")
      }

      toast.success("Password changed successfully")
      setShowSuccess(true)
      
      // Clear form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      // Refresh session
      setTimeout(() => {
        router.refresh()
      }, 2000)

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to change password"
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Security Settings</h1>
          <p className="text-muted-foreground">Manage your account security and password</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Password Changed Successfully
            </CardTitle>
            <CardDescription>
              Your password has been updated. Please use your new password for future logins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowSuccess(false)}>
              Change Password Again
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Tips
            </CardTitle>
            <CardDescription>Best practices for account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Password Guidelines</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use a unique password that you don't use elsewhere</li>
                <li>• Change your password every 90 days</li>
                <li>• Never share your password with anyone</li>
                <li>• Use a password manager to generate and store strong passwords</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Security Settings</h1>
        <p className="text-muted-foreground">Manage your account security and password</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                placeholder="Enter current password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                placeholder="Enter new password"
                required
                disabled={isLoading}
              />
              <div className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, number, and special character.
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">Security Notice</p>
              </div>
              <p className="mt-1 text-sm text-yellow-700">
                After changing your password, you'll be automatically signed out from other devices and sessions.
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Tips
          </CardTitle>
          <CardDescription>Best practices for account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Password Guidelines</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Use a unique password that you don't use elsewhere</li>
              <li>• Change your password every 90 days</li>
              <li>• Never share your password with anyone</li>
              <li>• Use a password manager to generate and store strong passwords</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Session Security</h4>
            <p className="text-sm text-muted-foreground">
              For enhanced security, always log out from shared computers and avoid using public Wi-Fi for sensitive operations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
