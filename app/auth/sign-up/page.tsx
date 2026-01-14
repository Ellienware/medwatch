import { SignupForm } from "@/components/auth/signup-form"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/actions"

export default async function SignUpPage() {
  // Check if user already has a session (check user-id cookie)
  const cookieStore = await cookies()
  const hasUserId = cookieStore.get('appwrite-user-id')?.value
  
  console.log("SignUpPage: Checking for user-id cookie:", !!hasUserId)
  
  if (hasUserId) {
    try {
      console.log("SignUpPage: Found user-id cookie, checking database user...")
      const user = await getCurrentUser()
      
      console.log("SignUpPage: Database user found:", !!user)
      
      if (user) {
        // User has profile, redirect to dashboard
        console.log("SignUpPage: Redirecting to dashboard")
        redirect("/dashboard")
      } else {
        // User needs onboarding
        console.log("SignUpPage: Redirecting to onboarding")
        redirect("/auth/onboarding")
      }
    } catch (error) {
      // Session might be invalid, let them sign up
      console.log("SignUpPage: Error checking user:", error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>
        <SignupForm />
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/auth/sign-in" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}