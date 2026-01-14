// lib/actions/export-actions.ts - FIXED VERSION
"use server"

import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { getCurrentUser } from "@/lib/auth/actions"
import { EmployerRepository } from "@/lib/repositories/employer-repository"
import { jsPDF } from "jspdf"
import { format } from "date-fns"

// Type declaration for jspdf-autotable (since it doesn't have official types)
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Import dynamically to avoid issues
let autoTable: any = null

async function loadAutoTable() {
  if (!autoTable) {
    const module = await import("jspdf-autotable")
    autoTable = module.default || module
  }
  return autoTable
}

export async function exportEmployerEmployees(employerId: string, formatType: 'csv' | 'pdf' = 'csv') {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized")
    }

    const { databases } = createServerClient()
    const employerRepo = new EmployerRepository()
    
    // Get employer details
    const employer = await employerRepo.findById(employerId)
    
    if (!employer || employer.clinic_id !== user.clinic_id) {
      throw new Error("Employer not found or unauthorized")
    }

    // Get all employees for this employer
    const employees = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PATIENTS,
      [
        Query.equal("clinic_id", user.clinic_id),
        Query.equal("employer_id", employerId),
        Query.orderAsc("last_name"),
        Query.limit(1000)
      ]
    )

    if (formatType === 'csv') {
      return exportToCSV(employees.documents, employer)
    } else if (formatType === 'pdf') {
      return await exportToPDF(employees.documents, employer)
    }

    throw new Error("Unsupported export format")
  } catch (error: any) {
    console.error("Export error:", error)
    throw error
  }
}

function exportToCSV(employees: any[], employer: any) {
  // CSV headers
  const headers = [
    "Employee Number",
    "First Name", 
    "Last Name",
    "ID Number",
    "Date of Birth",
    "Gender",
    "Job Title",
    "Department",
    "Email",
    "Phone",
    "Emergency Contact",
    "Emergency Phone",
    "Allergies",
    "Chronic Conditions"
  ]

  // Convert data to CSV rows
  const rows = employees.map(employee => [
    employee.employee_number || '',
    employee.first_name || '',
    employee.last_name || '',
    employee.id_number || '',
    employee.date_of_birth || '',
    employee.gender || '',
    employee.job_title || '',
    employee.department || '',
    employee.email || '',
    employee.phone || '',
    employee.emergency_contact_name || '',
    employee.emergency_contact_phone || '',
    employee.allergies || '',
    employee.chronic_conditions || ''
  ])

  // Combine headers and rows
  const csvContent = [
    `Employer: ${employer.company_name}`,
    `Export Date: ${new Date().toLocaleDateString()}`,
    `Total Employees: ${employees.length}`,
    "",
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n")

  return {
    filename: `${sanitizeFilename(employer.company_name)}_employees_${format(new Date(), 'yyyy-MM-dd')}.csv`,
    content: csvContent,
    contentType: "text/csv"
  }
}

async function exportToPDF(employees: any[], employer: any) {
  // Load autoTable dynamically
  const autoTableFn = await loadAutoTable()
  
  // Create PDF document
  const doc = new jsPDF()
  
  // Add header
  doc.setFontSize(20)
  doc.text(`EMPLOYEE REPORT`, 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(`Employer: ${employer.company_name}`, 20, 35)
  doc.text(`Date: ${format(new Date(), 'PPP')}`, 20, 42)
  doc.text(`Total Employees: ${employees.length}`, 20, 49)
  
  // Add company info if available
  if (employer.registration_number) {
    doc.text(`Registration: ${employer.registration_number}`, 20, 56)
  }
  
  // Prepare table data
  const tableData = employees.map(emp => [
    emp.employee_number || '-',
    `${emp.first_name || ''} ${emp.last_name || ''}`,
    emp.id_number || '',
    emp.date_of_birth ? format(new Date(emp.date_of_birth), 'yyyy-MM-dd') : '-',
    emp.job_title || '-',
    emp.department || '-',
    emp.gender || '-'
  ])
  
  // Use the autoTable function
  autoTableFn(doc, {
    head: [['Emp #', 'Full Name', 'ID Number', 'DOB', 'Job Title', 'Department', 'Gender']],
    body: tableData,
    startY: 65,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 35 },
      5: { cellWidth: 30 },
      6: { cellWidth: 20 }
    },
    margin: { horizontal: 20 }
  })
  
  // Add footer with page number
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(
      `Page ${i} of ${pageCount} | Generated by MedSurve Clinic System`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }
  
  // Convert to base64
  const pdfOutput = doc.output('datauristring')
  const pdfParts = pdfOutput.split(',')
  const pdfBase64 = pdfParts.length > 1 ? pdfParts[1] : ''
  
  if (!pdfBase64) {
    throw new Error("Failed to generate PDF")
  }
  
  return {
    filename: `${sanitizeFilename(employer.company_name)}_employees_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
    content: pdfBase64,
    contentType: "application/pdf"
  }
}

// Additional export function for detailed medical report
export async function exportEmployerMedicalReport(employerId: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized")
    }

    const { databases } = createServerClient()
    const employerRepo = new EmployerRepository()
    
    // Get employer details
    const employer = await employerRepo.findById(employerId)
    
    if (!employer || employer.clinic_id !== user.clinic_id) {
      throw new Error("Employer not found or unauthorized")
    }

    // Get employees with their medical records
    const employees = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PATIENTS,
      [
        Query.equal("clinic_id", user.clinic_id),
        Query.equal("employer_id", employerId),
        Query.orderAsc("last_name"),
        Query.limit(100)
      ]
    )

    return await generateMedicalReportPDF(employees.documents, employer)
  } catch (error: any) {
    console.error("Medical report export error:", error)
    throw error
  }
}

async function generateMedicalReportPDF(employees: any[], employer: any) {
  const doc = new jsPDF()
  
  // Title page
  doc.setFontSize(24)
  doc.text('MEDICAL STATUS REPORT', 105, 50, { align: 'center' })
  
  doc.setFontSize(16)
  doc.text(employer.company_name, 105, 70, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(`Generated on: ${format(new Date(), 'PPPP')}`, 105, 85, { align: 'center' })
  doc.text(`Total Employees: ${employees.length}`, 105, 95, { align: 'center' })
  
  doc.addPage()
  
  // Summary statistics
  const genderCounts = employees.reduce((acc: Record<string, number>, emp) => {
    const gender = emp.gender || 'Unknown'
    acc[gender] = (acc[gender] || 0) + 1
    return acc
  }, {})
  
  const employeesWithAllergies = employees.filter(emp => emp.allergies).length
  const employeesWithConditions = employees.filter(emp => emp.chronic_conditions).length
  
  doc.setFontSize(16)
  doc.text('Executive Summary', 20, 20)
  
  doc.setFontSize(11)
  doc.text(`Gender Distribution:`, 20, 35)
  
  const genderEntries = Object.entries(genderCounts)
  genderEntries.forEach(([gender, count], index) => {
    const percentage = ((count as number) / employees.length) * 100
    doc.text(`  • ${gender}: ${count} (${percentage.toFixed(1)}%)`, 25, 42 + (index * 7))
  })
  
  doc.text(`Health Statistics:`, 20, 65)
  doc.text(`  • Employees with allergies: ${employeesWithAllergies}`, 25, 72)
  doc.text(`  • Employees with chronic conditions: ${employeesWithConditions}`, 25, 79)
  
  const avgAge = calculateAverageAge(employees)
  doc.text(`  • Average age: ${avgAge.toFixed(1)} years`, 25, 86)
  
  // Detailed employee list
  employees.forEach((employee, index) => {
    if (index > 0 && index % 2 === 0) {
      doc.addPage()
    }
    
    const yPos = index % 2 === 0 ? 100 : 150
    
    doc.setFontSize(12)
    doc.setFont(undefined as any, 'bold')
    doc.text(`${employee.first_name || ''} ${employee.last_name || ''}`, 20, yPos)
    
    doc.setFont(undefined as any, 'normal')
    doc.setFontSize(10)
    
    let lineHeight = yPos + 8
    doc.text(`ID: ${employee.id_number || 'N/A'}`, 20, lineHeight)
    
    const dobText = employee.date_of_birth 
      ? format(new Date(employee.date_of_birth), 'yyyy-MM-dd')
      : 'N/A'
    doc.text(`DOB: ${dobText}`, 100, lineHeight)
    
    lineHeight += 6
    doc.text(`Job: ${employee.job_title || 'N/A'}`, 20, lineHeight)
    doc.text(`Dept: ${employee.department || 'N/A'}`, 100, lineHeight)
    
    lineHeight += 6
    if (employee.allergies) {
      doc.text(`Allergies: ${employee.allergies}`, 20, lineHeight)
      lineHeight += 6
    }
    
    if (employee.chronic_conditions) {
      doc.text(`Conditions: ${employee.chronic_conditions}`, 20, lineHeight)
      lineHeight += 6
    }
    
    // Add a separator line
    doc.line(20, lineHeight, 190, lineHeight)
  })
  
  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Confidential Medical Report - ${employer.company_name} - Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }
  
  // Convert to base64 safely
  const pdfOutput = doc.output('datauristring')
  const pdfParts = pdfOutput.split(',')
  const pdfBase64 = pdfParts.length > 1 ? pdfParts[1] : ''
  
  if (!pdfBase64) {
    throw new Error("Failed to generate PDF")
  }
  
  return {
    filename: `${sanitizeFilename(employer.company_name)}_medical_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
    content: pdfBase64,
    contentType: "application/pdf"
  }
}

function calculateAverageAge(employees: any[]): number {
  const now = new Date()
  let totalAge = 0
  let validCount = 0
  
  employees.forEach(emp => {
    if (emp.date_of_birth) {
      try {
        const dob = new Date(emp.date_of_birth)
        if (!isNaN(dob.getTime())) {
          const age = now.getFullYear() - dob.getFullYear()
          totalAge += age
          validCount++
        }
      } catch (error) {
        // Skip invalid dates
        console.warn('Invalid date of birth:', emp.date_of_birth)
      }
    }
  })
  
  return validCount > 0 ? totalAge / validCount : 0
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}