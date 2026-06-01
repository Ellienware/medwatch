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
      isActive: active === 'true' ? true : active === 'false' ? false : undefined
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
    const { test_code, test_name, price } = body
    
    if (!test_code || !test_name || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: test_code, test_name, price" },
        { status: 400 }
      )
    }

    const testRepo = getClinicalTestRepository()
    
    // Check if test code already exists
    const existingTest = await testRepo.findByTestCode(test_code, user.clinic_id)
    if (existingTest) {
      return NextResponse.json(
        { error: "Test code already exists" },
        { status: 400 }
      )
    }

    // Convert arrays/objects to JSON strings
    const parameters = typeof body.parameters === 'string' 
      ? body.parameters 
      : JSON.stringify(body.parameters || [])
    
    const normal_ranges = typeof body.normal_ranges === 'string'
      ? body.normal_ranges
      : JSON.stringify(body.normal_ranges || {})

    const newTest = await testRepo.create({
      ...body,
      clinic_id: user.clinic_id,
      test_name: body.test_name,
      test_code: body.test_code,
      test_category: body.test_category || "clinical",
      description: body.description || "",
      price: parseFloat(body.price) || 0,
      estimated_duration_minutes: parseInt(body.estimated_duration_minutes) || 15,
      requires_equipment: Boolean(body.requires_equipment),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      parameters,  // JSON string
      normal_ranges  // JSON string
    })
    
    return NextResponse.json(newTest, { status: 201 })
  } catch (error) {
    console.error("Error creating clinical test:", error)
    return NextResponse.json({ 
      error: "Failed to create clinical test",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: "Missing test ID" },
        { status: 400 }
      )
    }

    const testRepo = getClinicalTestRepository()
    
    // Verify the test belongs to this clinic
    const existingTest = await testRepo.findById(body.id)
    if (!existingTest || existingTest.clinic_id !== user.clinic_id) {
      return NextResponse.json(
        { error: "Test not found or access denied" },
        { status: 404 }
      )
    }

    const updatedTest = await testRepo.update(body.id, {
      ...body,
      // Map field names if provided
      ...(body.test_name && { test_name: body.test_name }),
      ...(body.test_code && { test_code: body.test_code }),
      ...(body.test_category && { test_category: body.test_category }),
      ...(body.price !== undefined && { price: parseFloat(body.price) }),
      ...(body.estimated_duration_minutes !== undefined && { 
        estimated_duration_minutes: body.estimated_duration_minutes 
      }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
      ...(body.isActive !== undefined && { is_active: body.isActive })
    })
    
    return NextResponse.json(updatedTest)
  } catch (error) {
    console.error("Error updating clinical test:", error)
    return NextResponse.json({ error: "Failed to update clinical test" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing test ID" },
        { status: 400 }
      )
    }

    const testRepo = getClinicalTestRepository()
    
    // Verify the test belongs to this clinic
    const existingTest = await testRepo.findById(id)
    if (!existingTest || existingTest.clinic_id !== user.clinic_id) {
      return NextResponse.json(
        { error: "Test not found or access denied" },
        { status: 404 }
      )
    }

    // Soft delete by setting is_active to false
    await testRepo.update(id, { is_active: false })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting clinical test:", error)
    return NextResponse.json({ error: "Failed to delete clinical test" }, { status: 500 })
  }
}
