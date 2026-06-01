"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface FontSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  description?: string
}

const FONT_FAMILIES = [
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica (Sans-serif)" },
  { value: "Arial, sans-serif", label: "Arial (Sans-serif)" },
  { value: "Verdana, sans-serif", label: "Verdana (Sans-serif)" },
  { value: "Tahoma, sans-serif", label: "Tahoma (Sans-serif)" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS (Sans-serif)" },
  { value: "Times New Roman, Times, serif", label: "Times New Roman (Serif)" },
  { value: "Georgia, serif", label: "Georgia (Serif)" },
  { value: "Garamond, serif", label: "Garamond (Serif)" },
  { value: "Courier New, monospace", label: "Courier New (Monospace)" },
  { value: "Brush Script MT, cursive", label: "Brush Script (Cursive)" },
]

export function FontSelector({ value, onChange, label, description }: FontSelectorProps) {
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue>
            <span style={{ fontFamily: value }}>
              {FONT_FAMILIES.find(f => f.value === value)?.label || value}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              <span style={{ fontFamily: font.value }}>{font.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
