"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Heart } from "lucide-react"
import type { TestFormProps } from "../types"

export function BloodPressureForm({ onChange, value = {} }: TestFormProps) {
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
          <Heart className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Blood Pressure Measurement</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter blood pressure readings. Normal range: 120/80 mmHg.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="systolic">Systolic (mmHg)</Label>
          <Input 
            id="systolic" 
            type="number" 
            placeholder="e.g., 120" 
            min="50" 
            max="300"
            value={value.systolic || ''}
            onChange={(e) => handleChange('systolic', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
          <Input 
            id="diastolic" 
            type="number" 
            placeholder="e.g., 80" 
            min="30" 
            max="200"
            value={value.diastolic || ''}
            onChange={(e) => handleChange('diastolic', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pulse">Pulse Rate (bpm)</Label>
          <Input 
            id="pulse" 
            type="number" 
            placeholder="e.g., 72" 
            min="30" 
            max="200"
            value={value.pulse || ''}
            onChange={(e) => handleChange('pulse', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}