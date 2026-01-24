"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Microscope } from "lucide-react"
import type { TestFormProps } from "../types"

export function TuberculosisTestForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">Tuberculosis Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tb_test_type">Test Type</Label>
          <Select 
            value={value.tb_test_type || ''}
            onValueChange={(val) => handleChange('tb_test_type', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select test" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mantoux">Mantoux (PPD) Test</SelectItem>
              <SelectItem value="igra">IGRA (Quantiferon)</SelectItem>
              <SelectItem value="sputum">Sputum AFB</SelectItem>
              <SelectItem value="xpert">GeneXpert MTB/RIF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tb_result">Test Result</Label>
          <Select 
            value={value.tb_result || ''}
            onValueChange={(val) => handleChange('tb_result', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="induration">Induration (mm)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tb_induration">Induration Measurement (mm)</Label>
        <Input 
          id="tb_induration" 
          type="number" 
          placeholder="Millimeters"
          value={value.tb_induration || ''}
          onChange={(e) => handleChange('tb_induration', e.target.value)}
        />
      </div>
    </div>
  )
}