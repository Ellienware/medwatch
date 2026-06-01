"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Thermometer } from "lucide-react"
import type { TestFormProps } from "../types"

export function BloodGlucoseForm({ onChange, value = {} }: TestFormProps) {
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
          <Thermometer className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Blood Glucose Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="glucose_fasting">Fasting Glucose (mg/dL)</Label>
          <Input 
            id="glucose_fasting" 
            type="number" 
            placeholder="e.g., 95"
            value={value.glucose_fasting || ''}
            onChange={(e) => handleChange('glucose_fasting', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="glucose_random">Random Glucose (mg/dL)</Label>
          <Input 
            id="glucose_random" 
            type="number" 
            placeholder="e.g., 120"
            value={value.glucose_random || ''}
            onChange={(e) => handleChange('glucose_random', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="glucose_hba1c">HbA1c (%)</Label>
          <Input 
            id="glucose_hba1c" 
            type="number" 
            step="0.1" 
            placeholder="e.g., 5.7"
            value={value.glucose_hba1c || ''}
            onChange={(e) => handleChange('glucose_hba1c', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="glucose_test_type">Test Type</Label>
          <Select 
            value={value.glucose_test_type || ''}
            onValueChange={(val) => handleChange('glucose_test_type', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fasting">Fasting</SelectItem>
              <SelectItem value="random">Random</SelectItem>
              <SelectItem value="post_prandial">Post Prandial</SelectItem>
              <SelectItem value="hba1c">HbA1c</SelectItem>
              <SelectItem value="ogtt">Oral Glucose Tolerance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
