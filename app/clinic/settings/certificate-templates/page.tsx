// // app/clinic/settings/certificate-templates/page.tsx
// "use client"

// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Switch } from "@/components/ui/switch"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
// import { toast } from "sonner"
// import { 
//   Plus, 
//   Edit, 
//   Copy, 
//   Trash2, 
//   Star, 
//   FileText, 
//   Check,
//   Eye,
//   Settings,
//   ArrowLeft // Added back arrow icon
// } from "lucide-react"
// import { useRouter } from "next/navigation" // Added for navigation
// import type { CertificateTemplate, TemplateCategory, TemplateLayout } from "@/lib/types/database"
// import { DEFAULT_CERTIFICATE_SETTINGS } from "@/lib/types/certificate-settings"

// const PREBUILT_TEMPLATES = [
//   {
//     name: "One-Page Basic",
//     description: "Compact certificate that fits on a single page",
//     category: "medical" as TemplateCategory,
//     layout: "compact" as TemplateLayout,
//     is_one_page: true,
//     sections_included: ["patient_info", "diagnosis", "signature"],
//     settings: {
//       ...DEFAULT_CERTIFICATE_SETTINGS,
//       title_font_size: 18,
//       body_font_size: 9,
//       show_test_results_section: false,
//       show_recommendations_section: false,
//       force_one_page: true,
//     }
//   },
//   {
//     name: "Comprehensive Medical",
//     description: "Detailed certificate with all medical information",
//     category: "medical" as TemplateCategory,
//     layout: "single" as TemplateLayout,
//     is_one_page: false,
//     sections_included: ["patient_info", "test_results", "diagnosis", "restrictions", "recommendations", "signature"],
//     settings: DEFAULT_CERTIFICATE_SETTINGS
//   },
//   {
//     name: "Employer Summary",
//     description: "Simplified one-page certificate for employers",
//     category: "employer" as TemplateCategory,
//     layout: "two_column" as TemplateLayout,
//     is_one_page: true,
//     sections_included: ["patient_info", "diagnosis", "restrictions", "signature"],
//     settings: {
//       ...DEFAULT_CERTIFICATE_SETTINGS,
//       header_color: "#1e40af",
//       accent_color: "#3b82f6",
//       show_test_results_section: false,
//       show_recommendations_section: false,
//       force_one_page: true,
//     }
//   },
//   {
//     name: "Fitness Certificate",
//     description: "For fitness-to-work assessments",
//     category: "fitness" as TemplateCategory,
//     layout: "compact" as TemplateLayout,
//     is_one_page: true,
//     sections_included: ["patient_info", "test_results", "diagnosis", "signature"],
//     settings: {
//       ...DEFAULT_CERTIFICATE_SETTINGS,
//       header_color: "#059669",
//       accent_color: "#10b981",
//       force_one_page: true,
//     }
//   }
// ]

// export default function CertificateTemplatesPage() {
//   const router = useRouter() // Initialize router
//   const [templates, setTemplates] = useState<CertificateTemplate[]>([])
//   const [loading, setLoading] = useState(true)
//   const [createDialogOpen, setCreateDialogOpen] = useState(false)
//   const [editDialogOpen, setEditDialogOpen] = useState(false)
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
//   const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
//   const [newTemplate, setNewTemplate] = useState({
//     name: "",
//     description: "",
//     category: "medical" as TemplateCategory,
//     layout: "single" as TemplateLayout,
//     is_one_page: false,
//     sections_included: ["patient_info", "test_results", "diagnosis", "restrictions", "recommendations", "signature"]
//   })

//   useEffect(() => {
//     fetchTemplates()
//   }, [])

//   async function fetchTemplates() {
//     try {
//       setLoading(true)
//       const response = await fetch("/api/certificates/templates")
//       if (response.ok) {
//         const data = await response.json()
//         setTemplates(data.templates || [])
//       }
//     } catch (error) {
//       console.error("Error fetching templates:", error)
//       toast.error("Failed to load templates")
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function createTemplate() {
//     try {
//       const response = await fetch("/api/certificates/templates", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...newTemplate,
//           settings: DEFAULT_CERTIFICATE_SETTINGS
//         })
//       })

//       if (response.ok) {
//         toast.success("Template created successfully")
//         setCreateDialogOpen(false)
//         fetchTemplates()
//         resetNewTemplate()
//       } else {
//         const error = await response.json()
//         toast.error(error.error || "Failed to create template")
//       }
//     } catch (error) {
//       toast.error("Failed to create template")
//     }
//   }

//   async function updateTemplate() {
//     if (!selectedTemplate) return

//     try {
//       const response = await fetch(`/api/certificates/templates/${selectedTemplate.id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...selectedTemplate,
//           name: newTemplate.name,
//           description: newTemplate.description,
//           category: newTemplate.category,
//           layout: newTemplate.layout,
//           is_one_page: newTemplate.is_one_page,
//           sections_included: newTemplate.sections_included
//         })
//       })

//       if (response.ok) {
//         toast.success("Template updated successfully")
//         setEditDialogOpen(false)
//         fetchTemplates()
//       } else {
//         const error = await response.json()
//         toast.error(error.error || "Failed to update template")
//       }
//     } catch (error) {
//       toast.error("Failed to update template")
//     }
//   }

//   async function deleteTemplate() {
//     if (!selectedTemplate) return

//     try {
//       const response = await fetch(`/api/certificates/templates/${selectedTemplate.id}`, {
//         method: "DELETE"
//       })

//       if (response.ok) {
//         toast.success("Template deleted successfully")
//         setDeleteDialogOpen(false)
//         fetchTemplates()
//       } else {
//         const error = await response.json()
//         toast.error(error.error || "Failed to delete template")
//       }
//     } catch (error) {
//       toast.error("Failed to delete template")
//     }
//   }

//   async function setAsDefault(templateId: string) {
//     try {
//       const response = await fetch(`/api/certificates/templates/${templateId}/set-default`, {
//         method: "POST"
//       })

//       if (response.ok) {
//         toast.success("Template set as default")
//         fetchTemplates()
//       } else {
//         const error = await response.json()
//         toast.error(error.error || "Failed to set default template")
//       }
//     } catch (error) {
//       toast.error("Failed to set default template")
//     }
//   }

//   async function duplicateTemplate(template: CertificateTemplate) {
//     try {
//       const response = await fetch(`/api/certificates/templates/${template.id}/duplicate`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name: `${template.name} (Copy)` })
//       })

//       if (response.ok) {
//         toast.success("Template duplicated successfully")
//         fetchTemplates()
//       } else {
//         const error = await response.json()
//         toast.error(error.error || "Failed to duplicate template")
//       }
//     } catch (error) {
//       toast.error("Failed to duplicate template")
//     }
//   }

//   async function usePrebuiltTemplate(template: any) {
//     try {
//       const response = await fetch("/api/certificates/templates", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...template,
//           name: `${template.name} - Prebuilt`
//         })
//       })

//       if (response.ok) {
//         toast.success("Prebuilt template added successfully")
//         fetchTemplates()
//       } else {
//         const error = await response.json()
//         toast.error(error.error || "Failed to add prebuilt template")
//       }
//     } catch (error) {
//       toast.error("Failed to add prebuilt template")
//     }
//   }

//   function resetNewTemplate() {
//     setNewTemplate({
//       name: "",
//       description: "",
//       category: "medical",
//       layout: "single",
//       is_one_page: false,
//       sections_included: ["patient_info", "test_results", "diagnosis", "restrictions", "recommendations", "signature"]
//     })
//   }

//   const handleEdit = (template: CertificateTemplate) => {
//     setSelectedTemplate(template)
//     setNewTemplate({
//       name: template.name,
//       description: template.description || "",
//       category: template.category,
//       layout: template.layout,
//       is_one_page: template.is_one_page,
//       sections_included: template.sections_included
//     })
//     setEditDialogOpen(true)
//   }

//   const handleDelete = (template: CertificateTemplate) => {
//     setSelectedTemplate(template)
//     setDeleteDialogOpen(true)
//   }

//   // Function to handle back navigation
//   const handleBack = () => {
//     router.back() // Go back to previous page
//     // Alternatively, you can use a specific route:
//     // router.push("/clinic/settings")
//     // router.push("/clinic/dashboard")
//   }

//   const sectionOptions = [
//     { id: "patient_info", label: "Patient Information" },
//     { id: "test_results", label: "Test Results" },
//     { id: "diagnosis", label: "Diagnosis" },
//     { id: "restrictions", label: "Work Restrictions" },
//     { id: "recommendations", label: "Recommendations" },
//     { id: "signature", label: "Doctor Signature" }
//   ]

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           {/* Back Button */}
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={handleBack}
//             className="h-8 w-8"
//             aria-label="Go back"
//           >
//             <ArrowLeft className="h-4 w-4" />
//           </Button>
          
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Certificate Templates</h1>
//             <p className="text-muted-foreground">
//               Create and manage certificate templates for your clinic
//             </p>
//           </div>
//         </div>
//         <Button onClick={() => setCreateDialogOpen(true)}>
//           <Plus className="mr-2 h-4 w-4" />
//           Create Template
//         </Button>
//       </div>

//       <Tabs defaultValue="my-templates">
//         <TabsList>
//           <TabsTrigger value="my-templates">My Templates</TabsTrigger>
//           <TabsTrigger value="prebuilt">Pre-built Templates</TabsTrigger>
//         </TabsList>
        
//         <TabsContent value="my-templates" className="space-y-4">
//           {loading ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {[1, 2, 3].map(i => (
//                 <Card key={i}>
//                   <CardContent className="p-6">
//                     <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
//                     <div className="h-4 bg-muted rounded w-full mb-6"></div>
//                     <div className="h-32 bg-muted rounded"></div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           ) : templates.length === 0 ? (
//             <Card>
//               <CardContent className="py-12 text-center">
//                 <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//                 <h3 className="text-lg font-medium mb-2">No templates yet</h3>
//                 <p className="text-muted-foreground mb-6">
//                   Create your first template or use a pre-built one
//                 </p>
//                 <div className="flex gap-3 justify-center">
//                   <Button onClick={() => setCreateDialogOpen(true)}>
//                     Create Template
//                   </Button>
//                   <Button variant="outline" onClick={() => {
//                     const prebuiltTab = document.querySelector('[data-value="prebuilt"]') as HTMLElement
//                     if (prebuiltTab) prebuiltTab.click()
//                     }}>
//                     Browse Pre-built
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {templates.map(template => (
//                 <Card key={template.id} className="overflow-hidden">
//                   <CardHeader className="pb-3">
//                     <div className="flex items-start justify-between">
//                       <div>
//                         <CardTitle className="flex items-center gap-2">
//                           {template.name}
//                           {template.is_default && (
//                             <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
//                           )}
//                         </CardTitle>
//                         <CardDescription className="mt-1">
//                           {template.description || "No description"}
//                         </CardDescription>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         {template.is_one_page && (
//                           <Badge variant="outline" className="text-xs">
//                             1 Page
//                           </Badge>
//                         )}
//                         <Badge variant="secondary" className="text-xs capitalize">
//                           {template.category}
//                         </Badge>
//                       </div>
//                     </div>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-3">
//                       <div className="flex flex-wrap gap-1">
//                         {template.sections_included.map(section => (
//                           <Badge key={section} variant="outline" className="text-xs">
//                             {section.replace('_', ' ')}
//                           </Badge>
//                         ))}
//                       </div>
                      
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="text-muted-foreground">Layout:</span>
//                         <span className="font-medium capitalize">{template.layout.replace('_', ' ')}</span>
//                       </div>
                      
//                       <div className="pt-3 border-t flex justify-between">
//                         <div className="flex gap-1">
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             onClick={() => handleEdit(template)}
//                             title="Edit"
//                           >
//                             <Edit className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             onClick={() => duplicateTemplate(template)}
//                             title="Duplicate"
//                           >
//                             <Copy className="h-4 w-4" />
//                           </Button>
//                           {!template.is_default && (
//                             <Button
//                               variant="ghost"
//                               size="icon"
//                               onClick={() => setAsDefault(template.id)}
//                               title="Set as default"
//                             >
//                               <Star className="h-4 w-4" />
//                             </Button>
//                           )}
//                         </div>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => handleDelete(template)}
//                           title="Delete"
//                           className="text-destructive hover:text-destructive"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </TabsContent>
        
//         <TabsContent value="prebuilt" className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {PREBUILT_TEMPLATES.map((template, index) => (
//               <Card key={index} className="overflow-hidden">
//                 <CardHeader className="pb-3">
//                   <div className="flex items-start justify-between">
//                     <div>
//                       <CardTitle>{template.name}</CardTitle>
//                       <CardDescription className="mt-1">
//                         {template.description}
//                       </CardDescription>
//                     </div>
//                     {template.is_one_page && (
//                       <Badge variant="default" className="text-xs">
//                         1 Page
//                       </Badge>
//                     )}
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-3">
//                     <div className="flex flex-wrap gap-1">
//                       {template.sections_included.map(section => (
//                         <Badge key={section} variant="secondary" className="text-xs">
//                           {section.replace('_', ' ')}
//                         </Badge>
//                       ))}
//                     </div>
                    
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-muted-foreground">Category:</span>
//                       <Badge variant="outline" className="text-xs capitalize">
//                         {template.category}
//                       </Badge>
//                     </div>
                    
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="text-muted-foreground">Layout:</span>
//                       <span className="font-medium capitalize">{template.layout.replace('_', ' ')}</span>
//                     </div>
                    
//                     <Button 
//                       className="w-full mt-2"
//                       onClick={() => usePrebuiltTemplate(template)}
//                     >
//                       <Plus className="mr-2 h-4 w-4" />
//                       Add to My Templates
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </TabsContent>
//       </Tabs>

//       {/* Create Template Dialog */}
//       <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Create New Template</DialogTitle>
//           </DialogHeader>
          
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="name">Template Name *</Label>
//                 <Input
//                   id="name"
//                   value={newTemplate.name}
//                   onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
//                   placeholder="e.g., One-Page Medical Certificate"
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="category">Category</Label>
//                 <Select
//                   value={newTemplate.category}
//                   onValueChange={(value: TemplateCategory) => setNewTemplate({...newTemplate, category: value})}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="medical">Medical</SelectItem>
//                     <SelectItem value="fitness">Fitness</SelectItem>
//                     <SelectItem value="employer">Employer</SelectItem>
//                     <SelectItem value="legal">Legal</SelectItem>
//                     <SelectItem value="custom">Custom</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="description">Description</Label>
//               <Textarea
//                 id="description"
//                 value={newTemplate.description}
//                 onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
//                 placeholder="Describe when to use this template..."
//                 rows={2}
//               />
//             </div>
            
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="layout">Layout</Label>
//                 <Select
//                   value={newTemplate.layout}
//                   onValueChange={(value: TemplateLayout) => setNewTemplate({...newTemplate, layout: value})}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="single">Single Column</SelectItem>
//                     <SelectItem value="two_column">Two Column</SelectItem>
//                     <SelectItem value="compact">Compact</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="is_one_page">One Page Certificate</Label>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-muted-foreground">
//                     Optimize for single page
//                   </span>
//                   <Switch
//                     checked={newTemplate.is_one_page}
//                     onCheckedChange={(checked) => setNewTemplate({...newTemplate, is_one_page: checked})}
//                   />
//                 </div>
//               </div>
//             </div>
            
//             <div className="space-y-2">
//               <Label>Sections to Include</Label>
//               <div className="grid grid-cols-2 gap-2">
//                 {sectionOptions.map(section => (
//                   <div key={section.id} className="flex items-center space-x-2">
//                     <Switch
//                       checked={newTemplate.sections_included.includes(section.id)}
//                       onCheckedChange={(checked) => {
//                         if (checked) {
//                           setNewTemplate({
//                             ...newTemplate,
//                             sections_included: [...newTemplate.sections_included, section.id]
//                           })
//                         } else {
//                           setNewTemplate({
//                             ...newTemplate,
//                             sections_included: newTemplate.sections_included.filter(id => id !== section.id)
//                           })
//                         }
//                       }}
//                       id={`section-${section.id}`}
//                     />
//                     <Label htmlFor={`section-${section.id}`} className="text-sm cursor-pointer">
//                       {section.label}
//                     </Label>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
          
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={createTemplate} disabled={!newTemplate.name.trim()}>
//               Create Template
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Edit Template Dialog */}
//       <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Edit Template</DialogTitle>
//           </DialogHeader>
          
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="edit-name">Template Name *</Label>
//                 <Input
//                   id="edit-name"
//                   value={newTemplate.name}
//                   onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
//                 />
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="edit-category">Category</Label>
//                 <Select
//                   value={newTemplate.category}
//                   onValueChange={(value: TemplateCategory) => setNewTemplate({...newTemplate, category: value})}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="medical">Medical</SelectItem>
//                     <SelectItem value="fitness">Fitness</SelectItem>
//                     <SelectItem value="employer">Employer</SelectItem>
//                     <SelectItem value="legal">Legal</SelectItem>
//                     <SelectItem value="custom">Custom</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="edit-description">Description</Label>
//               <Textarea
//                 id="edit-description"
//                 value={newTemplate.description}
//                 onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
//                 rows={2}
//               />
//             </div>
            
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="edit-layout">Layout</Label>
//                 <Select
//                   value={newTemplate.layout}
//                   onValueChange={(value: TemplateLayout) => setNewTemplate({...newTemplate, layout: value})}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="single">Single Column</SelectItem>
//                     <SelectItem value="two_column">Two Column</SelectItem>
//                     <SelectItem value="compact">Compact</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
              
//               <div className="space-y-2">
//                 <Label htmlFor="edit-is_one_page">One Page Certificate</Label>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-muted-foreground">
//                     Optimize for single page
//                   </span>
//                   <Switch
//                     checked={newTemplate.is_one_page}
//                     onCheckedChange={(checked) => setNewTemplate({...newTemplate, is_one_page: checked})}
//                   />
//                 </div>
//               </div>
//             </div>
            
//             <div className="space-y-2">
//               <Label>Sections to Include</Label>
//               <div className="grid grid-cols-2 gap-2">
//                 {sectionOptions.map(section => (
//                   <div key={section.id} className="flex items-center space-x-2">
//                     <Switch
//                       checked={newTemplate.sections_included.includes(section.id)}
//                       onCheckedChange={(checked) => {
//                         if (checked) {
//                           setNewTemplate({
//                             ...newTemplate,
//                             sections_included: [...newTemplate.sections_included, section.id]
//                           })
//                         } else {
//                           setNewTemplate({
//                             ...newTemplate,
//                             sections_included: newTemplate.sections_included.filter(id => id !== section.id)
//                           })
//                         }
//                       }}
//                       id={`edit-section-${section.id}`}
//                     />
//                     <Label htmlFor={`edit-section-${section.id}`} className="text-sm cursor-pointer">
//                       {section.label}
//                     </Label>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
          
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={updateTemplate} disabled={!newTemplate.name.trim()}>
//               Update Template
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Template Dialog */}
//       <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Delete Template</DialogTitle>
//           </DialogHeader>
          
//           <div className="space-y-4">
//             <p>
//               Are you sure you want to delete the template <strong>{selectedTemplate?.name}</strong>?
//             </p>
//             {selectedTemplate?.is_default && (
//               <div className="bg-amber-50 border border-amber-200 rounded p-3">
//                 <p className="text-amber-800 text-sm">
//                   This is your default template. Deleting it will remove the default setting.
//                 </p>
//               </div>
//             )}
//           </div>
          
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={deleteTemplate}>
//               Delete Template
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }
