//clinic/certificates/new
import { CertificateReviewForm } from "@/components/clinic/certificates/certificate-review-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function IssueCertificatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clinic/certificates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        {/* <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Issue Medical Certificate</h1>
          <p className="text-muted-foreground">Generate fitness-to-work certificate</p>
        </div> */}
      </div>

        <CertificateReviewForm />
    </div>
  )
}
