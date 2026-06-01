"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Droplets } from "lucide-react"
import type { TestFormProps } from "../types"

export function MalariaTestForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">Malaria Test Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Rapid Diagnostic Test (RDT) or microscopy results for malaria.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="malaria_result">Malaria Test Result</Label>
          <Select 
            value={value.malaria_result || ''}
            onValueChange={(val) => handleChange('malaria_result', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="pf">P. falciparum Positive</SelectItem>
              <SelectItem value="pv">P. vivax Positive</SelectItem>
              <SelectItem value="pm">P. malariae Positive</SelectItem>
              <SelectItem value="po">P. ovale Positive</SelectItem>
              <SelectItem value="mixed">Mixed Infection</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="malaria_parasite_count">Parasite Count (parasites/μL)</Label>
          <Input 
            id="malaria_parasite_count" 
            type="number" 
            placeholder="e.g., 1500"
            value={value.malaria_parasite_count || ''}
            onChange={(e) => handleChange('malaria_parasite_count', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
