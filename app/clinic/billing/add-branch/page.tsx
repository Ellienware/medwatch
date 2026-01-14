import { Card } from "@/components/ui/card"
import { AddBranchForm } from "@/components/clinic/billing/add-branch-form"

export default function AddBranchPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Add New Branch</h1>
        <p className="text-muted-foreground">
          Add a new branch to your clinic. You will be charged the setup fee (R8,500) and your monthly subscription will
          increase by R6,500.
        </p>
      </div>

      <Card className="p-8">
        <AddBranchForm />
      </Card>
    </div>
  )
}
