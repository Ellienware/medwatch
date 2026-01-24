"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Radio } from "lucide-react"
import type { TestFormProps } from "../types"

export function XRayForm({ onChange, value = {} }: TestFormProps) {
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
          <Radio className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Chest X-Ray Findings</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter findings from chest X-ray examination.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="heart_size">Heart Size</Label>
            <Select 
              value={value.heart_size || ''}
              onValueChange={(val) => handleChange('heart_size', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select heart size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="mildly_enlarged">Mildly Enlarged</SelectItem>
                <SelectItem value="moderately_enlarged">Moderately Enlarged</SelectItem>
                <SelectItem value="severely_enlarged">Severely Enlarged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lung_fields">Lung Fields</Label>
            <Select 
              value={value.lung_fields || ''}
              onValueChange={(val) => handleChange('lung_fields', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lung condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear Bilaterally</SelectItem>
                <SelectItem value="mild_infiltrates">Mild Infiltrates</SelectItem>
                <SelectItem value="consolidation">Consolidation</SelectItem>
                <SelectItem value="effusion">Pleural Effusion</SelectItem>
                <SelectItem value="nodules">Pulmonary Nodules</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="xray_impression">Overall Impression</Label>
          <Textarea
            id="xray_impression"
            rows={3}
            placeholder="Radiologist's interpretation and findings..."
            value={value.xray_impression || ''}
            onChange={(e) => handleChange('xray_impression', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}