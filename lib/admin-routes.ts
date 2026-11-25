export const ADMIN_LOGIN_ROUTE = "/dashboard/admin/login"
export const DASHBOARD_ROUTE = "/dashboard"

export const SESSION_COOKIE_NAME = "fluency-admin-refresh-token"
export const AUTH_ROLE_COOKIE_NAME = "fluency-auth-role"

export const ADMIN_ROUTE_PREFIXES = [
  "/dashboard/kanji/admin",
  "/dashboard/vocab/admin",
  "/dashboard/grammar/admin",
] as const

export function isAdminAppRoute(pathname: string): boolean {
  return ADMIN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function resolveSafeAdminNextPath(nextPath: string | null): string {
  if (
    !nextPath ||
    !nextPath.startsWith("/") ||
    nextPath.startsWith("//") ||
    !isAdminAppRoute(nextPath.split("?")[0] ?? nextPath)
  ) {
    return ADMIN_ROUTE_PREFIXES[0]
  }

  return nextPath
}
