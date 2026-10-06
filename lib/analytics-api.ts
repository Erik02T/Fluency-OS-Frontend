import { tryRefreshAdminSession } from "@/lib/auth-api"
import {
  clearStoredAdminSession,
  emitAdminSessionExpired,
  loadStoredAccessToken,
  updateStoredAccessToken,
} from "@/lib/auth-storage"

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all"
export type AnalyticsGranularity = "day" | "week"

export interface AnalyticsQueryParams {
  period?: AnalyticsPeriod
  granularity?: AnalyticsGranularity
}

export interface AnalyticsSummaryDto {
  totalKanji: number
  masteredKanji: number
  totalVocabulary: number
  masteredVocabulary: number
  totalGrammar: number
  studiedGrammar: number
  totalReviews: number
  accuracyRate: number | null
  totalImmersionMinutes: number
  currentStreakDays: number
  longestStreakDays: number
}

export interface StudySeriesPointDto {
  date: string
  kanjiAdded: number
  vocabularyAdded: number
  grammarStudied: number
  kanjiReviewed: number
  vocabularyReviewed: number
  immersionMinutes: number
}

export interface ImmersionBreakdownPointDto {
  type: string
  totalMinutes: number
}

export interface AnalyticsOverviewResponseDto {
  summary: AnalyticsSummaryDto
  studyTimeSeries: StudySeriesPointDto[]
  immersionBreakdown: ImmersionBreakdownPointDto[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue
    }
    searchParams.set(key, String(value))
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  includeAuthToken = false,
): Promise<T> {
  let shouldExpireSession = false

  const createHeaders = (token?: string | null): Headers => {
    const headers = new Headers(options.headers)
    headers.set("Accept", "application/json")

    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json")
    }

    if (includeAuthToken && token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    return headers
  }

  const accessToken = includeAuthToken ? loadStoredAccessToken() : null
  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: createHeaders(accessToken),
    cache: "no-store",
  })

  if (response.status === 401 && includeAuthToken) {
    const refreshedToken = await tryRefreshAdminSession()

    if (refreshedToken) {
      updateStoredAccessToken(refreshedToken)
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: createHeaders(refreshedToken),
        cache: "no-store",
      })
    } else {
      shouldExpireSession = true
    }
  }

  if (response.status === 401 && includeAuthToken) {
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

  return (await response.json()) as T
}

export function buildAnalyticsQuery(params: AnalyticsQueryParams): string {
  return buildQueryString({
    period: params.period,
    granularity: params.granularity,
  })
}

export function getAnalyticsOverview(
  params: AnalyticsQueryParams = {},
  options: RequestInit = {},
): Promise<AnalyticsOverviewResponseDto> {
  console.debug("[analytics-api] Fetching analytics overview:", {
    period: params.period,
    granularity: params.granularity,
  })

  return requestJson<AnalyticsOverviewResponseDto>(
    `/analytics/overview${buildAnalyticsQuery(params)}`,
    {
      ...options,
      method: "GET",
    },
    true,
  )
}
