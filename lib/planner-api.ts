import { tryRefreshAdminSession } from "@/lib/auth-api"
import {
  clearStoredAdminSession,
  emitAdminSessionExpired,
  loadStoredAccessToken,
  updateStoredAccessToken,
} from "@/lib/auth-storage"

export type PlannerTaskDomain =
  | "kanji"
  | "vocabulary"
  | "grammar"
  | "immersion"
  | "general"

export type PlannerTaskPriority = "high" | "medium" | "low"

export interface PlannerTaskDto {
  id: string
  domain: PlannerTaskDomain
  task: string
  description: string | null
  priority: PlannerTaskPriority
  estimatedMinutes: number
  kanjiGlyph: string
  dueAt: string
  action:
    | { type: "review_kanji"; count: number }
    | { type: "review_vocabulary"; count: number }
    | { type: "study_grammar"; count: number }
    | { type: "immersion"; targetMinutes: number; loggedMinutes: number }
    | { type: "daily_review"; targetCount: number; completedCount: number }
    | { type: "general"; note: string }
}

export interface PlannerHabitDto {
  id: string
  name: string
  kanji: string
  domain: PlannerTaskDomain
  streak: number
  completedThisWeek: boolean[]
  weeklyTarget: number
}

export interface PlannerWeekDayDto {
  date: number
  day: string
  isToday: boolean
}

export interface PlannerWeeklyGoalDto {
  name: string
  kanji: string
  current: number
  target: number
  unit: string
}

export interface PlannerSummaryDto {
  tasksCompletedToday: number
  tasksTotalToday: number
  studyMinutesToday: number
  currentStreakDays: number
  longestStreakDays: number
  todayDateLabel: string
}

export interface PlannerOverviewResponseDto {
  week: PlannerWeekDayDto[]
  habits: PlannerHabitDto[]
  todayTasks: PlannerTaskDto[]
  weeklyGoals: PlannerWeeklyGoalDto[]
  summary: PlannerSummaryDto
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

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

export function getPlannerOverview(
  options: RequestInit = {},
): Promise<PlannerOverviewResponseDto> {
  console.debug("[planner-api] Fetching planner overview")
  return requestJson<PlannerOverviewResponseDto>(
    "/planner/overview",
    {
      ...options,
      method: "GET",
    },
    true,
  )
}
