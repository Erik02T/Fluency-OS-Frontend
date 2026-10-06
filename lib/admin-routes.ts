export const ADMIN_LOGIN_ROUTE = "/dashboard/admin/login"
export const DASHBOARD_ROUTE = "/dashboard"

export const SESSION_COOKIE_NAME = "fluency-admin-refresh-token"
export const AUTH_ROLE_COOKIE_NAME = "fluency-auth-role"

export const ADMIN_ROUTE_PREFIXES = [
  "/dashboard/kanji/admin",
  "/dashboard/vocab/admin",
  "/dashboard/grammar/admin",
] as const

const VALID_ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const
type ValidRole = (typeof VALID_ROLES)[number]

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

let roleCookieSecretWarningLogged = false

function resolveRoleCookieSecret(): string {
  const secret =
    process.env.AUTH_ROLE_COOKIE_SECRET || process.env.JWT_SECRET || ""

  if (!secret && !roleCookieSecretWarningLogged) {
    roleCookieSecretWarningLogged = true
    console.warn(
      "[admin-routes] AUTH_ROLE_COOKIE_SECRET ou JWT_SECRET não definidos no ambiente Next.js. " +
        "Validação de role no middleware ficará desativada.",
    )
  }

  return secret
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

async function createRoleSignature(role: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`role:${role}`),
  )

  return toBase64Url(signature)
}

function isValidRole(role: string): role is ValidRole {
  return VALID_ROLES.includes(role as ValidRole)
}

/**
 * Valida cookie de role assinado pelo backend (HMAC-SHA256).
 * Retorna a role apenas se a assinatura for válida.
 * Se o segredo não estiver configurado no ambiente, retorna null
 * para impedir acesso indevido por falha de configuração.
 */
export async function parseSignedAuthRoleCookie(
  value: string | undefined | null,
): Promise<ValidRole | null> {
  if (!value) {
    return null
  }

  const secret = resolveRoleCookieSecret()
  if (!secret) {
    return null
  }

  const [role, signature] = value.split(".")
  if (!role || !signature || !isValidRole(role)) {
    return null
  }

  const expected = await createRoleSignature(role, secret)
  if (expected.length !== signature.length) {
    return null
  }

  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index)
  }

  if (mismatch !== 0) {
    return null
  }

  return role
}
