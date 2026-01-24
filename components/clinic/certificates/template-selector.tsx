// components/clinic/certificates/template-selector.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Check, FileText, Eye, CheckCircle } from "lucide-react"
import type { CertificateTemplate } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TemplateSelectorProps {
  clinicId: string
  onSelect: (template: CertificateTemplate) => void
  selectedTemplateId?: string
  category?: string
  showPreview?: boolean
}

export function TemplateSelector({ 
  clinicId, 
  onSelect, 
  selectedTemplateId,
  category,
  showPreview = true 
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [clinicId, category])

  async function fetchTemplates() {
    try {
      setLoading(true)
      const response = await fetch(`/api/certificates/templates?clinicId=${clinicId}${category ? `&category=${category}` : ''}`)
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (template: CertificateTemplate, e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewTemplate(template)
    setPreviewOpen(true)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No templates found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first certificate template to get started
        </p>
        <Button onClick={() => window.open('/clinic/settings/certificate-templates', '_blank')}>
          Create Template
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplateId === template.id 
                ? 'ring-2 ring-primary border-primary' 
                : ''
            }`}
            onClick={() => onSelect(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {template.name}
                    {template.is_default && (
                      <Badge variant="default" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description || "No description"}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  {template.is_one_page && (
                    <Badge variant="outline" className="text-xs">
                      1 Page
                    </Badge>
                  )}
                  
                  {showPreview && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handlePreview(template, e)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Template Preview */}
              {template.thumbnail_url ? (
                <div className="border rounded overflow-hidden mb-3">
                  <img 
                    src={template.thumbnail_url} 
                    alt={template.name}
                    className="w-full h-32 object-cover"
                  />
                </div>
              ) : (
                <div className="border rounded p-4 mb-3 bg-muted/30">
                  <div className="flex items-center justify-center h-24">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
              )}
              
              {/* Template Features */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Layout:</span>
                  <span className="font-medium capitalize">{template.layout.replace('_', ' ')}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category:</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {template.category}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 flex-wrap">
                  {template.sections_included.map(section => (
                    <Badge key={section} variant="secondary" className="text-xs">
                      {section.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Selection Indicator */}
              {selectedTemplateId === template.id && (
                <div className="mt-3 flex items-center justify-center text-primary">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Template Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{previewTemplate.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="capitalize">{previewTemplate.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Layout:</span>
                      <span className="capitalize">{previewTemplate.layout.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">One Page:</span>
                      <span>{previewTemplate.is_one_page ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Sections Included</h4>
                  <div className="flex flex-wrap gap-1">
                    {previewTemplate.sections_included.map(section => (
                      <Badge key={section} variant="default" className="text-xs">
                        {section.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Live Preview */}
              <div className="border rounded-lg p-6 bg-white">
                <h4 className="font-semibold mb-4">Sample Certificate Preview</h4>
                
                {/* Mock certificate preview */}
                <div className="border-2 border-dashed border-gray-300 rounded p-6">
                  <div className="text-center mb-6">
                    <div className="text-xl font-bold text-primary mb-2">
                      MEDICAL CERTIFICATE
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sample Certificate #{Date.now().toString().slice(-6)}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Patient Name</div>
                        <div className="font-medium">John Doe</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Issue Date</div>
                        <div className="font-medium">{new Date().toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    {previewTemplate.sections_included.includes('test_results') && (
                      <div>
                        <div className="text-sm font-semibold mb-2">Test Results</div>
                        <div className="text-sm text-muted-foreground">
                          Sample test results would appear here
                        </div>
                      </div>
                    )}
                    
                    {previewTemplate.sections_included.includes('diagnosis') && (
                      <div>
                        <div className="text-sm font-semibold mb-2">Diagnosis</div>
                        <div className="text-sm text-muted-foreground">
                          Sample diagnosis would appear here
                        </div>
                      </div>
                    )}
                    
                    <div className="text-right pt-4 border-t">
                      <div className="text-sm font-semibold">Dr. Sample Doctor</div>
                      <div className="text-xs text-muted-foreground">Sample Clinic</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  {previewTemplate.is_one_page ? (
                    <div className="flex items-center text-green-600">
                      <Check className="h-4 w-4 mr-2" />
                      This template is optimized to fit on a single page
                    </div>
                  ) : (
                    <div className="text-amber-600">
                      This template may span multiple pages depending on content
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => {
                  onSelect(previewTemplate)
                  setPreviewOpen(false)
                }}>
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}