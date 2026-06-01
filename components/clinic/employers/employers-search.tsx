"use client"

import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useEffect, useState } from "react"

interface EmployersSearchProps {
  initialSearch?: string
}

export function EmployersSearch({ initialSearch = "" }: EmployersSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(initialSearch)

  // Sync with URL when it changes
  useEffect(() => {
    const currentSearch = searchParams.get("search") || ""
    if (currentSearch !== searchValue) {
      setSearchValue(currentSearch)
    }
  }, [searchParams, searchValue])

  const handleSearch = (value: string) => {
    setSearchValue(value)
    
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }
    
    startTransition(() => {
      router.push(`/clinic/employers?${params.toString()}`)
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employers by name, email, or registration number..."
            className="pl-9"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isPending}
          />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          )}
        </div>
        {initialSearch && (
          <p className="mt-2 text-sm text-muted-foreground">
            Showing results for "{initialSearch}"
          </p>
        )}
      </CardContent>
    </Card>
  )
}
