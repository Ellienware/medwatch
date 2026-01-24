"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Droplets } from "lucide-react"
import type { TestFormProps } from "../types"

export function KidneyFunctionForm({ onChange, value = {} }: TestFormProps) {
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
          <Droplets className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Kidney Function Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kft_creatinine">Creatinine (mg/dL)</Label>
          <Input 
            id="kft_creatinine" 
            type="number" 
            step="0.01" 
            placeholder="mg/dL"
            value={value.kft_creatinine || ''}
            onChange={(e) => handleChange('kft_creatinine', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_urea">Urea (BUN) (mg/dL)</Label>
          <Input 
            id="kft_urea" 
            type="number" 
            step="0.1" 
            placeholder="mg/dL"
            value={value.kft_urea || ''}
            onChange={(e) => handleChange('kft_urea', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_egfr">eGFR (mL/min/1.73m²)</Label>
          <Input 
            id="kft_egfr" 
            type="number" 
            placeholder="mL/min/1.73m²"
            value={value.kft_egfr || ''}
            onChange={(e) => handleChange('kft_egfr', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_sodium">Sodium (mmol/L)</Label>
          <Input 
            id="kft_sodium" 
            type="number" 
            placeholder="mmol/L"
            value={value.kft_sodium || ''}
            onChange={(e) => handleChange('kft_sodium', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_potassium">Potassium (mmol/L)</Label>
          <Input 
            id="kft_potassium" 
            type="number" 
            step="0.1" 
            placeholder="mmol/L"
            value={value.kft_potassium || ''}
            onChange={(e) => handleChange('kft_potassium', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_chloride">Chloride (mmol/L)</Label>
          <Input 
            id="kft_chloride" 
            type="number" 
            placeholder="mmol/L"
            value={value.kft_chloride || ''}
            onChange={(e) => handleChange('kft_chloride', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}