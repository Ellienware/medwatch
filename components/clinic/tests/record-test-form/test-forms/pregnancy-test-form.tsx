"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart } from "lucide-react"
import type { TestFormProps } from "../types"

export function PregnancyTestForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">Pregnancy Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pregnancy_result">Pregnancy Test Result</Label>
          <Select 
            value={value.pregnancy_result || ''}
            onValueChange={(val) => handleChange('pregnancy_result', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="invalid">Invalid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pregnancy_test_type">Test Type</Label>
          <Select 
            value={value.pregnancy_test_type || ''}
            onValueChange={(val) => handleChange('pregnancy_test_type', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urine">Urine Test</SelectItem>
              <SelectItem value="blood">Blood Test (Beta HCG)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pregnancy_weeks">Estimated Gestation (if positive)</Label>
        <Input 
          id="pregnancy_weeks" 
          type="number" 
          placeholder="Weeks"
          value={value.pregnancy_weeks || ''}
          onChange={(e) => handleChange('pregnancy_weeks', e.target.value)}
        />
      </div>
    </div>
  )
}