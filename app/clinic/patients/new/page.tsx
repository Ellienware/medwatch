import { NewPatientForm } from "@/components/clinic/patients/new-patient-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"

export default function NewPatientPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/clinic/patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Register New Patient</h1>
            <p className="text-muted-foreground">
              Add a new patient to your clinic records with AES-256 encryption
            </p>
          </div>
        </div>
      </div>

      {/* Security Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Secure Patient Registration</p>
            <p className="text-sm text-blue-700">
              All sensitive patient information (ID numbers, medical history, contact details) will be encrypted using military-grade AES-256 encryption. 
              Access to encrypted data is controlled by role-based permissions.
            </p>
          </div>
        </div>
      </div>

      <NewPatientForm />
    </div>
  )
}
