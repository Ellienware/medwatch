// components/ui/color-picker.tsx - Updated version
"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface ColorPickerProps {
  value?: string  // Make value optional
  onChange: (value: string) => void
  disabled?: boolean
}

const DEFAULT_COLORS = [
  "#0D9488", // Teal
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EF4444", // Red
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#6B7280", // Gray
  "#1F2937", // Dark Gray
  "#FFFFFF", // White
  "#000000", // Black
]

export function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [customColor, setCustomColor] = React.useState(value || "#0D9488")

  React.useEffect(() => {
    setCustomColor(value || "#0D9488")
  }, [value])

  const handleColorSelect = (color: string) => {
    onChange(color)
    setCustomColor(color)
    setOpen(false)
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    onChange(color)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          className="h-10 w-10"
        >
          <div
            className="h-6 w-6 rounded border"
            style={{ backgroundColor: value || "#0D9488" }}
          />
          <span className="sr-only">Pick color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="h-8 w-8 rounded border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                title={color}
              />
            ))}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input
                value={customColor}
                onChange={handleCustomColorChange}
                className="flex-1"
                placeholder="#000000"
                maxLength={7}
              />
              <Button
                type="button"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-9 w-9"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}