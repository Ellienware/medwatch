// lib/auth/session-actions.ts
"use server"

import { cookies } from "next/headers"

export async function clearInvalidSession() {
  const cookieStore = await cookies()
  cookieStore.delete("appwrite-session")
  return { success: true }
}
