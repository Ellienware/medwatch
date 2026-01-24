import ProfilePageClient from "./profile-client"
import { getCurrentUserProfileWithEmployerData } from "@/lib/actions/user-actions"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  // Fetch user data with employer info if applicable
  const result = await getCurrentUserProfileWithEmployerData()
  
  if (!result.success || !result.data) {
    // Redirect to login if user not found
    redirect("/auth/sign-in")
  }

  return <ProfilePageClient initialUser={result.data} />
}