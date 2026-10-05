import { tryRefreshAdminSession } from "@/lib/auth-api"
import {
  clearStoredAdminSession,
  emitAdminSessionExpired,
  loadStoredAccessToken,
  updateStoredAccessToken,
} from "@/lib/auth-storage"
import type { JLPTLevel } from "@/lib/kanji-api"

export type { JLPTLevel }

export interface VocabularyUserProgressDto {
  srsLevel: number
  isMastered: boolean
  isFavorited: boolean
  isSuspended: boolean
}

export interface VocabularyListItemDto {
  id: string
  word: string
  reading: string
  jlpt: JLPTLevel
  frequency: number | null
  partOfSpeech: string | null
  tags: string[]
  primaryMeaning: string
  userProgress?: VocabularyUserProgressDto
}

export interface PaginatedVocabularyResponseDto {
  data: VocabularyListItemDto[]
  pagination: {
    page: number
    perPage: number
    total: number
    pages: number
  }
}

export interface VocabularyDetailMeaningDto {
  meaning: string
  context: string | null
  isPrimary: boolean
}

export interface VocabularyDetailExampleDto {
  japanese: string
  reading: string | null
  translation: string
  source: string | null
}

export interface VocabularyDetailResponseDto {
  id: string
  word: string
  reading: string
  jlpt: JLPTLevel
  frequency: number | null
  partOfSpeech: string | null
  tags: string[]
  notes: string | null
  audioUrl: string | null
  meanings: VocabularyDetailMeaningDto[]
  examples: VocabularyDetailExampleDto[]
  userProgress?: {
    srsLevel: number
    isMastered: boolean
    isFavorited: boolean
    isSuspended: boolean
    easeFactor: number
    intervalDays: number
    nextReviewAt: string | Date
    lastReviewedAt?: string | Date
    totalReviews: number
    correctReviews: number
  }
}

export interface VocabularyProgressResponseDto {
  vocabularyId: string
  srsLevel: number
  isMastered: boolean
  isFavorited: boolean
  isSuspended: boolean
  easeFactor: number
  intervalDays: number
  nextReviewAt: string | Date
  lastReviewedAt?: string | Date
  totalReviews: number
  correctReviews: number
  addedAt: string | Date
  masteredAt?: string | Date
}

export interface VocabularyListQueryParams {
  page?: number
  perPage?: number
  jlpt?: JLPTLevel
  search?: string
  sort?: "frequency" | "jlpt" | "word" | "createdAt"
  order?: "asc" | "desc"
}

export interface UpdateVocabularyProgressDto {
  action: "study" | "review"
  correct?: boolean
}

export interface AdminVocabularyMeaningDto {
  meaning: string
  context?: string | null
  isPrimary?: boolean
}

export interface AdminVocabularyExampleDto {
  japanese: string
  reading?: string | null
  translation: string
  source?: string | null
}

export interface CreateVocabularyDto {
  word: string
  reading: string
  jlptLevel: JLPTLevel
  frequency?: number
  partOfSpeech?: string | null
  tags?: string[]
  notes?: string | null
  audioUrl?: string | null
  meanings: AdminVocabularyMeaningDto[]
  examples?: AdminVocabularyExampleDto[]
}

export type UpdateVocabularyDto = Partial<CreateVocabularyDto>

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
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

async function requestNoContent(path: string, options: RequestInit = {}): Promise<void> {
  let shouldExpireSession = false

  const createHeaders = (token?: string | null): Headers => {
    const headers = new Headers(options.headers)
    headers.set("Accept", "application/json")
    headers.set("Content-Type", "application/json")

    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    return headers
  }

  const accessToken = loadStoredAccessToken()
  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: createHeaders(accessToken),
    cache: "no-store",
  })

  if (response.status === 401) {
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
}

export function buildVocabularyListQuery(params: VocabularyListQueryParams): string {
  return buildQueryString({
    page: params.page,
    perPage: params.perPage,
    jlpt: params.jlpt,
    search: params.search,
    sort: params.sort,
    order: params.order,
  })
}

export function getVocabularyList(
  params: VocabularyListQueryParams = {},
  options: RequestInit = {},
): Promise<PaginatedVocabularyResponseDto> {
  return requestJson<PaginatedVocabularyResponseDto>(
    `/vocabulary${buildVocabularyListQuery(params)}`,
    {
      ...options,
      method: "GET",
    },
    true,
  )
}

export function getVocabularyDetail(
  id: string,
  options: RequestInit = {},
): Promise<VocabularyDetailResponseDto> {
  return requestJson<VocabularyDetailResponseDto>(
    `/vocabulary/${id}`,
    {
      ...options,
      method: "GET",
    },
    true,
  )
}

export function updateVocabularyProgress(
  id: string,
  payload: UpdateVocabularyProgressDto,
  options: RequestInit = {},
): Promise<VocabularyProgressResponseDto> {
  return requestJson<VocabularyProgressResponseDto>(
    `/vocabulary/${id}/progress`,
    {
      ...options,
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  )
}

export function createVocabulary(
  payload: CreateVocabularyDto,
  options: RequestInit = {},
): Promise<VocabularyDetailResponseDto> {
  return requestJson<VocabularyDetailResponseDto>(
    `/admin/vocabularies`,
    {
      ...options,
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  )
}

export function updateVocabulary(
  id: string,
  payload: UpdateVocabularyDto,
  options: RequestInit = {},
): Promise<VocabularyDetailResponseDto> {
  return requestJson<VocabularyDetailResponseDto>(
    `/admin/vocabularies/${id}`,
    {
      ...options,
      method: "PUT",
      body: JSON.stringify(payload),
    },
    true,
  )
}

export function deleteVocabulary(id: string, options: RequestInit = {}): Promise<void> {
  return requestNoContent(`/admin/vocabularies/${id}`, {
    ...options,
    method: "DELETE",
  })
}
