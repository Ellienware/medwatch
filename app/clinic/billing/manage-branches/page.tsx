// app/clinic/billing/manage-branches/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, ArrowLeft, Building2, Plus, Trash2, Edit2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface Branch {
  id: string
  name: string
  code: string
  email: string
  phone: string
  address: string
  is_active: boolean
}

export default function ManageBranchesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newBranch, setNewBranch] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
  })
  const [showNewBranchForm, setShowNewBranchForm] = useState(false)

  // Load branches
  useEffect(() => {
    loadBranches()
  }, [])

  async function loadBranches() {
    try {
      const response = await fetch("/api/branches")
      const data = await response.json()
      
      if (response.ok) {
        setBranches(data.branches)
      } else {
        setError(data.error || "Failed to load branches")
      }
    } catch (error) {
      setError("Failed to load branches")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleActive(branchId: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/branches/${branchId}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })

      const data = await response.json()

      if (response.ok) {
        setBranches(branches.map(branch => 
          branch.id === branchId ? { ...branch, is_active: isActive } : branch
        ))
        setSuccess(`Branch ${isActive ? 'activated' : 'deactivated'} successfully`)
      } else {
        setError(data.error || "Failed to update branch")
      }
    } catch (error) {
      setError("Failed to update branch")
    }
  }

  async function handleAddBranch() {
    if (!newBranch.name || !newBranch.code || !newBranch.email) {
      setError("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranch),
      })

      const data = await response.json()

      if (response.ok) {
        setBranches([...branches, data.branch])
        setNewBranch({ name: "", code: "", email: "", phone: "", address: "" })
        setShowNewBranchForm(false)
        setSuccess("Branch added successfully")
        
        // Check if subscription needs update
        if (data.requiresSubscriptionUpdate) {
          setTimeout(() => {
            router.push("/clinic/billing/change-plan")
          }, 2000)
        }
      } else {
        setError(data.error || "Failed to add branch")
      }
    } catch (error) {
      setError("Failed to add branch")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading branches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Billing
        </Button>
        <h1 className="text-3xl font-bold mb-2">Manage Branches</h1>
        <p className="text-muted-foreground">
          Activate, deactivate, or add new branches to your clinic
        </p>
      </div>

      {/* Current Subscription Info */}
      <Card className="p-6 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1">Your Current Plan</h2>
            <p className="text-sm text-muted-foreground">
              Active branches: {branches.filter(b => b.is_active).length} of {branches.length} total
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/clinic/billing/change-plan")}
          >
            Change Plan
          </Button>
        </div>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Branches List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Branches</h2>
          <Button
            onClick={() => setShowNewBranchForm(true)}
            disabled={showNewBranchForm}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Branch
          </Button>
        </div>

        {/* New Branch Form */}
        {showNewBranchForm && (
          <div className="p-4 border rounded-lg mb-6 bg-muted/30">
            <h3 className="font-semibold mb-4">Add New Branch</h3>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Branch Name *</Label>
                  <Input
                    id="new-name"
                    placeholder="e.g., Johannesburg Branch"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-code">Branch Code *</Label>
                  <Input
                    id="new-code"
                    placeholder="e.g., JHB-001"
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email *</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="branch@clinic.com"
                    value={newBranch.email}
                    onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-phone">Phone</Label>
                  <Input
                    id="new-phone"
                    type="tel"
                    placeholder="011 123 4567"
                    value={newBranch.phone}
                    onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-address">Address</Label>
                <Input
                  id="new-address"
                  placeholder="123 Main Street, Johannesburg, 2000"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleAddBranch}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Branch
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewBranchForm(false)
                    setNewBranch({ name: "", code: "", email: "", phone: "", address: "" })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Branches Table */}
        <div className="space-y-4">
          {branches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No branches found</p>
              <p className="text-sm">Add your first branch to get started</p>
            </div>
          ) : (
            branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{branch.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {branch.code} • {branch.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={branch.is_active}
                      onCheckedChange={(checked) => handleToggleActive(branch.id, checked)}
                    />
                    <span className="text-sm">
                      {branch.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Important Notes */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Important Notes</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Active branches count toward your subscription limits</li>
          <li>• Deactivating a branch does not delete it, you can reactivate it later</li>
          <li>• Adding more active branches than your plan allows may require a plan upgrade</li>
          <li>• Branch changes may affect your monthly subscription cost</li>
        </ul>
      </Card>
    </div>
  )
}