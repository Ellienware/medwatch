// components/clinic/employers/employers-list.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Mail, Phone, Users, Key, Eye, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface EmployersListProps {
  employers: any[]
}

export function EmployersList({ employers: initialEmployers }: EmployersListProps) {
  const router = useRouter()
  const [loadingPortal, setLoadingPortal] = useState<string | null>(null)
  const [employers, setEmployers] = useState(initialEmployers) // Local state

  const handleCreatePortal = async (employerId: string, employerEmail: string) => {
    setLoadingPortal(employerId)
    
    // Optimistic update: immediately show portal as enabled
    setEmployers(prev => prev.map(emp => 
      emp.$id === employerId 
        ? { ...emp, portal_enabled: true, portal_user_id: "creating..." }
        : emp
    ))
    
    try {
      const response = await fetch(`/api/clinic/employers/${employerId}/create-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Update with real data from API
        setEmployers(prev => prev.map(emp => 
          emp.$id === employerId 
            ? { 
                ...emp, 
                portal_enabled: true, 
                portal_user_id: data.auth_user_id || emp.portal_user_id 
              }
            : emp
        ))
        
        alert(`✅ Portal access created for ${employerEmail}!\n\nUse the "Reset Password" button to send login instructions.`)
        
        // Also refresh server data to ensure consistency
        router.refresh()
      } else {
        const error = await response.json()
        
        // Revert optimistic update on error
        setEmployers(prev => prev.map(emp => 
          emp.$id === employerId 
            ? { ...emp, portal_enabled: false, portal_user_id: undefined }
            : emp
        ))
        
        alert(`❌ Error: ${error.error}\n\n${error.message || ''}`)
      }
    } catch (error) {
      console.error('Portal creation error:', error)
      
      // Revert optimistic update on error
      setEmployers(prev => prev.map(emp => 
        emp.$id === employerId 
          ? { ...emp, portal_enabled: false, portal_user_id: undefined }
          : emp
      ))
      
      alert('❌ Network error. Please check your connection and try again.')
    } finally {
      setLoadingPortal(null)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {employers && employers.length > 0 ? (
        employers.map((employer: any) => (
          <Card key={employer.$id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{employer.company_name}</h3>
                      {employer.industry && <p className="text-sm text-muted-foreground">{employer.industry}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={employer.is_active ? "default" : "secondary"}>
                      {employer.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {employer.portal_enabled && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Portal
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {employer.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{employer.email}</span>
                    </div>
                  )}
                  {employer.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{employer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{employer.employeeCount} employees</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex gap-2">
                    {!employer.portal_enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                        onClick={() => handleCreatePortal(employer.$id, employer.email)}
                        disabled={loadingPortal === employer.$id}
                      >
                        {loadingPortal === employer.$id ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Key className="mr-1 h-3 w-3" />
                            Add Portal
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/clinic/employers/${employer.$id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                    
                    {employer.portal_enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800"
                      >
                        <Link href={`/clinic/employers/${employer.$id}/reset-password`}>
                          <Key className="mr-1 h-3 w-3" />
                          Reset
                        </Link>
                      </Button>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/clinic/employers/${employer.$id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link href={`/clinic/employers/${employer.$id}/edit`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Edit Employer
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link href={`/clinic/employers/${employer.$id}/employees`}>
                          <Users className="mr-2 h-4 w-4" />
                          View Employees
                        </Link>
                      </DropdownMenuItem>
                      
                      {!employer.portal_enabled && (
                        <DropdownMenuItem 
                          onClick={() => handleCreatePortal(employer.$id, employer.email)}
                          disabled={loadingPortal === employer.$id}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          {loadingPortal === employer.$id ? "Creating Portal..." : "Create Portal Access"}
                        </DropdownMenuItem>
                      )}
                      
                      {employer.portal_enabled && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/clinic/employers/${employer.$id}/reset-password`}>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No employers found</h3>
            <p className="text-sm text-muted-foreground">Add your first employer to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
