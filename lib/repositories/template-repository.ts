// // lib/repositories/certificate-template-repository.ts
// import { BaseRepository } from "./base-repository"
// import { COLLECTIONS } from "@/lib/appwrite/config"
// import { Query } from "appwrite"
// import type { CertificateTemplate, TemplateCategory } from "@/lib/types/database"
// import logger from "@/lib/logging/logger"

// export class CertificateTemplateRepository extends BaseRepository<CertificateTemplate> {
//   protected collectionId = COLLECTIONS.CERTIFICATE_TEMPLATES

//   constructor() {
//     super("certificate_template")
//   }

//   protected mapToEntity(doc: any): CertificateTemplate {
//     return {
//       id: doc.$id,
//       clinic_id: doc.clinic_id,
//       name: doc.name,
//       description: doc.description || null,
//       thumbnail_url: doc.thumbnail_url || null,
//       category: doc.category || 'medical',
//       settings: typeof doc.settings === 'string' ? JSON.parse(doc.settings) : (doc.settings || {}),
//       layout: doc.layout || 'single',
//       is_default: Boolean(doc.is_default),
//       is_one_page: Boolean(doc.is_one_page),
//       // Handle sections_included properly - it should be an array
//       sections_included: this.parseSectionsIncluded(doc.sections_included),
//       created_by: doc.created_by,
//       created_at: doc.$createdAt || doc.created_at,
//       updated_at: doc.$updatedAt || doc.updated_at,
//     }
//   }

//   private parseSectionsIncluded(data: any): string[] {
//     try {
//       if (Array.isArray(data)) {
//         return data
//       } else if (typeof data === 'string') {
//         // Try to parse as JSON
//         const parsed = JSON.parse(data)
//         return Array.isArray(parsed) ? parsed : []
//       } else {
//         return []
//       }
//     } catch {
//       return []
//     }
//   }

// async create(data: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
//   logger.info('Creating certificate template', { data })
  
//   // Process data for Appwrite
//   const processedData: any = { ...data }
  
//   // Stringify settings if it's an object
//   if (processedData.settings && typeof processedData.settings !== 'string') {
//     processedData.settings = JSON.stringify(processedData.settings)
//   }
  
//   // Ensure sections_included is properly formatted for Appwrite
//   if (processedData.sections_included !== undefined) {
//     if (Array.isArray(processedData.sections_included)) {
//       // ✅ Stringify the array to JSON string for Appwrite
//       processedData.sections_included = JSON.stringify(processedData.sections_included)
//     } else if (typeof processedData.sections_included === 'string') {
//       // Already a string, keep as is
//       // Optional: validate it's valid JSON
//       try {
//         JSON.parse(processedData.sections_included)
//       } catch (e) {
//         // If not valid JSON, treat it as a single value in array
//         processedData.sections_included = JSON.stringify([processedData.sections_included])
//       }
//     } else {
//       // Convert to JSON string
//       processedData.sections_included = JSON.stringify(processedData.sections_included || [])
//     }
//   }
  
//   // Ensure boolean fields are properly set
//   if (processedData.is_default !== undefined) {
//     processedData.is_default = Boolean(processedData.is_default)
//   }
//   if (processedData.is_one_page !== undefined) {
//     processedData.is_one_page = Boolean(processedData.is_one_page)
//   }
  
//   // Ensure required fields
//   if (!processedData.clinic_id) {
//     throw new Error("clinic_id is required")
//   }
//   if (!processedData.name) {
//     throw new Error("name is required")
//   }
  
//   logger.debug('Processed data for Appwrite:', processedData)
  
//   try {
//     const result = await super.create(processedData)
//     logger.info('Template created successfully', { id: result.id })
//     return result
//   } catch (error) {
//     logger.error('Failed to create template', error)
//     throw error
//   }
// }

// async update(id: string, data: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
//   logger.info('Updating certificate template', { id, data })
  
//   const processedData: any = { ...data }
//   if (processedData.settings && typeof processedData.settings !== 'string') {
//     processedData.settings = JSON.stringify(processedData.settings)
//   }
  
//   // Handle sections_included properly
//   if (processedData.sections_included !== undefined) {
//     if (Array.isArray(processedData.sections_included)) {
//       // ✅ Stringify the array to JSON string
//       processedData.sections_included = JSON.stringify(processedData.sections_included)
//     } else if (typeof processedData.sections_included === 'string') {
//       // Already a string, validate it's JSON
//       try {
//         JSON.parse(processedData.sections_included)
//       } catch (e) {
//         processedData.sections_included = JSON.stringify([processedData.sections_included])
//       }
//     } else {
//       processedData.sections_included = JSON.stringify(processedData.sections_included || [])
//     }
//   }
  
//   // Ensure boolean fields are properly set
//   if (processedData.is_default !== undefined) {
//     processedData.is_default = Boolean(processedData.is_default)
//   }
//   if (processedData.is_one_page !== undefined) {
//     processedData.is_one_page = Boolean(processedData.is_one_page)
//   }
  
//   logger.debug('Processed update data:', processedData)
  
//   return super.update(id, processedData)
// }

//   async findByClinicId(clinicId: string, category?: TemplateCategory): Promise<CertificateTemplate[]> {
//     const queries = [Query.equal("clinic_id", clinicId)]
    
//     if (category) {
//       queries.push(Query.equal("category", category))
//     }
    
//     queries.push(Query.orderAsc("name"))
    
//     return this.find(queries)
//   }

//   async findDefaultTemplate(clinicId: string): Promise<CertificateTemplate | null> {
//     const templates = await this.find([
//       Query.equal("clinic_id", clinicId),
//       Query.equal("is_default", true),
//       Query.limit(1)
//     ])
    
//     return templates[0] || null
//   }

//   async setAsDefault(templateId: string): Promise<void> {
//     const template = await this.findById(templateId)
//     if (!template) {
//       throw new Error("Template not found")
//     }

//     // Reset all templates for this clinic
//     const allTemplates = await this.findByClinicId(template.clinic_id)
//     const resetPromises = allTemplates.map(t => 
//       this.update(t.id, { is_default: false })
//     )
    
//     await Promise.all(resetPromises)
    
//     // Set this template as default
//     await this.update(templateId, { is_default: true })
//   }

//   async findOnePageTemplates(clinicId: string): Promise<CertificateTemplate[]> {
//     return this.find([
//       Query.equal("clinic_id", clinicId),
//       Query.equal("is_one_page", true),
//       Query.orderAsc("name")
//     ])
//   }

//   async duplicateTemplate(templateId: string, newName: string): Promise<CertificateTemplate> {
//     const template = await this.findById(templateId)
//     if (!template) {
//       throw new Error("Template not found")
//     }

//     // Create copy with new name
//     const newTemplate: Partial<CertificateTemplate> = {
//       clinic_id: template.clinic_id,
//       name: newName,
//       description: template.description,
//       thumbnail_url: template.thumbnail_url,
//       category: template.category,
//       settings: template.settings,
//       layout: template.layout,
//       is_default: false,
//       is_one_page: template.is_one_page,
//       sections_included: template.sections_included,
//       created_by: template.created_by
//     }
    
//     return this.create(newTemplate)
//   }
// }
