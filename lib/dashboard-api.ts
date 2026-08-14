import { tryRefreshAdminSession } from "@/lib/auth-api"
import {
  clearStoredAdminSession,
  emitAdminSessionExpired,
  loadStoredAccessToken,
  updateStoredAccessToken,
} from "@/lib/auth-storage"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export interface DashboardSummaryDto {
  kanjiStudied: number
  kanjiMastered: number
  dueReviews: number
  favoriteKanjis: number
  totalReviews: number
  accuracyRate: number
  currentStreak: number
  longestStreak: number
  lastReviewAt: string | null
}

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const createHeaders = (token?: string | null): Headers => {
    const headers = new Headers()
    headers.set("Accept", "application/json")

    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    return headers
  }

  let shouldExpireSession = false
  const accessToken = loadStoredAccessToken()

  let response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    method: "GET",
    headers: createHeaders(accessToken),
    cache: "no-store",
  })

  if (response.status === 401) {
    const refreshedToken = await tryRefreshAdminSession()

    if (refreshedToken) {
      updateStoredAccessToken(refreshedToken)

      response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
        method: "GET",
        headers: createHeaders(refreshedToken),
        cache: "no-store",
      })
    } else {
      shouldExpireSession = true
    }
  }

  if (response.status === 401) {
    shouldExpireSession = true
  }

  if (shouldExpireSession) {
    clearStoredAdminSession()
    emitAdminSessionExpired()
  }

  if (!response.ok) {
    const details = await response.text()
    throw new Error(details || `Request failed with status ${response.status}`)
  }

  return (await response.json()) as DashboardSummaryDto
}
