// app/api/clinical-tests/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getClinicalTestRepository } from "@/lib/repositories"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const active = searchParams.get('active')
    
    const testRepo = getClinicalTestRepository()
    
    const tests = await testRepo.findByClinicId(user.clinic_id, {
      isActive: active === 'true' ? true : undefined
    })
    
    return NextResponse.json(tests)
  } catch (error) {
    console.error("Error fetching clinical tests:", error)
    return NextResponse.json({ error: "Failed to fetch clinical tests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    const { name, description, category, price, duration } = body
    
    if (!name || !category || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const testRepo = getClinicalTestRepository()
    
    const newTest = await testRepo.create({
      ...body,
      clinic_id: user.clinic_id,
      isActive: body.isActive !== undefined ? body.isActive : true
    })
    
    return NextResponse.json(newTest, { status: 201 })
  } catch (error) {
    console.error("Error creating clinical test:", error)
    return NextResponse.json({ error: "Failed to create clinical test" }, { status: 500 })
  }
}