"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Activity } from "lucide-react"
import type { TestFormProps } from "../types"

export function SpirometryForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">Lung Function Test Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter spirometry values. Normal ranges may vary based on age, sex, and height.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fvc">FVC (Forced Vital Capacity)</Label>
          <Input 
            id="fvc" 
            type="number" 
            step="0.01" 
            placeholder="Liters" 
            value={value.fvc || ''}
            onChange={(e) => handleChange('fvc', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fev1">FEV1 (Forced Expiratory Volume)</Label>
          <Input 
            id="fev1" 
            type="number" 
            step="0.01" 
            placeholder="Liters" 
            value={value.fev1 || ''}
            onChange={(e) => handleChange('fev1', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fev1_fvc_ratio">FEV1/FVC Ratio</Label>
          <Input 
            id="fev1_fvc_ratio" 
            type="number" 
            step="0.01" 
            placeholder="%" 
            value={value.fev1_fvc_ratio || ''}
            onChange={(e) => handleChange('fev1_fvc_ratio', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pef">PEF (Peak Expiratory Flow)</Label>
          <Input 
            id="pef" 
            type="number" 
            placeholder="L/min" 
            value={value.pef || ''}
            onChange={(e) => handleChange('pef', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
