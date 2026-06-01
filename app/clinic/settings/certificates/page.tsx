//clinic/settings/certificates
import { getCurrentUser } from "@/lib/auth/session"
import { ClinicRepository } from "@/lib/repositories"
import { redirect } from "next/navigation"
import { CertificateSettingsForm } from "@/components/clinic/settings/certificate-settings-form"

export default async function CertificateSettingsPage() {
  const user = await getCurrentUser()
  if (!user || !user.clinic_id) {
    redirect("/auth/signin")
  }

  const clinicRepo = new ClinicRepository()
  const clinic = await clinicRepo.findById(user.clinic_id)

  if (!clinic) {
    redirect("/clinic")
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Certificate Settings</h1>
        <p className="text-muted-foreground mt-2">Customize how your medical certificates appear</p>
      </div>

      <CertificateSettingsForm clinic={clinic} />
    </div>
  )
}
