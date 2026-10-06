"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { ADMIN_LOGIN_ROUTE } from "@/lib/admin-routes"

interface RequireAdminResult {
  isAuthenticated: boolean
  isAdmin: boolean
  isInitializing: boolean
  canAccessAdmin: boolean
}

/**
 * Garante que páginas Admin só permaneçam acessíveis para role ADMIN.
 * Usuários sem permissão são redirecionados ao login administrativo.
 */
export function useRequireAdmin(): RequireAdminResult {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isAdmin, isInitializing } = useAdminAuth()

  React.useEffect(() => {
    if (isInitializing) {
      return
    }

    if (!isAuthenticated || !isAdmin) {
      const nextPath = encodeURIComponent(`${pathname}${window.location.search}`)
      router.replace(`${ADMIN_LOGIN_ROUTE}?next=${nextPath}`)
    }
  }, [isInitializing, isAuthenticated, isAdmin, pathname, router])

  return {
    isAuthenticated,
    isAdmin,
    isInitializing,
    canAccessAdmin: Boolean(isAuthenticated && isAdmin),
  }
}
