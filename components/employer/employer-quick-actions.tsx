// components/employer/employer-quick-actions.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { 
  sendEmployerWelcomeEmail, 
  toggleEmployerStatus 
} from "@/lib/actions/employer-actions"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EmployerQuickActionsProps {
  employerId: string
  employerName: string
  isActive: boolean
  portalEnabled: boolean
  portalUserId?: string | null
}

export function EmployerQuickActions({ 
  employerId, 
  employerName, 
  isActive, 
  portalEnabled,
  portalUserId
}: EmployerQuickActionsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)

  const handleSendWelcomeEmail = async () => {
    setLoading("welcome")
    try {
      const result = await sendEmployerWelcomeEmail(employerId)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Welcome email sent successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send welcome email",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send welcome email",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleToggleStatus = async () => {
    setLoading("status")
    try {
      const result = await toggleEmployerStatus(employerId, !isActive)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Status updated successfully",
        })
        setShowStatusDialog(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href={`/clinic/patients/new?employer=${employerId}`}>
            Add New Employee
          </Link>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={handleSendWelcomeEmail}
          disabled={loading === "welcome"}
        >
          {loading === "welcome" ? "Sending..." : "Send Welcome Email"}
        </Button>
        
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href={`/clinic/audit-logs?entity_type=employer&entity_id=${employerId}`}>
            View Audit Log
          </Link>
        </Button>
        
        <Button 
          variant={isActive ? "destructive" : "default"} 
          className="w-full justify-start"
          onClick={() => setShowStatusDialog(true)}
          disabled={loading === "status"}
        >
          {loading === "status" 
            ? "Processing..." 
            : isActive ? "Deactivate Employer" : "Activate Employer"
          }
        </Button>
      </div>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isActive ? "Deactivate Employer" : "Activate Employer"}
            </DialogTitle>
            <DialogDescription>
              {isActive 
                ? `Are you sure you want to deactivate ${employerName}? They will no longer be able to access the portal or receive certificates.`
                : `Are you sure you want to activate ${employerName}? They will regain access to the portal and can receive certificates.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
              disabled={loading === "status"}
            >
              Cancel
            </Button>
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={handleToggleStatus}
              disabled={loading === "status"}
            >
              {loading === "status" 
                ? "Processing..." 
                : isActive ? "Deactivate" : "Activate"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
