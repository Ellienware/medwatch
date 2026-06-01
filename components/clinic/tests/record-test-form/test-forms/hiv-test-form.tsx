"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Shield } from "lucide-react"
import type { TestFormProps } from "../types"

export function HIVTestForm({ onChange, value = {} }: TestFormProps) {
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
          <Shield className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">HIV Test Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          HIV testing requires informed consent. Ensure patient has received pre-test counseling.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hiv_result">HIV Test Result</Label>
          <Select 
            value={value.hiv_result || ''}
            onValueChange={(val) => handleChange('hiv_result', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="invalid">Invalid/Indeterminate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hiv_test_type">Test Type/Method</Label>
          <Select 
            value={value.hiv_test_type || ''}
            onValueChange={(val) => handleChange('hiv_test_type', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select test type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rapid">Rapid Test</SelectItem>
              <SelectItem value="elisa">ELISA</SelectItem>
              <SelectItem value="western_blot">Western Blot</SelectItem>
              <SelectItem value="pcr">PCR (Viral Load)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="hiv_test_kit">Test Kit Used</Label>
          <Select 
            value={value.hiv_test_kit || ''}
            onValueChange={(val) => handleChange('hiv_test_kit', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select kit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="determine">Determine HIV-1/2</SelectItem>
              <SelectItem value="unigold">Uni-Gold Recombigen</SelectItem>
              <SelectItem value="first_response">First Response</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hiv_lot_number">Lot Number</Label>
          <Input 
            id="hiv_lot_number" 
            placeholder="Enter lot number"
            value={value.hiv_lot_number || ''}
            onChange={(e) => handleChange('hiv_lot_number', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hiv_expiry_date">Expiry Date</Label>
          <Input 
            id="hiv_expiry_date" 
            type="date"
            value={value.hiv_expiry_date || ''}
            onChange={(e) => handleChange('hiv_expiry_date', e.target.value)}
          />
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="hiv_confirmatory_test">Confirmatory Test</Label>
          <Select 
            value={value.hiv_confirmatory_test || ''}
            onValueChange={(val) => handleChange('hiv_confirmatory_test', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hiv_referral_made">Referral Made</Label>
          <Select 
            value={value.hiv_referral_made || ''}
            onValueChange={(val) => handleChange('hiv_referral_made', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hiv_counseling">Post-Test Counseling</Label>
          <Select 
            value={value.hiv_counseling || ''}
            onValueChange={(val) => handleChange('hiv_counseling', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="provided">Provided</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
