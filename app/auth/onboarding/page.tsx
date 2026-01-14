"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUserProfile, getAuthUser } from "@/lib/auth/actions"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [role, setRole] = useState<string>("clinic_admin")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [specialization, setSpecialization] = useState("")
  const [professionalRegNumber, setProfessionalRegNumber] = useState("")

  useEffect(() => {
    async function checkUser() {
      try {
        // Check if user is authenticated via Appwrite
        const authUser = await getAuthUser()
        
        if (!authUser) {
          // No Appwrite session found
          toast({
            title: "Session expired",
            description: "Please sign in again",
            variant: "destructive",
          })
          router.push("/auth/sign-in")
          return
        }
        
        setUser(authUser)
        setPageLoading(false)
      } catch (error) {
        console.error("Error checking user:", error)
        toast({
          title: "Error",
          description: "Failed to load user information. Please try again.",
          variant: "destructive",
        })
        router.push("/auth/sign-in")
      }
    }
    
    checkUser()
  }, [router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "User not found. Please sign in again.",
        variant: "destructive",
      })
      router.push("/auth/sign-in")
      return
    }

    setIsLoading(true)

    try {
      const result = await createUserProfile(
        role as any,
        {
          specialization: specialization || undefined,
          professionalRegNumber: professionalRegNumber || undefined,
        }
      )

      // Handle the response
      if (result.success === false) {
        // This is the error case { success: false; error: any; }
        const errorMessage = 'error' in result ? result.error : "Failed to complete onboarding"
        toast({
          title: "Error",
          description: String(errorMessage),
          variant: "destructive",
        })
      } else {
        // This is the success case { success: true; message: string; clinicId: string | null; }
        const successMessage = 'message' in result ? result.message : "Profile created successfully!"
        toast({
          title: "Success",
          description: successMessage,
        })
        // Force a hard redirect to ensure middleware picks up the new session
        window.location.href = "/dashboard"
      }
    } catch (error: any) {
      console.error("Onboarding error:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const showProfessionalFields = role === "doctor" || role === "nurse"

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg font-medium">Loading your account...</p>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome, <span className="font-semibold">{user.name}</span>! 
            Tell us about your role to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">This is the email you signed up with</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  value={user.name}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">Your Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinic_admin">Clinic Administrator</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {role === "clinic_admin" && "You'll manage your own clinic and team"}
                  {role === "doctor" && "You'll examine patients and issue certificates"}
                  {role === "nurse" && "You'll conduct tests and record results"}
                  {role === "receptionist" && "You'll manage appointments and check-ins"}
                  {role === "employer" && "You'll view your employees' health certificates"}
                </p>
              </div>

              {showProfessionalFields && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="text-sm font-medium">
                      Specialization {role === "doctor" ? "(e.g., Occupational Health)" : "(optional)"}
                    </Label>
                    <Input
                      id="specialization"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="Enter your specialization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regNumber" className="text-sm font-medium">
                      Professional Registration Number
                    </Label>
                    <Input
                      id="regNumber"
                      value={professionalRegNumber}
                      onChange={(e) => setProfessionalRegNumber(e.target.value)}
                      placeholder="Enter your registration number"
                    />
                  </div>
                </>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Setting up your profile...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground pt-2">
              You can update these details later in your profile settings
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}