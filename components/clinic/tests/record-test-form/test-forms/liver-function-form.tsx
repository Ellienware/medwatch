"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Activity } from "lucide-react"
import type { TestFormProps } from "../types"

export function LiverFunctionForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">Liver Function Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lft_alt">ALT (SGPT) (U/L)</Label>
          <Input 
            id="lft_alt" 
            type="number" 
            placeholder="U/L"
            value={value.lft_alt || ''}
            onChange={(e) => handleChange('lft_alt', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_ast">AST (SGOT) (U/L)</Label>
          <Input 
            id="lft_ast" 
            type="number" 
            placeholder="U/L"
            value={value.lft_ast || ''}
            onChange={(e) => handleChange('lft_ast', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_alp">Alkaline Phosphatase (ALP) (U/L)</Label>
          <Input 
            id="lft_alp" 
            type="number" 
            placeholder="U/L"
            value={value.lft_alp || ''}
            onChange={(e) => handleChange('lft_alp', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_bilirubin_total">Total Bilirubin (mg/dL)</Label>
          <Input 
            id="lft_bilirubin_total" 
            type="number" 
            step="0.1" 
            placeholder="mg/dL"
            value={value.lft_bilirubin_total || ''}
            onChange={(e) => handleChange('lft_bilirubin_total', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_bilirubin_direct">Direct Bilirubin (mg/dL)</Label>
          <Input 
            id="lft_bilirubin_direct" 
            type="number" 
            step="0.1" 
            placeholder="mg/dL"
            value={value.lft_bilirubin_direct || ''}
            onChange={(e) => handleChange('lft_bilirubin_direct', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_albumin">Albumin (g/dL)</Label>
          <Input 
            id="lft_albumin" 
            type="number" 
            step="0.1" 
            placeholder="g/dL"
            value={value.lft_albumin || ''}
            onChange={(e) => handleChange('lft_albumin', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}