"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Microscope } from "lucide-react"
import type { TestFormProps } from "../types"

export function CBCForm({ onChange, value = {} }: TestFormProps) {
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
          <Microscope className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Complete Blood Count Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cbc_wbc">White Blood Cells (WBC)</Label>
          <Input 
            id="cbc_wbc" 
            type="number" 
            step="0.1" 
            placeholder="x10³/µL"
            value={value.cbc_wbc || ''}
            onChange={(e) => handleChange('cbc_wbc', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_rbc">Red Blood Cells (RBC)</Label>
          <Input 
            id="cbc_rbc" 
            type="number" 
            step="0.1" 
            placeholder="x10⁶/µL"
            value={value.cbc_rbc || ''}
            onChange={(e) => handleChange('cbc_rbc', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_hemoglobin">Hemoglobin (Hb)</Label>
          <Input 
            id="cbc_hemoglobin" 
            type="number" 
            step="0.1" 
            placeholder="g/dL"
            value={value.cbc_hemoglobin || ''}
            onChange={(e) => handleChange('cbc_hemoglobin', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_hematocrit">Hematocrit (Hct)</Label>
          <Input 
            id="cbc_hematocrit" 
            type="number" 
            placeholder="%"
            value={value.cbc_hematocrit || ''}
            onChange={(e) => handleChange('cbc_hematocrit', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_platelets">Platelets</Label>
          <Input 
            id="cbc_platelets" 
            type="number" 
            placeholder="x10³/µL"
            value={value.cbc_platelets || ''}
            onChange={(e) => handleChange('cbc_platelets', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_mcv">Mean Corpuscular Volume (MCV)</Label>
          <Input 
            id="cbc_mcv" 
            type="number" 
            placeholder="fL"
            value={value.cbc_mcv || ''}
            onChange={(e) => handleChange('cbc_mcv', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}