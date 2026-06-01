// components/employer/employer-actions.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { resetEmployerPassword } from "@/lib/actions/employer-actions"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface EmployerActionsProps {
  employerId: string
  employerName: string
  isActive: boolean
  portalEnabled: boolean
  portalUserId?: string | null
}

export function EmployerActions({ 
  employerId, 
  employerName, 
  isActive, 
  portalEnabled,
  portalUserId
}: EmployerActionsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)

  const handleResetPassword = async () => {
    setLoading("password")
    try {
      const result = await resetEmployerPassword(employerId)
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Password reset email sent successfully",
        })
        setShowResetDialog(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send password reset",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {/* Reset Password Button */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <Button 
          variant="outline" 
          className="w-full" 
          disabled={!portalEnabled || loading === "password"}
          onClick={() => setShowResetDialog(true)}
        >
          {loading === "password" ? "Processing..." : "Reset Portal Password"}
        </Button>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Portal Password</DialogTitle>
            <DialogDescription>
              This will send a password reset email to {employerName}'s email address.
              {!portalUserId && " A user account will be created first."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={loading === "password"}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleResetPassword}
              disabled={loading === "password"}
            >
              {loading === "password" ? "Sending..." : "Send Reset Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
