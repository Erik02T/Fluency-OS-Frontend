export type AdminRole = "ADMIN" | "TEACHER" | "STUDENT"

export interface StoredAdminSession {
  accessToken: string
}

const ACCESS_TOKEN_KEY = "fluency-admin-access-token"
const ADMIN_SESSION_EXPIRED_EVENT = "fluency-admin-session-expired"

let inMemoryAccessToken: string | null = null

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined"
}

export function loadStoredAdminSession(): StoredAdminSession | null {
  if (!canUseBrowserStorage()) {
    return null
  }

  if (!inMemoryAccessToken) {
    return null
  }

  return { accessToken: inMemoryAccessToken }
}

export function saveStoredAdminSession(session: StoredAdminSession): void {
  if (!canUseBrowserStorage()) {
    return
  }

  inMemoryAccessToken = session.accessToken
}

export function updateStoredAccessToken(accessToken: string): void {
  if (!canUseBrowserStorage()) {
    return
  }

  inMemoryAccessToken = accessToken
}

export function clearStoredAdminSession(): void {
  if (!canUseBrowserStorage()) {
    inMemoryAccessToken = null
    return
  }

  inMemoryAccessToken = null

  // Remove legados persistentes para eliminar tokens gravados em versões antigas.
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function loadStoredAccessToken(): string | null {
  if (!canUseBrowserStorage()) {
    return null
  }

  return inMemoryAccessToken
}

export function emitAdminSessionExpired(): void {
  if (!canUseBrowserStorage()) {
    return
  }

  window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT))
}

export function onAdminSessionExpired(listener: () => void): () => void {
  if (!canUseBrowserStorage()) {
    return () => undefined
  }

  window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, listener)

  return () => {
    window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, listener)
  }
}

