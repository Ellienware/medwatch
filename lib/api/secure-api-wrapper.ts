/**
 * Wrapper for API routes with built-in access control
 */

import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { hasPermission } from "@/lib/auth/permissions"
import { auditFailure } from "@/lib/security/audit-log"
import type { UserRole } from "@/lib/types/database"
import logger from "@/lib/logging/logger"

interface ApiHandlerOptions {
  requiredRole?: UserRole | UserRole[]
  requiredPermission?: string
  requireAuth?: boolean
}

type ApiHandler = (req: NextRequest, context: { user: any; params: any }) => Promise<NextResponse>

/**
 * Wrap API route with access control
 *
 * Usage:
 * export const GET = withApiAuth(async (req, { user }) => {
 *   // Your handler code
 * }, { requiredRole: 'doctor' })
 */
export function withApiAuth(handler: ApiHandler, options: ApiHandlerOptions = {}) {
  return async (req: NextRequest, context: any = {}) => {
    const startTime = Date.now()

    try {
      // Authentication check
      if (options.requireAuth !== false) {
        const user = await getCurrentUser()

        if (!user) {
          logger.warn("Unauthorized API access attempt", {
            path: req.nextUrl.pathname,
            method: req.method,
          })

          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Role check
        if (options.requiredRole) {
          const requiredRoles = Array.isArray(options.requiredRole) ? options.requiredRole : [options.requiredRole]

          if (!requiredRoles.includes(user.role as UserRole)) {
            await auditFailure({
              clinicId: user.clinic_id || "unknown",
              userId: user.id,
              userEmail: user.email,
              userRole: user.role,
              action: "read" as any,
              entityType: "api" as any,
              entityId: req.nextUrl.pathname,
              errorMessage: `Insufficient role: required ${requiredRoles.join(" or ")}, got ${user.role}`,
            })

            logger.warn("Insufficient role for API access", {
              path: req.nextUrl.pathname,
              userRole: user.role,
              requiredRoles,
            })

            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
          }
        }

        // Permission check
        if (options.requiredPermission && !hasPermission(user.role as UserRole, options.requiredPermission)) {
          await auditFailure({
            clinicId: user.clinic_id || "unknown",
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            action: "read" as any,
            entityType: "api" as any,
            entityId: req.nextUrl.pathname,
            errorMessage: `Missing permission: ${options.requiredPermission}`,
          })

          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Execute handler with user context
        const response = await handler(req, { ...context, user })

        // Log successful request
        const duration = Date.now() - startTime
        logger.info("API request completed", {
          path: req.nextUrl.pathname,
          method: req.method,
          userId: user.id,
          duration,
        })

        return response
      } else {
        // Execute handler without auth
        return await handler(req, context)
      }
    } catch (error: any) {
      const duration = Date.now() - startTime

      logger.error("API request error", error, {
        path: req.nextUrl.pathname,
        method: req.method,
        duration,
      })

      return NextResponse.json(
        {
          error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
        },
        { status: 500 },
      )
    }
  }
}
