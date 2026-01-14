import { getCurrentUser } from "@/lib/auth/actions"
import { UserMenu } from "@/components/clinic/user-menu"
import { Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { LayoutDashboard, Users, FileText, BarChart3, Building } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/employer", icon: LayoutDashboard },
  { name: "Employees", href: "/employer/employees", icon: Users },
  { name: "Certificates", href: "/employer/certificates", icon: FileText },
  { name: "Reports", href: "/employer/reports", icon: BarChart3 },
]

export async function EmployerHeader() {
  const user = await getCurrentUser()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-16 items-center gap-2 border-b px-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Building className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">MedSurveillance</span>
                <span className="text-xs text-muted-foreground">Employer Portal</span>
              </div>
            </div>
            <nav className="space-y-1 p-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <h2 className="text-lg font-semibold lg:text-xl">Welcome back</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <UserMenu user={user} />
      </div>
    </header>
  )
}
