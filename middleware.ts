import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  ADMIN_LOGIN_ROUTE,
  AUTH_ROLE_COOKIE_NAME,
  DASHBOARD_ROUTE,
  SESSION_COOKIE_NAME,
  isAdminAppRoute,
  parseSignedAuthRoleCookie,
} from "@/lib/admin-routes"

function redirectToAdminLogin(request: NextRequest, pathname: string) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = ADMIN_LOGIN_ROUTE
  loginUrl.search = ""
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

/**
 * Protege rotas Admin na edge:
 * 1. Verifica cookie de sessão (refresh token httpOnly)
 * 2. Valida cookie de role assinado por HMAC (prevenção contra tampering)
 * 3. Apenas role === "ADMIN" segue para a rota protegida
 *
 * Níveis de fallback:
 * - Sem cookie de sessão      → redireciona para /dashboard/admin/login
 * - Cookie de role inválido   → redireciona para /dashboard (usuário comum)
 * - Role não-ADMIN           → redireciona para /dashboard
 * - Segredo HMAC ausente     → bloqueia (parseSignedAuthRoleCookie retorna null)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isAdminAppRoute(pathname)) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const hasSession = Boolean(sessionCookie && sessionCookie.trim().length > 0)

  if (!hasSession) {
    console.debug("[middleware:admin-guard] Sem sessão. Redirecionando para login admin.", {
      pathname,
    })
    return redirectToAdminLogin(request, pathname)
  }

  const rawRoleCookie = request.cookies.get(AUTH_ROLE_COOKIE_NAME)?.value
  const role = await parseSignedAuthRoleCookie(rawRoleCookie)

  if (role !== "ADMIN") {
    console.debug("[middleware:admin-guard] Role inválida ou ausente. Redirecionando para dashboard.", {
      pathname,
      hasRoleCookie: Boolean(rawRoleCookie),
      resolvedRole: role ?? null,
    })
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = DASHBOARD_ROUTE
    dashboardUrl.search = ""
    return NextResponse.redirect(dashboardUrl)
  }

  console.debug("[middleware:admin-guard] Acesso autorizado.", { pathname, role })
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/kanji/admin/:path*",
    "/dashboard/vocab/admin/:path*",
    "/dashboard/grammar/admin/:path*",
  ],
}
