//clinic/certificates/
export const dynamic = 'force-dynamic';
import { CertificatesTable } from "@/components/clinic/certificates/certificates-table"
import { CertificatesSearch } from "@/components/clinic/certificates/certificates-search"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

type SearchParams = {
  search?: string
  type?: string
  status?: string
}

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  // Unwrap the searchParams promise
  const params = await searchParams
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Certificates</h1>
          <p className="text-muted-foreground">Issue and manage fitness certificates</p>
        </div>
        <Button asChild>
          <Link href="/clinic/certificates/new">
            <Plus className="mr-2 h-4 w-4" />
            Issue Certificate
          </Link>
        </Button>
      </div>

      <CertificatesSearch />

      <CertificatesTable searchParams={params} />
    </div>
  )
}
