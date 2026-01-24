"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Thermometer } from "lucide-react"
import type { TestFormProps } from "../types"

export function TyphoidTestForm({ onChange, value = {} }: TestFormProps) {
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
          <Thermometer className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Typhoid Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="typhoid_widal">Widal Test</Label>
          <Select 
            value={value.typhoid_widal || ''}
            onValueChange={(val) => handleChange('typhoid_widal', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="titer">Titer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="typhoid_titer">Titer Value</Label>
          <Input 
            id="typhoid_titer" 
            placeholder="e.g., 1:80"
            value={value.typhoid_titer || ''}
            onChange={(e) => handleChange('typhoid_titer', e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="typhoid_culture">Blood Culture Result</Label>
        <Select 
          value={value.typhoid_culture || ''}
          onValueChange={(val) => handleChange('typhoid_culture', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="negative">Negative</SelectItem>
            <SelectItem value="positive_s_typhi">S. Typhi Positive</SelectItem>
            <SelectItem value="positive_paratyphi">S. Paratyphi Positive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}