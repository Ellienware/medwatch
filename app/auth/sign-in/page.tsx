import { LoginForm } from "@/components/auth/login-form"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Building, Key } from "lucide-react"
import Link from "next/link"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }> // This is a Promise!
}) {
  // First, await the searchParams Promise
  const params = await searchParams
  const message = params.message
  
  // Check if user already has a session
  const cookieStore = await cookies()
  const hasUserId = cookieStore.get('appwrite-user-id')?.value
  
  if (hasUserId) {
    try {
      const user = await getCurrentUser()
      
      if (user) {
        // Redirect based on role
        if (user.role === 'employer') {
          redirect("/employer")
        } else if (user.role === 'clinic_admin') {
          redirect("/clinic")
        } else {
          redirect("/dashboard")
        }
      } else {
        // User needs onboarding
        redirect("/auth/onboarding")
      }
    } catch (error) {
      // Session might be invalid
      console.log("SignInPage: Error checking user:", error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
          
          {message === 'password_reset' && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-800">
                ✅ Password reset successfully! Please sign in with your new password.
              </p>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <LoginForm />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">Employer Portal Access</h4>
              </div>
              <p className="mt-1 text-sm text-blue-700">
                If you're an employer logging in for the first time, use the temporary password sent to your email.
                Please change your password after first login.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 inline-flex items-center"
            >
              <Key className="mr-1 h-4 w-4" />
              Forgot your password?
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  )
}