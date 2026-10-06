import { tryRefreshAdminSession } from "@/lib/auth-api"
import {
  clearStoredAdminSession,
  emitAdminSessionExpired,
  loadStoredAccessToken,
  updateStoredAccessToken,
} from "@/lib/auth-storage"

export enum ImmersionApiType {
  ANIME = "ANIME",
  DRAMA = "DRAMA",
  PODCAST = "PODCAST",
  YOUTUBE = "YOUTUBE",
  MANGA = "MANGA",
  NOVEL = "NOVEL",
  VISUAL_NOVEL = "VISUAL_NOVEL",
  GAME = "GAME",
  NEWS = "NEWS",
  MUSIC = "MUSIC",
  MOVIE = "MOVIE",
  OTHER = "OTHER",
}

export const IMMERSION_TYPE_LABELS: Record<ImmersionApiType, string> = {
  [ImmersionApiType.ANIME]: "Anime",
  [ImmersionApiType.DRAMA]: "Drama",
  [ImmersionApiType.PODCAST]: "Podcast",
  [ImmersionApiType.YOUTUBE]: "YouTube",
  [ImmersionApiType.MANGA]: "Mangá",
  [ImmersionApiType.NOVEL]: "Novela Leve",
  [ImmersionApiType.VISUAL_NOVEL]: "Visual Novel",
  [ImmersionApiType.GAME]: "Jogo",
  [ImmersionApiType.NEWS]: "Notícias",
  [ImmersionApiType.MUSIC]: "Música",
  [ImmersionApiType.MOVIE]: "Filme",
  [ImmersionApiType.OTHER]: "Outro",
}

export interface ImmersionLogResponseDto {
  id: string
  userId: string
  type: ImmersionApiType
  title: string
  episode: string | null
  durationMinutes: number
  comprehension: number | null
  isActive: boolean
  notes: string | null
  loggedAt: string
  createdAt: string
}

export interface PaginatedImmersionLogResponseDto {
  data: ImmersionLogResponseDto[]
  pagination: {
    page: number
    perPage: number
    total: number
    pages: number
  }
}

export interface CreateImmersionLogPayload {
  type: ImmersionApiType
  title: string
  durationMinutes: number
  episode?: string
  comprehension?: number
  notes?: string
  isActive?: boolean
  loggedAt?: Date | string
}

export interface ImmersionLogQueryParams {
  page?: number
  perPage?: number
  type?: ImmersionApiType
  startDate?: Date | string
  endDate?: Date | string
  sort?: "loggedAt" | "durationMinutes" | "createdAt"
  order?: "asc" | "desc"
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function buildQueryString(
  params: Record<string, string | number | boolean | Date | undefined>,
): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue
    }

    if (value instanceof Date) {
      searchParams.set(key, value.toISOString())
    } else {
      searchParams.set(key, String(value))
    }
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

export function buildImmersionLogQuery(
  params: ImmersionLogQueryParams,
): string {
  return buildQueryString({
    page: params.page,
    perPage: params.perPage,
    type: params.type,
    startDate: params.startDate,
    endDate: params.endDate,
    sort: params.sort,
    order: params.order,
  })
}

export function createImmersionLog(
  payload: CreateImmersionLogPayload,
  options: RequestInit = {},
): Promise<ImmersionLogResponseDto> {
  const serializedPayload: CreateImmersionLogPayload = {
    ...payload,
  }

  if (payload.loggedAt instanceof Date) {
    serializedPayload.loggedAt = payload.loggedAt.toISOString()
  }

  console.debug("[immersion-api] Creating immersion log:", {
    type: payload.type,
    title: payload.title,
    durationMinutes: payload.durationMinutes,
  })

  return requestJson<ImmersionLogResponseDto>(
    "/immersion",
    {
      ...options,
      method: "POST",
      body: JSON.stringify(serializedPayload),
    },
    true,
  )
}

export function getImmersionLogs(
  params: ImmersionLogQueryParams = {},
  options: RequestInit = {},
): Promise<PaginatedImmersionLogResponseDto> {
  console.debug("[immersion-api] Fetching immersion logs:", {
    page: params.page,
    perPage: params.perPage,
    type: params.type,
  })

  return requestJson<PaginatedImmersionLogResponseDto>(
    `/immersion${buildImmersionLogQuery(params)}`,
    {
      ...options,
      method: "GET",
    },
    true,
  )
}
