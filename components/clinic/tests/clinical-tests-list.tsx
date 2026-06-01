// components/clinic/tests/clinical-tests-list.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TestTube2, Clock, DollarSign, Plus, Edit, Trash2 } from "lucide-react"
import type { ClinicalTest } from "@/lib/types/database"
import { toast } from "sonner" // Add toast notifications
import React from "react"

interface ClinicalTestsListProps {
  initialTests: ClinicalTest[]
  clinicId: string 
}

export function ClinicalTestsList({ initialTests}: ClinicalTestsListProps) {
  const [tests, setTests] = useState<ClinicalTest[]>(initialTests)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<ClinicalTest | null>(null)
  const [clinicId, setClinicId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClinicId = async () => {
      try {
        const response = await fetch("/api/clinic-id")
        if (response.ok) {
          const data = await response.json()
          setClinicId(data.clinicId)
        }
      } catch (error) {
        console.error("Failed to fetch clinic ID:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchClinicId()
  }, [])

  const handleSaveTest = async (testData: Partial<ClinicalTest>) => {
    try {
      // Add clinic_id to the request
      const payload = { 
        ...testData, 
        clinic_id: clinicId,
        ...(editingTest ? { id: editingTest.id } : {})
      }
      
      const response = await fetch("/api/clinical-tests", {
        method: editingTest ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        // Refresh the list
        const updatedTests = await fetch("/api/clinical-tests").then(res => res.json())
        setTests(updatedTests)
        setIsDialogOpen(false)
        setEditingTest(null)
        toast.success(editingTest ? "Test updated successfully!" : "Test added successfully!")
      } else {
        const error = await response.json()
        toast.error(`Error: ${error.message || "Failed to save test"}`)
      }
    } catch (error) {
      console.error("Error saving test:", error)
      toast.error("Failed to save test. Please try again.")
    }
  }

  const handleDelete = async (testId: string) => {
    if (confirm("Are you sure you want to delete this test?")) {
      try {
        await fetch(`/api/clinical-tests/${testId}`, { method: "DELETE" })
        setTests(tests.filter(t => t.id !== testId))
        toast.success("Test deleted successfully!")
      } catch (error) {
        console.error("Error deleting test:", error)
        toast.error("Failed to delete test.")
      }
    }
  }

  const openAddDialog = () => {
    setEditingTest(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (test: ClinicalTest) => {
    setEditingTest(test)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Clinical Tests</h3>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Test
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTest ? "Edit Test" : "Add New Test"}</DialogTitle>
          </DialogHeader>
          <TestForm 
            test={editingTest} 
            onSubmit={handleSaveTest}
            clinicId={clinicId}
          />
        </DialogContent>
      </Dialog>

      {/* Test table remains the same but with updated click handlers */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Test Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id} className="border-b">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <TestTube2 className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{test.test_name}</p>
                          {test.description && (
                            <p className="text-xs text-muted-foreground">{test.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline">{test.test_code}</Badge>
                    </td>
                    <td className="px-4 py-4 capitalize">{test.test_category || "General"}</td>
                    <td className="px-4 py-4">R{test.price.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(test)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(test.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Test Form Component
// Test Form Component
function TestForm({ 
  test, 
  onSubmit,
  clinicId 
}: { 
  test: ClinicalTest | null; 
  onSubmit: (data: any) => void;
  clinicId: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false) // Add this line
  const [formData, setFormData] = useState({
    test_code: test?.test_code || "",
    test_name: test?.test_name || "",
    test_category: test?.test_category || "clinical",
    description: test?.description || "",
    price: test?.price || 0,
    estimated_duration_minutes: test?.estimated_duration_minutes || 15,
    requires_equipment: test?.requires_equipment || false,
    is_active: test?.is_active ?? true,
    clinic_id: clinicId,
    // These should be JSON strings
    parameters: test?.parameters || "[]",
    normal_ranges: test?.normal_ranges || "{}",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.test_code.trim() || !formData.test_name.trim()) {
      toast.error("Test code and name are required")
      return
    }
    
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to save test")
    } finally {
      setIsSubmitting(false) 
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="test_code">Test Code *</Label>
          <Input
            id="test_code"
            value={formData.test_code}
            onChange={(e) => setFormData({...formData, test_code: e.target.value})}
            required
            placeholder="e.g., audiometry"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test_category">Category</Label>
          <Select
            value={formData.test_category}
            onValueChange={(value) => setFormData({...formData, test_category: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clinical">Clinical</SelectItem>
              <SelectItem value="laboratory">Laboratory</SelectItem>
              <SelectItem value="imaging">Imaging</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="test_name">Test Name *</Label>
        <Input
          id="test_name"
          value={formData.test_name}
          onChange={(e) => setFormData({...formData, test_name: e.target.value})}
          required
          placeholder="e.g., Audiometry (Hearing Test)"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Test description..."
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (R)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={formData.estimated_duration_minutes}
            onChange={(e) => setFormData({...formData, estimated_duration_minutes: parseInt(e.target.value) || 15})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="requires_equipment">Requires Equipment</Label>
          <Select
            value={formData.requires_equipment ? "yes" : "no"}
            onValueChange={(value) => setFormData({...formData, requires_equipment: value === "yes"})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : test ? "Update Test" : "Add Test"} 
        </Button>
      </div>
    </form>
  )
}
