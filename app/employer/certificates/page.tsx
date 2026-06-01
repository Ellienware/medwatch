import { EmployerCertificatesTable } from "@/components/employer/employer-certificates-table"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
export const dynamic = 'force-dynamic'
export default function EmployerCertificatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Medical Certificates</h1>
        <p className="text-muted-foreground">Access employee fitness certificates</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search certificates..." className="pl-9" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="fit">Fit to Work</SelectItem>
            <SelectItem value="restrictions">With Restrictions</SelectItem>
            <SelectItem value="unfit">Unfit to Work</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <EmployerCertificatesTable />
    </div>
  )
}
