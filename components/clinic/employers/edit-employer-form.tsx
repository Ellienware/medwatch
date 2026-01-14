// components/employer/edit-employer-form.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { updateEmployer } from "@/lib/actions/employer-actions"
import type { Employer } from "@/lib/types/database"

interface EditEmployerFormProps {
  employer: Employer
}

export function EditEmployerForm({ employer }: EditEmployerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    try {
      const result = await updateEmployer(employer.id, {
        company_name: data.company_name as string,
        registration_number: data.registration_number as string,
        email: data.email as string,
        phone: data.phone as string,
        address: data.address as string,
        industry: data.industry as string,
        billing_email: (data.billing_email as string) || null,
        payment_terms: data.payment_terms ? parseInt(data.payment_terms as string) : 30,
        portal_enabled: data.portal_enabled === "true",
        auto_receive_certificates: data.auto_receive_certificates === "true",
      })

      if (result.success) {
        toast({
          title: "Employer updated",
          description: "The employer details have been successfully updated.",
        })
        router.push(`/clinic/employers/${employer.id}`)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update employer.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Update the company's official details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={employer.company_name}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  name="registration_number"
                  defaultValue={employer.registration_number || ""}
                  placeholder="RC/BN/Registration number"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select name="industry" defaultValue={employer.industry || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="oil_gas">Oil & Gas</SelectItem>
                    <SelectItem value="mining">Mining</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                <Input
                  id="payment_terms"
                  name="payment_terms"
                  type="number"
                  defaultValue={employer.payment_terms}
                  placeholder="30"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Update contact details for the company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={employer.email}
                  placeholder="company@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={employer.phone || ""}
                  placeholder="+234 123 456 7890"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billing_email">Billing Email (Optional)</Label>
                <Input
                  id="billing_email"
                  name="billing_email"
                  type="email"
                  defaultValue={employer.billing_email || ""}
                  placeholder="billing@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Different from primary email for invoicing
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Company Address</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={employer.address || ""}
                placeholder="Enter full company address"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portal Settings</CardTitle>
            <CardDescription>Configure employer portal access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="portal_enabled">Enable Employer Portal</Label>
                <p className="text-sm text-muted-foreground">
                  Allow company to access their employee certificates online
                </p>
              </div>
              <Switch 
                id="portal_enabled" 
                name="portal_enabled" 
                value="true" 
                defaultChecked={employer.portal_enabled} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_receive_certificates">Auto-Receive Certificates</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send certificates to employer when issued
                </p>
              </div>
              <Switch 
                id="auto_receive_certificates" 
                name="auto_receive_certificates" 
                value="true" 
                defaultChecked={employer.auto_receive_certificates} 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Employer"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}