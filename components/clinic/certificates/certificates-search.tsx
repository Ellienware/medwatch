//components/clinic/certificates/certificates-search.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export function CertificatesSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    startTransition(() => {
      router.push(`/clinic/certificates?${params.toString()}`)
    })
  }

  const handleTypeFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set("type", value)
    } else {
      params.delete("type")
    }
    startTransition(() => {
      router.push(`/clinic/certificates?${params.toString()}`)
    })
  }

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set("status", value)
    } else {
      params.delete("status")
    }
    startTransition(() => {
      router.push(`/clinic/certificates?${params.toString()}`)
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by certificate number or patient name..."
              className="pl-9"
              defaultValue={searchParams.get("search") || ""}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="flex gap-2">
            <Select defaultValue={searchParams.get("type") || "all"} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="fit_to_work">Fit to Work</SelectItem>
                <SelectItem value="fit_with_restrictions">Fit with Restrictions</SelectItem>
                <SelectItem value="unfit_to_work">Unfit to Work</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={searchParams.get("status") || "all"} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
