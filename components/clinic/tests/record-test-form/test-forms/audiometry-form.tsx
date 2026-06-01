"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ear } from "lucide-react"
import type { TestFormProps } from "../types"

export function AudiometryForm({ onChange, value = {} }: TestFormProps) {
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
          <Ear className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Hearing Test Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter hearing thresholds in decibels (dB) for each frequency.
        </p>
      </div>
      
      <Tabs defaultValue="right">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="right" className="flex items-center gap-2">
            <Ear className="h-4 w-4" />
            Right Ear
          </TabsTrigger>
          <TabsTrigger value="left" className="flex items-center gap-2">
            <Ear className="h-4 w-4" />
            Left Ear
          </TabsTrigger>
        </TabsList>
        <TabsContent value="right" className="space-y-4 pt-4">
          <h5 className="font-medium">Right Ear Hearing Thresholds</h5>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {["250Hz", "500Hz", "1000Hz", "2000Hz", "4000Hz", "8000Hz"].map((freq) => (
              <div key={freq} className="space-y-2">
                <Label htmlFor={`right_${freq}`}>{freq}</Label>
                <Input 
                  id={`right_${freq}`} 
                  type="number" 
                  placeholder="dB" 
                  min="0" 
                  max="120"
                  value={value[`right_${freq}`] || ''}
                  onChange={(e) => handleChange(`right_${freq}`, e.target.value)}
                />
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="left" className="space-y-4 pt-4">
          <h5 className="font-medium">Left Ear Hearing Thresholds</h5>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {["250Hz", "500Hz", "1000Hz", "2000Hz", "4000Hz", "8000Hz"].map((freq) => (
              <div key={freq} className="space-y-2">
                <Label htmlFor={`left_${freq}`}>{freq}</Label>
                <Input 
                  id={`left_${freq}`} 
                  type="number" 
                  placeholder="dB" 
                  min="0" 
                  max="120"
                  value={value[`left_${freq}`] || ''}
                  onChange={(e) => handleChange(`left_${freq}`, e.target.value)}
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
