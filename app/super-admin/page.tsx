export const dynamic = 'force-dynamic';

import { StatsCard } from "@/components/super-admin/stats-card"
import { RecentClinics } from "@/components/super-admin/recent-clinics"
import { SystemHealth } from "@/components/super-admin/system-health"
import { Building2, Users, CreditCard, TrendingUp } from "lucide-react"
import { getClinicRepository, getUserRepository } from "@/lib/repositories"
import { Query } from "appwrite"

export default async function SuperAdminDashboard() {
  const clinicRepo = getClinicRepository()
  const userRepo = getUserRepository()

  const [totalClinics, activeClinics, totalUsers, activeSubscriptions] = await Promise.all([
    clinicRepo.count([]),
    clinicRepo.count([Query.equal("is_active", true)]),
    userRepo.count([]),
    clinicRepo.find([Query.equal("is_active", true), Query.equal("subscription_status", "active")]),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">System-wide overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Clinics"
          value={totalClinics}
          description={`${activeClinics} active`}
          icon={Building2}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Users"
          value={totalUsers}
          description="Across all clinics"
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Active Subscriptions"
          value={activeSubscriptions.length}
          description="Paying clinics"
          icon={CreditCard}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Monthly Revenue"
          value="R 245,800"
          description="+18% from last month"
          icon={TrendingUp}
          trend={{ value: 18, isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentClinics />
        <SystemHealth />
      </div>
    </div>
  )
}
