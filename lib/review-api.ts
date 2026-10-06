import { tryRefreshAdminSession } from "@/lib/auth-api"
import {
  clearStoredAdminSession,
  emitAdminSessionExpired,
  loadStoredAccessToken,
  updateStoredAccessToken,
} from "@/lib/auth-storage"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// ─── Tipos de resposta da API de Review ───────────────────────────────────────

export type ReviewSessionStatus = "in_progress" | "completed" | "abandoned"
export type ReviewItemType = "kanji" | "vocabulary" | "sentence"

export interface ReviewQueueKanjiItemDto {
  id: string
  character: string
  meanings: string[]
  readings: {
    onyomi: string[]
    kunyomi: string[]
  }
  jlpt: string
  strokes: number
  grade?: number
  frequency?: number
}

export interface ReviewQueueVocabularyItemDto {
  id: string
  word: string
  reading: string
  meanings: string[]
  jlpt?: string | null
  partOfSpeech?: string | null
}

export interface ReviewQueueItemDto {
  progress_id: string
  item_type: ReviewItemType
  item: ReviewQueueKanjiItemDto | ReviewQueueVocabularyItemDto | Record<string, unknown>
  srs_level: number
  last_reviewed_at: string | null
  next_review_at: string
  review_count: number
}

export interface ReviewQueueResponseDto {
  total_due: number
  items: ReviewQueueItemDto[]
  by_type: {
    kanji: number
    vocabulary: number
    grammar: number
  }
}

export interface ReviewQueueCountResponseDto {
  kanji: number
  vocabulary: number
  total: number
}

export interface CreateReviewSessionDto {
  session_type?: string
  sessionType?: string
  limit?: number
}

export interface ReviewAnswerItemDto {
  id: string
  item_type: ReviewItemType
  item_id: string
  quality: number
  quality_name: string
  response_time_ms?: number | null
  srs_level_before: number
  srs_level_after: number
  interval_before: number
  interval_after: number
  answered_at: string
}

export interface ReviewSessionResponseDto {
  id: string
  user_id: string
  session_type: ReviewItemType
  status: ReviewSessionStatus
  total_items: number
  reviewed_items: number
  correct_items: number
  incorrect_items: number
  accuracy_rate: number | null
  duration_seconds: number | null
  started_at: string
  completed_at: string | null
  abandoned_at?: string | null
  answers?: ReviewAnswerItemDto[]
}

export interface SubmitReviewAnswerDto {
  item_id?: string
  itemId?: string
  item_type?: string
  itemType?: string
  answer_quality?: number
  answerQuality?: number
  response_time_ms?: number
  responseTimeMs?: number
}

export interface SessionProgressDto {
  reviewed: number
  total: number
  correct: number
  incorrect: number
}

export interface ReviewAnswerResponseDto {
  previous_srs_level: number
  new_srs_level: number
  previous_interval: number
  new_interval: number
  next_review_at: string
  is_mastered: boolean
  session_progress: SessionProgressDto
}

export interface ReviewHistoryQueryDto {
  page?: number
  perPage?: number
  status?: string
}

export interface PaginatedReviewSessionResponseDto {
  data: ReviewSessionResponseDto[]
  pagination: {
    page: number
    perPage: number
    total: number
    pages: number
  }
}

export interface QualityBreakdownDto {
  blackout: number
  wrong: number
  correct_hard: number
  correct_easy: number
}

export interface ReviewSessionStatsResponseDto {
  session_id: string
  status: ReviewSessionStatus
  session_type: ReviewItemType
  total_items: number
  reviewed_items: number
  correct_items: number
  incorrect_items: number
  accuracy_rate: number
  duration_seconds: number
  average_response_time_ms?: number | null
  mastered_count: number
  quality_breakdown: QualityBreakdownDto
  started_at: string
  completed_at: string | null
}

// ─── Helpers de requisição (mesmo padrão de kanji-api.ts) ────────────────────

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

// ─── Endpoints de Review ──────────────────────────────────────────────────────

/**
 * GET /review/queue — Fila de itens vencidos para revisão
 */
export function getReviewQueue(
  options: RequestInit = {},
): Promise<ReviewQueueResponseDto> {
  return requestJson<ReviewQueueResponseDto>(
    "/review/queue",
    {
      ...options,
      method: "GET",
    },
    true,
  )
}

/**
 * GET /review/queue/count — Contagem de itens pendentes de revisão
 */
export function getReviewQueueCount(
  options: RequestInit = {},
): Promise<ReviewQueueCountResponseDto> {
  return requestJson<ReviewQueueCountResponseDto>(
    "/review/queue/count",
    {
      ...options,
      method: "GET",
    },
    true,
  )
}

/**
 * POST /review/sessions — Iniciar nova sessão de revisão
 */
export function createReviewSession(
  payload: CreateReviewSessionDto = {},
  options: RequestInit = {},
): Promise<ReviewSessionResponseDto> {
  return requestJson<ReviewSessionResponseDto>(
    "/review/sessions",
    {
      ...options,
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  )
}

/**
 * GET /review/sessions/:id — Obter estado de uma sessão de revisão
 */
export function getReviewSession(
  sessionId: string,
  options: RequestInit = {},
): Promise<ReviewSessionResponseDto> {
  return requestJson<ReviewSessionResponseDto>(
    `/review/sessions/${sessionId}`,
    {
      ...options,
      method: "GET",
    },
    true,
  )
}

/**
 * POST /review/sessions/:id/answer — Registrar resposta SRS de um item
 */
export function submitReviewAnswer(
  sessionId: string,
  payload: SubmitReviewAnswerDto,
  options: RequestInit = {},
): Promise<ReviewAnswerResponseDto> {
  return requestJson<ReviewAnswerResponseDto>(
    `/review/sessions/${sessionId}/answer`,
    {
      ...options,
      method: "POST",
      body: JSON.stringify(payload),
    },
    true,
  )
}

/**
 * POST /review/sessions/:id/end — Encerrar sessão de revisão
 */
export function endReviewSession(
  sessionId: string,
  options: RequestInit = {},
): Promise<ReviewSessionResponseDto> {
  return requestJson<ReviewSessionResponseDto>(
    `/review/sessions/${sessionId}/end`,
    {
      ...options,
      method: "POST",
    },
    true,
  )
}

/**
 * POST /review/sessions/:id/abandon — Abandonar sessão preservando progresso
 */
export function abandonReviewSession(
  sessionId: string,
  options: RequestInit = {},
): Promise<ReviewSessionResponseDto> {
  return requestJson<ReviewSessionResponseDto>(
    `/review/sessions/${sessionId}/abandon`,
    {
      ...options,
      method: "POST",
    },
    true,
  )
}

/**
 * GET /review/sessions/history — Histórico de sessões do usuário
 */
export function getReviewHistory(
  params: ReviewHistoryQueryDto = {},
  options: RequestInit = {},
): Promise<PaginatedReviewSessionResponseDto> {
  return requestJson<PaginatedReviewSessionResponseDto>(
    `/review/sessions/history${buildQueryString({
      page: params.page,
      perPage: params.perPage,
      status: params.status,
    })}`,
    {
      ...options,
      method: "GET",
    },
    true,
  )
}

/**
 * GET /review/sessions/:id/stats — Estatísticas detalhadas de uma sessão
 */
export function getReviewSessionStats(
  sessionId: string,
  options: RequestInit = {},
): Promise<ReviewSessionStatsResponseDto> {
  return requestJson<ReviewSessionStatsResponseDto>(
    `/review/sessions/${sessionId}/stats`,
    {
      ...options,
      method: "GET",
    },
    true,
  )
}