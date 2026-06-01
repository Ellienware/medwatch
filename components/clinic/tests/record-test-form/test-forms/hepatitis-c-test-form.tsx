"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Syringe } from "lucide-react"
import type { TestFormProps } from "../types"

export function HepatitisCTestForm({ onChange, value = {} }: TestFormProps) {
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
          <Syringe className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Hepatitis C Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="anti_hcv">Anti-HCV Antibody</Label>
          <Select 
            value={value.anti_hcv || ''}
            onValueChange={(val) => handleChange('anti_hcv', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hcv_rna">HCV RNA (Viral Load)</Label>
          <Input 
            id="hcv_rna" 
            type="number" 
            placeholder="IU/mL"
            value={value.hcv_rna || ''}
            onChange={(e) => handleChange('hcv_rna', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
