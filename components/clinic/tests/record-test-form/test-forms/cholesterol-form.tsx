"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Activity } from "lucide-react"
import type { TestFormProps } from "../types"

export function CholesterolForm({ onChange, value = {} }: TestFormProps) {
  const handleChange = (field: string, val: any) => {
    onChange({
      ...value,
      [field]: val
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Lipid Profile Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cholesterol_total">Total Cholesterol (mg/dL)</Label>
          <Input 
            id="cholesterol_total" 
            type="number" 
            placeholder="e.g., 200"
            value={value.cholesterol_total || ''}
            onChange={(e) => handleChange('cholesterol_total', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cholesterol_hdl">HDL (Good Cholesterol) (mg/dL)</Label>
          <Input 
            id="cholesterol_hdl" 
            type="number" 
            placeholder="e.g., 60"
            value={value.cholesterol_hdl || ''}
            onChange={(e) => handleChange('cholesterol_hdl', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cholesterol_ldl">LDL (Bad Cholesterol) (mg/dL)</Label>
          <Input 
            id="cholesterol_ldl" 
            type="number" 
            placeholder="e.g., 100"
            value={value.cholesterol_ldl || ''}
            onChange={(e) => handleChange('cholesterol_ldl', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cholesterol_triglycerides">Triglycerides (mg/dL)</Label>
          <Input 
            id="cholesterol_triglycerides" 
            type="number" 
            placeholder="e.g., 150"
            value={value.cholesterol_triglycerides || ''}
            onChange={(e) => handleChange('cholesterol_triglycerides', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}