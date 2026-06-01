// app/components/clinic-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  TestTube2,
  FileText,
  Building,
  CreditCard,
  Settings,
  Activity,
  Bell,
  BarChart3,
  ClipboardList,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/clinic", icon: LayoutDashboard },
  { name: "Appointments", href: "/clinic/appointments", icon: Calendar },
  { name: "Assessments", href: "/clinic/assessments", icon: ClipboardList },
  { name: "Patients", href: "/clinic/patients", icon: Users },
  { name: "Tests & Results", href: "/clinic/tests", icon: TestTube2 },
  { name: "Certificates", href: "/clinic/certificates", icon: FileText },
  { name: "Employers", href: "/clinic/employers", icon: Building },
  { name: "Reports", href: "/clinic/reports", icon: BarChart3 },
  { name: "Notifications", href: "/clinic/notifications", icon: Bell },
  { name: "Billing", href: "/clinic/billing", icon: CreditCard },
  { name: "Staff", href: "/clinic/staff", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function ClinicSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5 text-primary-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">MedWatch</span>
          <span className="text-xs text-muted-foreground">Clinic Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          // FIXED LOGIC: Dashboard needs special handling
          const isActive = item.name === "Dashboard"
            ? pathname === "/clinic" || pathname === "/clinic/"
            : pathname === item.href || pathname?.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
