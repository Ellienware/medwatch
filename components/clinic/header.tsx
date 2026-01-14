import { getCurrentUser } from "@/lib/auth/actions"
import { UserMenu } from "@/components/clinic/user-menu"
import { MobileSidebar } from "@/components/clinic/mobile-sidebar"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"

export async function ClinicHeader() {
  const user = await getCurrentUser()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <MobileSidebar />
        <h2 className="text-lg font-semibold lg:text-xl">Welcome, {user?.full_name.split(" ")[0] || "User"}</h2>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsDropdown />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
