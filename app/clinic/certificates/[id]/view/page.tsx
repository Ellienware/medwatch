// app/clinic/certificates/[id]/view/page.tsx
import { CertificateViewer } from "@/components/clinic/certificates/certificate-viewer"
import { getCurrentUser } from "@/lib/auth/session"
import { CertificateRepository } from "@/lib/repositories"
import { redirect } from "next/navigation"


export default async function ViewCertificatePage({
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
  
  const certificateWithData = await certificateRepo.findWithTestResults(certificateId)
  
  // Verify access
  if (certificateWithData.certificate.clinic_id !== user.clinic_id) {
    redirect("/clinic/certificates")
  }

  return (
    <div className="container mx-auto py-8">
      <CertificateViewer 
        certificate={certificateWithData.certificate}
        patient={certificateWithData.patient}
        clinic={certificateWithData.clinic}
        branch={certificateWithData.branch}
        testResults={certificateWithData.testResults}
      />
    </div>
  )
}
