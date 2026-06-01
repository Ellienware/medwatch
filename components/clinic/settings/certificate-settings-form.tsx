"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Palette, Layout, FileText, Eye, Download, Upload } from "lucide-react"
import type { CertificateSettings, Clinic } from "@/lib/types/database"
import { CertificateSettingsService } from "@/lib/services/certificate-settings-service"
import { ColorPicker } from "@/components/ui/color-picker"
import { getCurrentUser } from "@/lib/auth/actions"
import { DEFAULT_CERTIFICATE_SETTINGS } from "@/lib/types/certificate-settings"


const certificateSettingsSchema = z.object({
  // Branding
  logo_url: z.string().optional(),
  clinic_name: z.string().optional(),
  header_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  header_text_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  accent_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  body_background_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  text_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  secondary_text_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  
  // Layout
  include_logo: z.boolean().default(true),
  include_watermark: z.boolean().default(true),
  watermark_text: z.string().min(1).max(50),
  watermark_opacity: z.number().min(0).max(100).default(5),
  footer_text: z.string().max(500),
  show_border: z.boolean().default(true),
  border_style: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  border_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color"),
  border_width: z.number().min(0).max(10).default(1),
  
  // Details
  show_clinic_address: z.boolean().default(true),
  show_clinic_phone: z.boolean().default(true),
  show_clinic_email: z.boolean().default(true),
  show_registration_number: z.boolean().default(true),
  show_branch_info: z.boolean().default(true),
  show_qr_code: z.boolean().default(false),
  
  // Sections
  show_patient_details_section: z.boolean().default(true),
  show_test_results_section: z.boolean().default(true),
  show_diagnosis_section: z.boolean().default(true),
  show_restrictions_section: z.boolean().default(true),
  show_recommendations_section: z.boolean().default(true),
  show_validity_dates: z.boolean().default(true),
  
  // Fonts
  title_font_family: z.string().min(1),
  body_font_family: z.string().min(1),
  title_font_size: z.number().min(8).max(72).default(24),
  body_font_size: z.number().min(8).max(24).default(11),
  
  // Additional
  disclaimer_text: z.string().max(1000),
  validity_period_days: z.number().min(1).max(3650).default(365),
})

type CertificateSettingsFormValues = z.infer<typeof certificateSettingsSchema>

interface CertificateSettingsFormProps {
  clinic: Clinic
}

const FONT_OPTIONS = [
  { value: "Helvetica, Arial, sans-serif", label: "Helvetica" },
  { value: "Times New Roman, Times, serif", label: "Times New Roman" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
  { value: "Courier New, monospace", label: "Courier New" },
]

export function CertificateSettingsForm({ clinic }: CertificateSettingsFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("branding")

  const form = useForm<CertificateSettingsFormValues>({
    resolver: zodResolver(certificateSettingsSchema),
    defaultValues: {
      header_color: "#0D9488",
      header_text_color: "#FFFFFF",
      accent_color: "#14B8A6",
      body_background_color: "#FFFFFF",
      text_color: "#1F2937",
      secondary_text_color: "#6B7280",
      border_color: "#E5E7EB",
      include_logo: true,
      include_watermark: true,
      watermark_text: "MEDICAL CERTIFICATE",
      watermark_opacity: 5,
      show_border: true,
      border_style: "solid",
      border_width: 1,
      show_clinic_address: true,
      show_clinic_phone: true,
      show_clinic_email: true,
      show_registration_number: true,
      show_branch_info: true,
      show_qr_code: false,
      show_patient_details_section: true,
      show_test_results_section: true,
      show_diagnosis_section: true,
      show_restrictions_section: true,
      show_recommendations_section: true,
      show_validity_dates: true,
      title_font_family: "Helvetica, Arial, sans-serif",
      body_font_family: "Helvetica, Arial, sans-serif",
      title_font_size: 24,
      body_font_size: 11,
      disclaimer_text: "This certificate is valid only when bearing the original signature and stamp.",
      validity_period_days: 365,
      footer_text: "This is an official medical certificate issued by our facility.",
    },
  })

  const settingsService = new CertificateSettingsService()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setIsLoading(true)
      const settings = await settingsService.getClinicSettings(clinic.id)
      
      // Update form with loaded settings
      Object.entries(settings).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as any, value)
        }
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load certificate settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

 // In the onSubmit function, fix the user ID reference:
async function onSubmit(data: CertificateSettingsFormValues) {
  try {
    setIsSaving(true)
    
    const currentUser = await getCurrentUser() // Add this
    if (!currentUser?.id) {
      throw new Error('User not authenticated')
    }
    
    await settingsService.updateClinicSettings(
      clinic.id,
      data,
      currentUser.id // Use actual user ID
    )
    
    toast({
      title: "Settings saved",
      description: "Certificate settings have been updated successfully.",
    })
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to save certificate settings",
      variant: "destructive",
    })
  } finally {
    setIsSaving(false)
  }
}



  async function generatePreview() {
    try {
      setIsPreviewLoading(true)
      const values = form.getValues()
      
      // Generate preview URL
      const previewResponse = await fetch(`/api/certificates/preview?clinicId=${clinic.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      
      if (previewResponse.ok) {
        const data = await previewResponse.json()
        setPreviewUrl(data.previewUrl)
        
        toast({
          title: "Preview generated",
          description: "Certificate preview is ready.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate preview",
        variant: "destructive",
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }

 // In the handleReset function:
function handleReset() {
  form.reset(DEFAULT_CERTIFICATE_SETTINGS) // Reset to actual defaults
  toast({
    title: "Settings reset",
    description: "All settings have been reset to defaults.",
  })
}

  function exportSettings() {
    const values = form.getValues()
    const json = settingsService.exportSettings(values)
    
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `certificate-settings-${clinic.name}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importSettings(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string
        const settings = settingsService.importSettings(json)
        
        // Update form with imported settings
        Object.entries(settings).forEach(([key, value]) => {
          if (value !== undefined) {
            form.setValue(key as any, value)
          }
        })
        
        toast({
          title: "Settings imported",
          description: "Certificate settings have been imported successfully.",
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid settings file format",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Certificate Customization</h2>
          <p className="text-muted-foreground">
            Customize how your medical certificates appear for patients and employers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <label htmlFor="import-settings">
              <Upload className="mr-2 h-4 w-4" />
              Import
              <input
                id="import-settings"
                type="file"
                accept=".json"
                className="hidden"
                onChange={importSettings}
              />
            </label>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <span className="text-lg">Aa</span>
            Typography
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TabsContent value="branding" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Colors & Branding</CardTitle>
                  <CardDescription>
                    Customize colors and branding elements for your certificates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="header_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Background Color</FormLabel>
                          <FormControl>
                            <ColorPicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Background color of the certificate header
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="header_text_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Text Color</FormLabel>
                          <FormControl>
                            <ColorPicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Text color in the certificate header
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accent_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accent Color</FormLabel>
                          <FormControl>
                            <ColorPicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Color for section titles and accents
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="body_background_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificate Background</FormLabel>
                          <FormControl>
                            <ColorPicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Background color of the certificate body
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="text_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Text Color</FormLabel>
                          <FormControl>
                            <ColorPicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Main text color for content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondary_text_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Text Color</FormLabel>
                          <FormControl>
                            <ColorPicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Color for labels and less important text
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/logo.png"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL to your clinic logo (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Layout & Borders</CardTitle>
                  <CardDescription>
                    Configure layout options and borders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="show_border"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Border</FormLabel>
                            <FormDescription>
                              Display border around certificate
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="border_style"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Border Style</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select border style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Style of the certificate border
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch("show_border") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="border_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Border Color</FormLabel>
                            <FormControl>
                              <ColorPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="border_width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Border Width: {field.value}px</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={10}
                                step={1}
                                defaultValue={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="include_watermark"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Include Watermark</FormLabel>
                            <FormDescription>
                              Display watermark on certificate
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("include_watermark") && (
                      <>
                        <FormField
                          control={form.control}
                          name="watermark_text"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Watermark Text</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="watermark_opacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Watermark Opacity: {field.value}%</FormLabel>
                              <FormControl>
                                <Slider
                                  min={0}
                                  max={100}
                                  step={5}
                                  defaultValue={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sections" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Sections</CardTitle>
                  <CardDescription>
                    Choose which sections to include in certificates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="show_patient_details_section"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Patient Details</FormLabel>
                            <FormDescription>
                              Show patient information section
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="show_test_results_section"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Test Results</FormLabel>
                            <FormDescription>
                              Show test results section
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="show_diagnosis_section"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Diagnosis</FormLabel>
                            <FormDescription>
                              Show diagnosis section
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="show_restrictions_section"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Restrictions</FormLabel>
                            <FormDescription>
                              Show work restrictions section
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="show_recommendations_section"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Recommendations</FormLabel>
                            <FormDescription>
                              Show medical recommendations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="show_validity_dates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Validity Dates</FormLabel>
                            <FormDescription>
                              Show validity period dates
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="show_qr_code"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">QR Code Verification</FormLabel>
                            <FormDescription>
                              Include QR code for certificate verification
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="validity_period_days"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Validity Period (days)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={3650}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Default number of days certificates are valid
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>
                    Configure fonts and text styles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title_font_family"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title Font</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select title font" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Font for certificate titles and headers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="body_font_family"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Body Font</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select body font" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Font for certificate body text
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title_font_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title Font Size: {field.value}pt</FormLabel>
                          <FormControl>
                            <Slider
                              min={8}
                              max={72}
                              step={1}
                              defaultValue={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="body_font_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Body Font Size: {field.value}pt</FormLabel>
                          <FormControl>
                            <Slider
                              min={8}
                              max={24}
                              step={1}
                              defaultValue={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="footer_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Footer Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Footer text displayed at bottom of certificate"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Text displayed in certificate footer
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="disclaimer_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disclaimer Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Disclaimer or legal text"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Legal disclaimer for certificate validity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview & Actions</CardTitle>
                  <CardDescription>
                    Preview your settings and manage certificate templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="rounded-lg border p-4">
                        <h3 className="font-semibold mb-2">Current Settings Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Active Sections:</span>
                            <div className="flex gap-1">
                              {form.watch("show_patient_details_section") && (
                                <Badge variant="outline">Patient</Badge>
                              )}
                              {form.watch("show_test_results_section") && (
                                <Badge variant="outline">Tests</Badge>
                              )}
                              {form.watch("show_diagnosis_section") && (
                                <Badge variant="outline">Diagnosis</Badge>
                              )}
                              {form.watch("show_restrictions_section") && (
                                <Badge variant="outline">Restrictions</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Colors:</span>
                            <div className="flex gap-1">
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: form.watch("header_color") }}
                                title="Header color"
                              />
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: form.watch("accent_color") }}
                                title="Accent color"
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Typography:</span>
                            <span className="text-sm font-medium">
                              {form.watch("title_font_family")?.split(',')[0]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={generatePreview}
                        disabled={isPreviewLoading}
                      >
                        {isPreviewLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Preview...
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Generate Live Preview
                          </>
                        )}
                      </Button>
                    </div>

                    {previewUrl && (
                      <div className="flex-1">
                        <div className="rounded-lg border p-4">
                          <h3 className="font-semibold mb-2">Preview</h3>
                          <div className="aspect-[0.707] bg-muted relative">
                            {/* Preview would be rendered here */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Certificate preview would appear here
                                </p>
                                <Button
                                  variant="link"
                                  className="mt-2"
                                  onClick={() => window.open(previewUrl, '_blank')}
                                >
                                  Open in new tab
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Save Settings</h3>
                        <p className="text-sm text-muted-foreground">
                          Save your certificate settings for all future certificates
                        </p>
                      </div>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                      >
                        Reset to Defaults
                      </Button>
                      
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          // Handle delete settings
                        }}
                      >
                        Delete Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ["branding", "layout", "sections", "typography", "preview"]
                  const currentIndex = tabs.indexOf(activeTab)
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1])
                  }
                }}
                disabled={activeTab === "branding"}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ["branding", "layout", "sections", "typography", "preview"]
                  const currentIndex = tabs.indexOf(activeTab)
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1])
                  }
                }}
                disabled={activeTab === "preview"}
              >
                Next
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}
