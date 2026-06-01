// app/api/clinical-tests/seed/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getClinicalTestRepository } from "@/lib/repositories"

const DEFAULT_TESTS = [
  {
    test_code: "audiometry",
    test_name: "Audiometry (Hearing Test)",
    test_category: "clinical",
    description: "Hearing threshold measurement for both ears",
    price: 50.00,
    estimated_duration_minutes: 30,
    requires_equipment: true,
    is_active: true
  },
  {
    test_code: "spirometry",
    test_name: "Spirometry (Lung Function)",
    test_category: "clinical",
    description: "Lung function test measuring FVC, FEV1, and other parameters",
    price: 45.00,
    estimated_duration_minutes: 20,
    requires_equipment: true,
    is_active: true
  },
  {
    test_code: "vision",
    test_name: "Vision Screening",
    test_category: "clinical",
    description: "Visual acuity and color vision testing",
    price: 25.00,
    estimated_duration_minutes: 15,
    requires_equipment: false,
    is_active: true
  },
  {
    test_code: "bp",
    test_name: "Blood Pressure",
    test_category: "clinical",
    description: "Blood pressure measurement",
    price: 15.00,
    estimated_duration_minutes: 5,
    requires_equipment: false,
    is_active: true
  },
  {
    test_code: "drug",
    test_name: "Drug & Alcohol Screening",
    test_category: "clinical",
    description: "Substance abuse screening",
    price: 75.00,
    estimated_duration_minutes: 45,
    requires_equipment: true,
    is_active: true
  }
]

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const testRepo = getClinicalTestRepository()
    const results = []
    
    for (const testTemplate of DEFAULT_TESTS) {
      try {
        // Check if test already exists
        const existing = await testRepo.findByTestCode(testTemplate.test_code, user.clinic_id)
        
        if (!existing) {
          const test = await testRepo.create({
            ...testTemplate,
            clinic_id: user.clinic_id
          })
          results.push({ success: true, test: test.test_name, id: test.id })
        } else {
          results.push({ success: false, test: testTemplate.test_name, error: "Already exists" })
        }
      } catch (error) {
        results.push({ 
          success: false, 
          test: testTemplate.test_name, 
          error: error instanceof Error ? error.message : String(error) 
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${results.filter(r => r.success).length} tests`,
      results
    })
  } catch (error) {
    console.error("Error seeding tests:", error)
    return NextResponse.json({ 
      error: "Failed to seed tests",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
