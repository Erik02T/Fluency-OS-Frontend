import { tryRefreshAdminSession } from "@/lib/auth-api"
import {
  clearStoredAdminSession,
  emitAdminSessionExpired,
  loadStoredAccessToken,
  updateStoredAccessToken,
} from "@/lib/auth-storage"

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1"
export type ReadingType = "ONYOMI" | "KUNYOMI" | "NANORI"

export interface KanjiUserProgressDto {
  srsLevel: number
  isMastered: boolean
  isFavorited: boolean
  isSuspended: boolean
}

export interface KanjiListItemDto {
  id: string
  character: string
  meanings: string[]
  onyomi: string[]
  kunyomi: string[]
  jlpt: JLPTLevel
  strokes: number
  frequency: number
  grade: number
  userProgress?: KanjiUserProgressDto
}

export interface PaginatedKanjiResponseDto {
  data: KanjiListItemDto[]
  pagination: {
    page: number
    perPage: number
    total: number
    pages: number
  }
}

export interface KanjiDetailMeaningDto {
  meaning: string
  language: string
  isPrimary: boolean
}

export interface KanjiDetailReadingDto {
  reading: string
  romanization: string
  isCommon: boolean
}

export interface KanjiDetailExampleDto {
  word: string
  reading: string
  meaning: string
  jlpt: JLPTLevel
  audioUrl?: string
}

export interface KanjiDetailRadicalDto {
  character: string
  name: string
  meaning: string
  isPrimary: boolean
}

export interface KanjiDetailResponseDto {
  id: string
  character: string
  unicodeCodepoint: string
  jlpt: JLPTLevel
  strokes: number
  frequency: number
  grade: number
  meanings: KanjiDetailMeaningDto[]
  readings: {
    onyomi: KanjiDetailReadingDto[]
    kunyomi: KanjiDetailReadingDto[]
    nanori?: Array<{
      reading: string
      romanization: string
    }>
  }
  examples: KanjiDetailExampleDto[]
  radicals: KanjiDetailRadicalDto[]
  userProgress?: {
    srsLevel: number
    isMastered: boolean
    isFavorited: boolean
    isSuspended: boolean
    easeFactor: number
    intervalDays: number
    nextReviewAt: Date
    lastReviewedAt?: Date
    totalReviews: number
    correctReviews: number
    streak: number
  }
}

export interface KanjiListQueryParams {
  page?: number
  perPage?: number
  jlpt?: JLPTLevel
  grade?: number
  search?: string
  favorites?: boolean
  mastered?: boolean
  suspended?: boolean
  sort?: "frequency" | "jlpt" | "grade" | "strokes" | "srsLevel" | "mastered"
  order?: "asc" | "desc"
}

export interface KanjiProgressResponseDto {
  kanjiId: string
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

export interface UpdateKanjiProgressDto {
  action: "study" | "review"
}

export interface AdminKanjiMeaningDto {
  meaning: string
  language?: string
  isPrimary?: boolean
}

export interface AdminKanjiReadingDto {
  reading: string
  type: ReadingType
  romanji?: string
  isPrimary?: boolean
}

export interface AdminKanjiExampleDto {
  word: string
  reading: string
  meaning: string
  jlptLevel?: JLPTLevel
}

export interface AdminKanjiRadicalDto {
  character: string
  name: string
  meaning: string
  strokeCount: number
  position?: number
  isPrimary?: boolean
}

export interface CreateKanjiDto {
  character: string
  unicodeCodepoint?: string
  jlptLevel: JLPTLevel
  grade?: number
  strokeCount?: number
  frequency?: number
  notes?: string
  romanization?: string
  meanings: AdminKanjiMeaningDto[]
  readings: AdminKanjiReadingDto[]
  examples?: AdminKanjiExampleDto[]
  radicals?: AdminKanjiRadicalDto[]
}

export type UpdateKanjiDto = Partial<CreateKanjiDto>

export interface KanjiAdminFormState {
  character: string
  unicodeCodepoint: string
  jlptLevel: JLPTLevel
  grade: string
  strokeCount: string
  frequency: string
  notes: string
  romanization: string
  meaningsJson: string
  readingsJson: string
  examplesJson: string
  radicalsJson: string
}

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

export function buildKanjiListQuery(params: KanjiListQueryParams): string {
  return buildQueryString({
    page: params.page,
    perPage: params.perPage,
    jlpt: params.jlpt,
    grade: params.grade,
    search: params.search,
    favorites: params.favorites,
    mastered: params.mastered,
    suspended: params.suspended,
    sort: params.sort,
    order: params.order,
  })
}

export function getKanjiList(
  params: KanjiListQueryParams = {},
  options: RequestInit = {},
): Promise<PaginatedKanjiResponseDto> {
  return requestJson<PaginatedKanjiResponseDto>(
    `/kanji${buildKanjiListQuery(params)}`,
    {
      ...options,
      method: "GET",
    },
    true,
  )
}

export function getKanjiDetail(
  id: string,
  options: RequestInit = {},
): Promise<KanjiDetailResponseDto> {
  return requestJson<KanjiDetailResponseDto>(
    `/kanji/${id}`,
    {
      ...options,
      method: "GET",
    },
    true,
  )
}

export function updateKanjiProgress(
  id: string,
  payload: UpdateKanjiProgressDto,
  options: RequestInit = {},
): Promise<KanjiProgressResponseDto> {
  return requestJson<KanjiProgressResponseDto>(
    `/kanji/${id}/progress`,
    {
      ...options,
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  )
}

export function studyKanji(
  id: string,
  options: RequestInit = {},
): Promise<KanjiProgressResponseDto> {
  return updateKanjiProgress(id, { action: "study" }, options)
}

export function sendKanjiToReview(
  id: string,
  options: RequestInit = {},
): Promise<KanjiProgressResponseDto> {
  return updateKanjiProgress(id, { action: "review" }, options)
}

export function createKanji(
  payload: CreateKanjiDto,
  options: RequestInit = {},
): Promise<KanjiDetailResponseDto> {
  return requestJson<KanjiDetailResponseDto>(
    `/admin/kanjis`,
    {
      ...options,
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  )
}

export function updateKanji(
  id: string,
  payload: UpdateKanjiDto,
  options: RequestInit = {},
): Promise<KanjiDetailResponseDto> {
  return requestJson<KanjiDetailResponseDto>(
    `/admin/kanjis/${id}`,
    {
      ...options,
      method: "PUT",
      body: JSON.stringify(payload),
    },
    true,
  )
}

export function deleteKanji(id: string, options: RequestInit = {}): Promise<void> {
  return requestNoContent(`/admin/kanjis/${id}`, {
    ...options,
    method: "DELETE",
  })
}

export function saveAccessToken(token: string): void {
  updateStoredAccessToken(token)
}

export function loadAccessToken(): string {
  return loadStoredAccessToken() || ""
}
