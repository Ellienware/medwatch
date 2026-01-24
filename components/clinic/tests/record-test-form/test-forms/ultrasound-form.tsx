"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Activity } from "lucide-react"
import type { TestFormProps } from "../types"

export function UltrasoundForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">Ultrasound Examination</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter findings from ultrasound examination. Specify organ/system examined.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ultrasound_type">Type of Ultrasound</Label>
          <Select 
            value={value.ultrasound_type || ''}
            onValueChange={(val) => handleChange('ultrasound_type', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abdominal">Abdominal</SelectItem>
              <SelectItem value="pelvic">Pelvic</SelectItem>
              <SelectItem value="obstetric">Obstetric</SelectItem>
              <SelectItem value="thyroid">Thyroid</SelectItem>
              <SelectItem value="breast">Breast</SelectItem>
              <SelectItem value="testicular">Testicular</SelectItem>
              <SelectItem value="carotid">Carotid Doppler</SelectItem>
              <SelectItem value="renal">Renal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ultrasound_findings_summary">Findings Summary</Label>
          <Input 
            id="ultrasound_findings_summary" 
            placeholder="e.g., Normal liver echotexture"
            value={value.ultrasound_findings_summary || ''}
            onChange={(e) => handleChange('ultrasound_findings_summary', e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ultrasound_details">Detailed Findings</Label>
        <Textarea 
          id="ultrasound_details" 
          rows={3} 
          placeholder="Describe ultrasound findings in detail including measurements if applicable..." 
          value={value.ultrasound_details || ''}
          onChange={(e) => handleChange('ultrasound_details', e.target.value)}
        />
      </div>
    </div>
  )
}