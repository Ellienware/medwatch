"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Heart } from "lucide-react"
import type { TestFormProps } from "../types"

export function ECGForm({ onChange, value = {} }: TestFormProps) {
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
          <h4 className="font-medium text-blue-800">ECG Interpretation</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter findings from ECG reading. Consider consulting with a cardiologist for abnormal results.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ecg_heart_rate">Heart Rate (bpm)</Label>
          <Input 
            id="ecg_heart_rate" 
            type="number" 
            placeholder="e.g., 72" 
            min="30" 
            max="300"
            value={value.ecg_heart_rate || ''}
            onChange={(e) => handleChange('ecg_heart_rate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ecg_rhythm">Rhythm</Label>
          <Select 
            value={value.ecg_rhythm || ''}
            onValueChange={(val) => handleChange('ecg_rhythm', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rhythm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal_sinus">Normal Sinus Rhythm</SelectItem>
              <SelectItem value="sinus_tachycardia">Sinus Tachycardia</SelectItem>
              <SelectItem value="sinus_bradycardia">Sinus Bradycardia</SelectItem>
              <SelectItem value="atrial_fibrillation">Atrial Fibrillation</SelectItem>
              <SelectItem value="atrial_flutter">Atrial Flutter</SelectItem>
              <SelectItem value="premature_ventricular">Premature Ventricular Contractions</SelectItem>
              <SelectItem value="ventricular_tachycardia">Ventricular Tachycardia</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ecg_pr_interval">PR Interval (ms)</Label>
          <Input 
            id="ecg_pr_interval" 
            type="number" 
            placeholder="e.g., 160"
            value={value.ecg_pr_interval || ''}
            onChange={(e) => handleChange('ecg_pr_interval', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ecg_qrs_duration">QRS Duration (ms)</Label>
          <Input 
            id="ecg_qrs_duration" 
            type="number" 
            placeholder="e.g., 100"
            value={value.ecg_qrs_duration || ''}
            onChange={(e) => handleChange('ecg_qrs_duration', e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ecg_findings">ECG Findings</Label>
        <Textarea 
          id="ecg_findings" 
          rows={4} 
          placeholder="Describe ECG findings in detail, including any abnormalities, ST segment changes, T wave inversions, etc."
          value={value.ecg_findings || ''}
          onChange={(e) => handleChange('ecg_findings', e.target.value)}
        />
      </div>
    </div>
  )
}
