"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Settings, 
  Users, 
  Building, 
  FileText, 
  Bell, 
  Shield,
  CreditCard,
  Palette
} from "lucide-react"

const settingsItems = [
  {
    title: "General",
    href: "/clinic/settings",
    icon: Settings,
  },
  {
    title: "Users & Permissions",
    href: "/clinic/settings/users",
    icon: Users,
  },
  {
    title: "Branches",
    href: "/clinic/settings/branches",
    icon: Building,
  },
  {
    title: "Certificate Settings",
    href: "/clinic/settings/certificates",
    icon: Palette,
  },
  {
    title: "Templates",
    href: "/clinic/settings/templates",
    icon: FileText,
  },
  {
    title: "Notifications",
    href: "/clinic/settings/notifications",
    icon: Bell,
  },
  {
    title: "Security",
    href: "/clinic/settings/security",
    icon: Shield,
  },
  {
    title: "Billing",
    href: "/clinic/settings/billing",
    icon: CreditCard,
  },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-1">
      {settingsItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
