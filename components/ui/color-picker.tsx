"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const PRESET_COLORS = [
  // Medical/Professional colors
  "#0D9488", // Teal
  "#14B8A6", // Light Teal
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#059669", // Emerald
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  
  // Neutral colors
  "#1F2937", // Gray-800
  "#374151", // Gray-700
  "#4B5563", // Gray-600
  "#6B7280", // Gray-500
  "#9CA3AF", // Gray-400
  
  // Light backgrounds
  "#FFFFFF", // White
  "#F9FAFB", // Gray-50
  "#F3F4F6", // Gray-100
  "#E5E7EB", // Gray-200
]

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [color, setColor] = React.useState(value)
  const [inputValue, setInputValue] = React.useState(value)

  React.useEffect(() => {
    setColor(value)
    setInputValue(value)
  }, [value])

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    setInputValue(newColor)
    onChange(newColor)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Validate hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
      setColor(newValue)
      onChange(newValue)
    }
  }

  const handleInputBlur = () => {
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(inputValue)) {
      setInputValue(color) // Revert to valid color
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-[100px] justify-start"
          >
            <div 
              className="mr-2 h-4 w-4 rounded border"
              style={{ backgroundColor: color }}
            />
            {color}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  className={cn(
                    "h-8 w-8 rounded border cursor-pointer flex items-center justify-center",
                    color === presetColor && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => handleColorChange(presetColor)}
                  title={presetColor}
                >
                  {color === presetColor && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <div 
                className="h-8 w-8 rounded border flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="#000000"
                className="font-mono text-sm"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => {
          // Open color picker dialog
          const input = document.createElement('input')
          input.type = 'color'
          input.value = color
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement
            handleColorChange(target.value)
          }
          input.click()
        }}
      >
        <Palette className="h-4 w-4" />
      </Button>
    </div>
  )
}
