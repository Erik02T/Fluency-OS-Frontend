import { type AdminRole } from "@/lib/auth-storage"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export interface AuthenticatedAdminUser {
  id: string
  email: string
  role: AdminRole
  username: string
  displayName?: string | null
  avatarUrl?: string | null
  jlptGoal?: string
}

export type AuthenticatedUser = AuthenticatedAdminUser

export interface AuthResponse {
  accessToken: string
  user: AuthenticatedUser
}

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  name: string
}

interface RefreshResponse {
  accessToken: string
}

interface ApiErrorBody {
  message?: string | string[]
  error?: string
  statusCode?: number
}

function toPublicUser(user: AuthenticatedUser): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    jlptGoal: user.jlptGoal,
  }
}

function assertSafeAuthResponse(payload: AuthResponse): AuthResponse {
  const userRecord = payload.user as AuthenticatedUser & {
    passwordHash?: unknown
  }

  if ("passwordHash" in userRecord && userRecord.passwordHash !== undefined) {
    throw new Error("Resposta de autenticação inválida: dados sensíveis detectados.")
  }

  return {
    accessToken: payload.accessToken,
    user: toPublicUser(payload.user),
  }
}

async function parseApiError(response: Response): Promise<string> {
  const details = await response.text()

  if (!details) {
    return `Request failed with status ${response.status}`
  }

  try {
    const parsed = JSON.parse(details) as ApiErrorBody
    if (Array.isArray(parsed.message)) {
      return parsed.message.join(" ")
    }

    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message
    }
  } catch {
    // Resposta não-JSON: usa texto bruto sanitizado.
  }

  return details.slice(0, 300)
}

async function postAuth(
  path: "/auth/login" | "/auth/register",
  payload: LoginPayload | RegisterPayload,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  const body = (await response.json()) as AuthResponse
  return assertSafeAuthResponse(body)
}

export async function loginAdmin(payload: LoginPayload): Promise<AuthResponse> {
  return postAuth("/auth/login", payload)
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return postAuth("/auth/login", payload)
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return postAuth("/auth/register", payload)
}

export async function getCurrentAdminUser(accessToken: string): Promise<AuthenticatedUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  const user = (await response.json()) as AuthenticatedUser & {
    passwordHash?: unknown
  }

  if ("passwordHash" in user && user.passwordHash !== undefined) {
    throw new Error("Resposta de perfil inválida: dados sensíveis detectados.")
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    jlptGoal: user.jlptGoal,
  }
}

export async function refreshAdminAccessToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  const payload = (await response.json()) as RefreshResponse
  return payload.accessToken
}

let refreshRequest: Promise<string | null> | null = null

export async function tryRefreshAdminSession(): Promise<string | null> {
  if (refreshRequest) {
    return refreshRequest
  }

  refreshRequest = (async () => {
    try {
      return await refreshAdminAccessToken()
    } catch {
      return null
    } finally {
      refreshRequest = null
    }
  })()

  return refreshRequest
}

export async function logoutAdmin(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }
}
