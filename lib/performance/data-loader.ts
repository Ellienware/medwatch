/**
 * Data loader factory for common queries
 * Implements batching and caching for efficient data fetching
 */

import { BatchLoader } from "./batch-loader"
import { getUserRepository, getClinicRepository } from "@/lib/repositories"

// User loader
export function createUserLoader() {
  return new BatchLoader(async (userIds: string[]) => {
    const userRepo = getUserRepository()

    // Fetch all users in a single query
    const users = await Promise.all(userIds.map((id) => userRepo.findById(id)))

    return users.filter((user): user is NonNullable<typeof user> => user !== null)
  })
}

// Clinic loader
export function createClinicLoader() {
  return new BatchLoader(async (clinicIds: string[]) => {
    const clinicRepo = getClinicRepository()

    // Fetch all clinics in a single query
    const clinics = await Promise.all(clinicIds.map((id) => clinicRepo.findById(id)))

    return clinics.filter((clinic): clinic is NonNullable<typeof clinic> => clinic !== null)
  })
}

// Shared loaders (reset per request in production)
let userLoader = createUserLoader()
let clinicLoader = createClinicLoader()

export function getUserLoader() {
  return userLoader
}

export function getClinicLoader() {
  return clinicLoader
}

export function resetLoaders() {
  userLoader = createUserLoader()
  clinicLoader = createClinicLoader()
}
