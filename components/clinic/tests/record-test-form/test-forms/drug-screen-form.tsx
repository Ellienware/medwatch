"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AlertCircle } from "lucide-react"
import type { TestFormProps } from "../types"

export function DrugScreenForm({ onChange, value = {} }: TestFormProps) {
  const handleChange = (field: string, val: any) => {
    onChange({
      ...value,
      [field]: val
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <h4 className="font-medium text-amber-800">Drug & Alcohol Screening</h4>
        </div>
        <p className="mt-1 text-sm text-amber-700">
          Confidential test results. Requires patient consent for testing.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="alcohol">Alcohol (Breath/BAC)</Label>
            <Input 
              id="alcohol" 
              type="number" 
              step="0.01" 
              placeholder="mg/L or % BAC"
              value={value.alcohol || ''}
              onChange={(e) => handleChange('alcohol', e.target.value)}
            />
          </div>
        </div>
        
        <Separator />
        
        <h5 className="font-medium">Substance Screening Results</h5>
        <div className="grid gap-4 md:grid-cols-2">
          {["Cannabis", "Cocaine", "Opiates", "Amphetamines", "Benzodiazepines", "Barbiturates"].map((substance) => {
            const key = substance.toLowerCase()
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{substance}</Label>
                <Select 
                  value={value[key] || ''}
                  onValueChange={(val) => handleChange(key, val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="not_tested">Not Tested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}