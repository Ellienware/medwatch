// components/clinic/billing/branch-subscriptions.tsx - UPDATED
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, CheckCircle2, XCircle, Clock, Building, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/paystack/config"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCurrentUser } from "@/lib/auth/actions"
import { getBranchRepository, getSubscriptionRepository } from "@/lib/repositories"
import Link from "next/link"

async function getBranchesAndSubscription() {
  const user = await getCurrentUser()
  if (!user?.clinic_id) {
    return { branches: [], subscription: null }
  }

  const branchRepo = getBranchRepository()
  const subscriptionRepo = getSubscriptionRepository()
  
  // Get ALL branches (active and inactive)
  const branches = await branchRepo.findByClinicId(user.clinic_id)
  
  // Get current subscription
  const subscription = await subscriptionRepo.findActiveOrTrialByClinicId(user.clinic_id)

  return { branches, subscription }
}

export async function BranchSubscriptions() {
  const { branches, subscription } = await getBranchesAndSubscription()

  console.log("🔍 BranchSubscriptions - Found branches:", branches.length)
  console.log("🔍 BranchSubscriptions - Subscription:", subscription)

  if (branches.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          No branches found. Add your first branch to get started.
        </p>
        <Button asChild>
          <Link href="/clinic/billing/add-branch">
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Link>
        </Button>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      active: { variant: "default", icon: CheckCircle2, label: "Active" },
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      trial: { variant: "secondary", icon: Clock, label: "Trial" },
      cancelled: { variant: "destructive", icon: XCircle, label: "Cancelled" },
      suspended: { variant: "outline", icon: XCircle, label: "Suspended" },
      past_due: { variant: "destructive", icon: XCircle, label: "Past Due" },
    }

    const config = variants[status] || variants.active
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Subscription Summary */}
      {subscription && (
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Current Plan</h3>
              <p className="text-sm text-muted-foreground">
                {subscription.pricing_tier === "single_branch" ? "Single Branch" : "Multi-Branch"} Plan
                {subscription.status === "trial" && " (Trial)"}
              </p>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatCurrency(subscription.amount)}/month
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription.total_branches || 1} branch{(subscription.total_branches || 1) > 1 ? 'es' : ''} included
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Branches List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Your Branches ({branches.length})</h3>
            <p className="text-sm text-muted-foreground">
              All branches associated with your clinic
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/clinic/billing/add-branch">
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Link>
          </Button>
        </div>
        
        <div className="space-y-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{branch.name}</h3>
                      <Badge variant="outline" className="text-xs">{branch.code}</Badge>
                      {branch.is_active ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      {branch.email && <span>{branch.email}</span>}
                      {branch.phone && (
                        <>
                          <span>•</span>
                          <span>{branch.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/clinic/branches/${branch.id}`}>
                    View
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/clinic/branches/${branch.id}/edit`}>
                        Edit Branch
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      {branch.is_active ? "Deactivate" : "Activate"} Branch
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}