"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Syringe } from "lucide-react"
import type { TestFormProps } from "../types"

export function HepatitisBTestForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">Hepatitis B Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hbsag">HBsAg (Surface Antigen)</Label>
          <Select 
            value={value.hbsag || ''}
            onValueChange={(val) => handleChange('hbsag', val)}
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
          <Label htmlFor="anti_hbs">Anti-HBs (Surface Antibody)</Label>
          <Select 
            value={value.anti_hbs || ''}
            onValueChange={(val) => handleChange('anti_hbs', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="reactive">Reactive (≥10 mIU/mL)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="anti_hbc">Anti-HBc (Core Antibody)</Label>
          <Select 
            value={value.anti_hbc || ''}
            onValueChange={(val) => handleChange('anti_hbc', val)}
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
          <Label htmlFor="hbeag">HBeAg (e Antigen)</Label>
          <Select 
            value={value.hbeag || ''}
            onValueChange={(val) => handleChange('hbeag', val)}
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
      </div>
    </div>
  )
}