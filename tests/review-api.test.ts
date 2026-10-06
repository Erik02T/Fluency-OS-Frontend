import {
  clearStoredAdminSession,
  loadStoredAccessToken,
  onAdminSessionExpired,
  updateStoredAccessToken,
} from "@/lib/auth-storage"
import {
  getReviewQueue,
  getReviewQueueCount,
  createReviewSession,
  getReviewSession,
  submitReviewAnswer,
  endReviewSession,
  getReviewHistory,
  getReviewSessionStats,
} from "@/lib/review-api"
import { tryRefreshAdminSession } from "@/lib/auth-api"

vi.mock("@/lib/auth-api", () => ({
  tryRefreshAdminSession: vi.fn(),
}))

describe("review-api auth retry", () => {
  beforeEach(() => {
    clearStoredAdminSession()
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
    vi.mocked(tryRefreshAdminSession).mockReset()
  })

  it("retries queue request with refreshed in-memory token", async () => {
    updateStoredAccessToken("old-token")
    vi.mocked(tryRefreshAdminSession).mockResolvedValue("new-token")

    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            total_due: 0,
            items: [],
            by_type: { kanji: 0, vocabulary: 0, grammar: 0 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )

    await getReviewQueue()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.any(Headers),
    })

    const firstHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers
    const secondHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers
    expect(firstHeaders.get("Authorization")).toBe("Bearer old-token")
    expect(secondHeaders.get("Authorization")).toBe("Bearer new-token")
    expect(loadStoredAccessToken()).toBe("new-token")
  })

  it("emits session-expired and clears token when refresh cookie is expired", async () => {
    updateStoredAccessToken("old-token")
    vi.mocked(tryRefreshAdminSession).mockResolvedValue(null)

    const expiredListener = vi.fn()
    const dispose = onAdminSessionExpired(expiredListener)

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("unauthorized", { status: 401 }),
    )

    await expect(getReviewQueueCount()).rejects.toThrow("unauthorized")

    expect(loadStoredAccessToken()).toBeNull()
    expect(expiredListener).toHaveBeenCalledTimes(1)

    dispose()
  })

  it("creates a review session via POST /review/sessions", async () => {
    updateStoredAccessToken("token-1")

    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "session_123",
          user_id: "user_123",
          session_type: "kanji",
          status: "in_progress",
          total_items: 5,
          reviewed_items: 0,
          correct_items: 0,
          incorrect_items: 0,
          accuracy_rate: null,
          duration_seconds: null,
          started_at: "2026-08-13T12:00:00.000Z",
          completed_at: null,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    )

    const session = await createReviewSession({ session_type: "kanji" })

    expect(session.id).toBe("session_123")
    expect(session.status).toBe("in_progress")
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/review/sessions"),
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("submits an answer via POST /review/sessions/:id/answer", async () => {
    updateStoredAccessToken("token-1")

    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          previous_srs_level: 2,
          new_srs_level: 3,
          previous_interval: 6,
          new_interval: 15,
          next_review_at: "2026-08-28T12:00:00.000Z",
          is_mastered: false,
          session_progress: {
            reviewed: 1,
            total: 5,
            correct: 1,
            incorrect: 0,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const result = await submitReviewAnswer("session_123", {
      item_id: "kanji_123",
      item_type: "kanji",
      answer_quality: 2,
      response_time_ms: 2500,
    })

    expect(result.new_srs_level).toBe(3)
    expect(result.session_progress.reviewed).toBe(1)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/review/sessions/session_123/answer"),
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("fetches session stats via GET /review/sessions/:id/stats", async () => {
    updateStoredAccessToken("token-1")

    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          session_id: "session_123",
          status: "completed",
          session_type: "kanji",
          total_items: 5,
          reviewed_items: 5,
          correct_items: 4,
          incorrect_items: 1,
          accuracy_rate: 80,
          duration_seconds: 120,
          average_response_time_ms: 2500,
          mastered_count: 1,
          quality_breakdown: {
            blackout: 0,
            wrong: 1,
            correct_hard: 2,
            correct_easy: 2,
          },
          started_at: "2026-08-13T12:00:00.000Z",
          completed_at: "2026-08-13T12:02:00.000Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const stats = await getReviewSessionStats("session_123")

    expect(stats.session_id).toBe("session_123")
    expect(stats.accuracy_rate).toBe(80)
    expect(stats.quality_breakdown.correct_hard).toBe(2)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/review/sessions/session_123/stats"),
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("fetches history via GET /review/sessions/history", async () => {
    updateStoredAccessToken("token-1")

    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [],
          pagination: { page: 1, perPage: 20, total: 0, pages: 0 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const history = await getReviewHistory({ page: 1, perPage: 20 })

    expect(history.data).toEqual([])
    expect(history.pagination.page).toBe(1)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/review/sessions/history?page=1&perPage=20"),
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("ends a session via POST /review/sessions/:id/end", async () => {
    updateStoredAccessToken("token-1")

    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "session_123",
          user_id: "user_123",
          session_type: "kanji",
          status: "completed",
          total_items: 5,
          reviewed_items: 5,
          correct_items: 4,
          incorrect_items: 1,
          accuracy_rate: 80,
          duration_seconds: 120,
          started_at: "2026-08-13T12:00:00.000Z",
          completed_at: "2026-08-13T12:02:00.000Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const session = await endReviewSession("session_123")

    expect(session.status).toBe("completed")
    expect(session.accuracy_rate).toBe(80)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/review/sessions/session_123/end"),
      expect.objectContaining({ method: "POST" }),
    )
  })

  it("fetches a session via GET /review/sessions/:id", async () => {
    updateStoredAccessToken("token-1")

    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "session_123",
          user_id: "user_123",
          session_type: "kanji",
          status: "in_progress",
          total_items: 5,
          reviewed_items: 2,
          correct_items: 2,
          incorrect_items: 0,
          accuracy_rate: 100,
          duration_seconds: null,
          started_at: "2026-08-13T12:00:00.000Z",
          completed_at: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const session = await getReviewSession("session_123")

    expect(session.id).toBe("session_123")
    expect(session.reviewed_items).toBe(2)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/review/sessions/session_123"),
      expect.objectContaining({ method: "GET" }),
    )
  })
})