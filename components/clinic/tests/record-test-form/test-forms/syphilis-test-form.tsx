"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Microscope } from "lucide-react"
import type { TestFormProps } from "../types"

export function SyphilisTestForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">Syphilis Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="syphilis_rpr">RPR/VDRL (Non-treponemal)</Label>
          <Select 
            value={value.syphilis_rpr || ''}
            onValueChange={(val) => handleChange('syphilis_rpr', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nonreactive">Non-reactive</SelectItem>
              <SelectItem value="reactive">Reactive</SelectItem>
              <SelectItem value="titer">Titer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="syphilis_tppa">TPPA/FTA-ABS (Treponemal)</Label>
          <Select 
            value={value.syphilis_tppa || ''}
            onValueChange={(val) => handleChange('syphilis_tppa', val)}
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
          <Label htmlFor="syphilis_titer">RPR Titer (if reactive)</Label>
          <Input 
            id="syphilis_titer" 
            placeholder="e.g., 1:8, 1:16"
            value={value.syphilis_titer || ''}
            onChange={(e) => handleChange('syphilis_titer', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}