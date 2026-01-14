// components/clinic/settings/certificate-settings-form.tsx
"use client"

import { useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Slider } from "@/components/ui/slider"

import { updateCertificateSettings } from "@/lib/actions/clinic-actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Palette, Layout, Type, Image, Settings } from "lucide-react"
import type { Clinic } from "@/lib/types/database"
import type { CertificateSettings } from "@/lib/types/certificate-settings"
import { ColorPicker } from "@/components/ui/color-picker"
import { ImageUpload } from "@/components/ui/image-upload"

const certificateSettingsSchema = z.object({
  logo_url: z.string().optional(),
  clinic_name: z.string().optional(),
  header_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  header_text_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  accent_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  body_background_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  text_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  secondary_text_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  include_logo: z.boolean().optional(),
  include_watermark: z.boolean().optional(),
  watermark_text: z.string().optional(),
  watermark_opacity: z.number().min(0).max(100).optional(),
  footer_text: z.string().optional(),
  show_border: z.boolean().optional(),
  border_style: z.enum(['solid', 'dashed', 'dotted']).optional(),
  border_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  border_width: z.number().min(0).max(10).optional(),
  show_clinic_address: z.boolean().optional(),
  show_clinic_phone: z.boolean().optional(),
  show_clinic_email: z.boolean().optional(),
  show_registration_number: z.boolean().optional(),
  show_branch_info: z.boolean().optional(),
  show_qr_code: z.boolean().optional(),
  qr_code_url: z.string().url().optional().or(z.literal('')),
  signature_image_url: z.string().optional(),
  signature_text: z.string().optional(),
  include_stamp: z.boolean().optional(),
  stamp_image_url: z.string().optional(),
  stamp_position: z.enum(['left', 'center', 'right']).optional(),
  title_font_family: z.string().optional(),
  body_font_family: z.string().optional(),
  title_font_size: z.number().min(8).max(72).optional(),
  body_font_size: z.number().min(8).max(24).optional(),
  disclaimer_text: z.string().optional(),
  validity_period_days: z.number().min(1).max(730).optional(),
  custom_css: z.string().optional(),
  show_patient_details_section: z.boolean().optional(),
  show_test_results_section: z.boolean().optional(),
  show_diagnosis_section: z.boolean().optional(),
  show_restrictions_section: z.boolean().optional(),
  show_recommendations_section: z.boolean().optional(),
  show_validity_dates: z.boolean().optional(),
})

type CertificateSettingsFormValues = z.infer<typeof certificateSettingsSchema>

interface CertificateSettingsFormProps {
  clinic: Clinic
}

export function CertificateSettingsForm({ clinic }: CertificateSettingsFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const settings = clinic.settings?.certificate_settings as CertificateSettings || {}

  const form = useForm<CertificateSettingsFormValues>({
    resolver: zodResolver(certificateSettingsSchema),
    defaultValues: {
      logo_url: settings.logo_url || clinic.logo_url || "",
      clinic_name: settings.clinic_name || clinic.name || "",
      header_color: settings.header_color || "#0D9488",
      header_text_color: settings.header_text_color || "#FFFFFF",
      accent_color: settings.accent_color || "#14B8A6",
      body_background_color: settings.body_background_color || "#FFFFFF",
      text_color: settings.text_color || "#1F2937",
      secondary_text_color: settings.secondary_text_color || "#6B7280",
      include_logo: settings.include_logo ?? true,
      include_watermark: settings.include_watermark ?? true,
      watermark_text: settings.watermark_text || "MEDICAL CERTIFICATE",
      watermark_opacity: settings.watermark_opacity || 5,
      footer_text: settings.footer_text || "This is an official medical certificate issued by our facility.",
      show_border: settings.show_border ?? true,
      border_style: settings.border_style || "solid",
      border_color: settings.border_color || "#E5E7EB",
      border_width: settings.border_width || 1,
      show_clinic_address: settings.show_clinic_address ?? true,
      show_clinic_phone: settings.show_clinic_phone ?? true,
      show_clinic_email: settings.show_clinic_email ?? true,
      show_registration_number: settings.show_registration_number ?? true,
      show_branch_info: settings.show_branch_info ?? true,
      show_qr_code: settings.show_qr_code ?? false,
      qr_code_url: settings.qr_code_url || "",
      signature_image_url: settings.signature_image_url || "",
      signature_text: settings.signature_text || "",
      include_stamp: settings.include_stamp ?? false,
      stamp_image_url: settings.stamp_image_url || "",
      stamp_position: settings.stamp_position || "right",
      title_font_family: settings.title_font_family || "Helvetica, Arial, sans-serif",
      body_font_family: settings.body_font_family || "Helvetica, Arial, sans-serif",
      title_font_size: settings.title_font_size || 24,
      body_font_size: settings.body_font_size || 11,
      disclaimer_text: settings.disclaimer_text || "This certificate is valid only when bearing the original signature and stamp.",
      validity_period_days: settings.validity_period_days || 365,
      custom_css: settings.custom_css || "",
    },
  })

  async function onSubmit(data: CertificateSettingsFormValues) {
    setIsSubmitting(true)
    
    try {
      const result = await updateCertificateSettings(clinic.id, data)
      
      if (result.success) {
        toast({
          title: "Settings saved",
          description: "Certificate settings have been updated successfully.",
        })
        
        // Generate preview URL
        const previewData = {
          ...data,
          clinic_name: data.clinic_name || clinic.name,
          logo_url: data.include_logo ? (data.logo_url || clinic.logo_url) : null,
        }
        
        const previewQuery = new URLSearchParams(previewData as any).toString()
        setPreviewUrl(`/api/certificates/preview?${previewQuery}`)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="design" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Design Tab */}
            <TabsContent value="design" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize the colors of your certificate
                  </p>
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
                            <div className="flex items-center gap-3">
                              <ColorPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                              <Input
                                value={field.value}
                                onChange={field.onChange}
                                className="w-32"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Color for the certificate header background
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
                            <div className="flex items-center gap-3">
                              <ColorPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                              <Input
                                value={field.value}
                                onChange={field.onChange}
                                className="w-32"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Text color in the header section
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
                            <div className="flex items-center gap-3">
                              <ColorPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                              <Input
                                value={field.value}
                                onChange={field.onChange}
                                className="w-32"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Color for borders, buttons, and highlights
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
                          <FormLabel>Background Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <ColorPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                              <Input
                                value={field.value}
                                onChange={field.onChange}
                                className="w-32"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Background color of the certificate
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
                          <FormLabel>Text Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <ColorPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                              <Input
                                value={field.value}
                                onChange={field.onChange}
                                className="w-32"
                              />
                            </div>
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
                            <div className="flex items-center gap-3">
                              <ColorPicker
                                value={field.value}
                                onChange={field.onChange}
                              />
                              <Input
                                value={field.value}
                                onChange={field.onChange}
                                className="w-32"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Color for labels and less important text
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Border Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize the certificate border
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="show_border"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Border</FormLabel>
                          <FormDescription>
                            Display a border around the certificate
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

                  {form.watch("show_border") && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="border_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Border Color</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-3">
                                <ColorPicker
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                                <Input
                                  value={field.value}
                                  onChange={field.onChange}
                                  className="w-32"
                                />
                              </div>
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
                                step={0.5}
                                value={[field.value || 1]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Watermark Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure the background watermark
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="include_watermark"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Watermark</FormLabel>
                          <FormDescription>
                            Display a watermark in the background
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
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="watermark_text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Watermark Text</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              Text to display as watermark
                            </FormDescription>
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
                                step={1}
                                value={[field.value || 5]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                            </FormControl>
                            <FormDescription>
                              Lower values make the watermark more subtle
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Section Visibility</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose which sections to display on certificates
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="show_patient_details_section"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Patient Details Section</FormLabel>
                          <FormDescription>
                            Show patient name, ID, company, occupation
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Test Results Section</FormLabel>
                          <FormDescription>
                            Display clinical test results
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Diagnosis Section</FormLabel>
                          <FormDescription>
                            Show medical diagnosis information
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Restrictions Section</FormLabel>
                          <FormDescription>
                            Display work restrictions
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Validity Dates</FormLabel>
                          <FormDescription>
                            Show valid from/until dates
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Clinic Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose what clinic information to display
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="show_clinic_address"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Show Clinic Address</FormLabel>
                          <FormDescription>
                            Display clinic address on certificate
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
                    name="show_clinic_phone"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Show Clinic Phone</FormLabel>
                          <FormDescription>
                            Display clinic phone number
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
                    name="show_clinic_email"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Show Clinic Email</FormLabel>
                          <FormDescription>
                            Display clinic email address
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
                    name="show_registration_number"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Show Registration Number</FormLabel>
                          <FormDescription>
                            Display clinic registration number
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
                    name="show_branch_info"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Show Branch Information</FormLabel>
                          <FormDescription>
                            Display branch-specific information when available
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text Content</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize certificate text content
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="footer_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter footer text"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Text displayed at the bottom of the certificate
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
                            placeholder="Enter disclaimer text"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Legal disclaimer displayed on the certificate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="custom_css"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom CSS</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter custom CSS styles"
                            className="min-h-[120px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Advanced: Add custom CSS for additional styling
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo & Images</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload images for your certificate
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="include_logo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Include Logo</FormLabel>
                          <FormDescription>
                            Display clinic logo on certificate
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

                  {form.watch("include_logo") && (
                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clinic Logo</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value || ""}
                              onChange={field.onChange}
                              endpoint="certificateLogo"
                              maxSize={2 * 1024 * 1024} // 2MB
                              accept="image/*"
                            />
                          </FormControl>
                          <FormDescription>
                            Upload your clinic logo (Recommended: 200x200px, PNG with transparent background)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Separator />

                  <FormField
                    control={form.control}
                    name="signature_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor Signature Image</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value || ""}
                            onChange={field.onChange}
                            endpoint="doctorSignature"
                            maxSize={1 * 1024 * 1024} // 1MB
                            accept="image/*"
                          />
                        </FormControl>
                        <FormDescription>
                          Upload doctor's signature image (Recommended: 300x100px, PNG with transparent background)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="include_stamp"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Include Official Stamp</FormLabel>
                          <FormDescription>
                            Display official clinic stamp on certificate
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

                  {form.watch("include_stamp") && (
                    <FormField
                      control={form.control}
                      name="stamp_image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stamp Image</FormLabel>
                          <FormControl>
                            <ImageUpload
                              value={field.value || ""}
                              onChange={field.onChange}
                              endpoint="certificateStamp"
                              maxSize={1 * 1024 * 1024} // 1MB
                              accept="image/*"
                            />
                          </FormControl>
                          <FormDescription>
                            Upload official stamp image (Recommended: 150x150px, PNG with transparent background)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("include_stamp") && (
                    <FormField
                      control={form.control}
                      name="stamp_position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stamp Position</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select stamp position" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="left">Left Side</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right Side</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Position of the official stamp on the certificate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>QR Code Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add QR code for certificate verification
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="show_qr_code"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show QR Code</FormLabel>
                          <FormDescription>
                            Display QR code for certificate verification
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

                  {form.watch("show_qr_code") && (
                    <FormField
                      control={form.control}
                      name="qr_code_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>QR Code Base URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://yourclinic.com/verify/"
                            />
                          </FormControl>
                          <FormDescription>
                            Base URL for QR code verification. Certificate ID will be appended.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>

      {/* Live Preview Section */}
      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Live Preview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Preview how your certificate will look with current settings
            </p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/30">
              <iframe
                src={previewUrl}
                className="w-full h-[600px] border rounded"
                title="Certificate Preview"
              />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Note: This preview uses sample data. Actual certificates will show patient-specific information.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Certificate Settings
        </Button>
      </div>
    </div>
  )
}