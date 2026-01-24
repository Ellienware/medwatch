"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye } from "lucide-react"
import type { TestFormProps } from "../types"

export function VisionForm({ onChange, value = {} }: TestFormProps) {
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
          <Eye className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Vision Screening Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter visual acuity for each eye using Snellen notation (e.g., 6/6, 20/20).
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="right_distance">Right Eye (Distance)</Label>
          <Input 
            id="right_distance" 
            placeholder="e.g., 6/6 or 20/20"
            value={value.right_distance || ''}
            onChange={(e) => handleChange('right_distance', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="left_distance">Left Eye (Distance)</Label>
          <Input 
            id="left_distance" 
            placeholder="e.g., 6/6 or 20/20"
            value={value.left_distance || ''}
            onChange={(e) => handleChange('left_distance', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="both_distance">Both Eyes (Distance)</Label>
          <Input 
            id="both_distance" 
            placeholder="e.g., 6/6 or 20/20"
            value={value.both_distance || ''}
            onChange={(e) => handleChange('both_distance', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color_vision">Color Vision</Label>
          <Select 
            value={value.color_vision || ''}
            onValueChange={(val) => handleChange('color_vision', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="red_green_deficiency">Red-Green Deficiency</SelectItem>
              <SelectItem value="blue_yellow_deficiency">Blue-Yellow Deficiency</SelectItem>
              <SelectItem value="monochromacy">Monochromacy (Total Color Blindness)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}