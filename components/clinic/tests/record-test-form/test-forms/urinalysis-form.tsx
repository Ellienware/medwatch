"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Droplets } from "lucide-react"
import type { TestFormProps } from "../types"

export function UrinalysisForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">Urinalysis Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="urine_color">Color</Label>
          <Select 
            value={value.urine_color || ''}
            onValueChange={(val) => handleChange('urine_color', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="straw">Straw (Normal)</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="amber">Amber</SelectItem>
              <SelectItem value="red">Red/Pink</SelectItem>
              <SelectItem value="brown">Brown</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="urine_clarity">Clarity</Label>
          <Select 
            value={value.urine_clarity || ''}
            onValueChange={(val) => handleChange('urine_clarity', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select clarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clear">Clear</SelectItem>
              <SelectItem value="slightly_cloudy">Slightly Cloudy</SelectItem>
              <SelectItem value="cloudy">Cloudy</SelectItem>
              <SelectItem value="turbid">Turbid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="urine_ph">pH</Label>
          <Input 
            id="urine_ph" 
            type="number" 
            step="0.1" 
            placeholder="e.g., 6.5" 
            min="4.5" 
            max="9"
            value={value.urine_ph || ''}
            onChange={(e) => handleChange('urine_ph', e.target.value)}
          />
        </div>
      </div>
      
      <Separator />
      
      <h5 className="font-medium">Chemical Analysis</h5>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { name: "urine_protein", label: "Protein" },
          { name: "urine_glucose", label: "Glucose" },
          { name: "urine_blood", label: "Blood" },
          { name: "urine_ketones", label: "Ketones" },
          { name: "urine_bilirubin", label: "Bilirubin" },
          { name: "urine_urobilinogen", label: "Urobilinogen" },
          { name: "urine_nitrite", label: "Nitrite" },
          { name: "urine_leukocytes", label: "Leukocytes" }
        ].map((test) => (
          <div key={test.name} className="space-y-2">
            <Label htmlFor={test.name}>{test.label}</Label>
            <Select 
              value={value[test.name] || ''}
              onValueChange={(val) => handleChange(test.name, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="trace">Trace</SelectItem>
                <SelectItem value="1+">1+</SelectItem>
                <SelectItem value="2+">2+</SelectItem>
                <SelectItem value="3+">3+</SelectItem>
                <SelectItem value="4+">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}
