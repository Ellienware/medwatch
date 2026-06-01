// app/clinic/certificates/[id]/edit/page.tsx
import { getCurrentUser } from "@/lib/auth/session"
import { CertificateRepository, PatientRepository, ClinicRepository, BranchRepository } from "@/lib/repositories"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { UpdateCertificateForm } from "@/components/clinic/certificates/update-certificate-form"

export default async function UpdateCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user || !user.clinic_id) {
    redirect("/auth/signin")
  }

  const certificateId = (await params).id
  
  const certificateRepo = new CertificateRepository()
  const patientRepo = new PatientRepository()
  const clinicRepo = new ClinicRepository()
  
  // Get certificate with all related data
  const certificateWithData = await certificateRepo.findWithTestResults(certificateId)
  
  // Verify access
  if (certificateWithData.certificate.clinic_id !== user.clinic_id) {
    redirect("/clinic/certificates")
  }

  // Get clinic branch information
  let branchData = null
  if (certificateWithData.branch) {
    branchData = certificateWithData.branch
  } else {
    // Try to get branch from clinic
    const branchRepo = new BranchRepository()
    const branches = await branchRepo.findByClinicId(user.clinic_id)
    branchData = branches[0] || null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clinic/certificates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Update Medical Certificate</h1>
          <p className="text-muted-foreground">
            Certificate #{certificateWithData.certificate.certificate_number}
          </p>
        </div>
      </div>

      <UpdateCertificateForm 
        certificate={certificateWithData.certificate}
        patient={certificateWithData.patient}
        clinic={certificateWithData.clinic}
        branch={branchData}
        testResults={certificateWithData.testResults}
      />
    </div>
  )
}
