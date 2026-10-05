import {
  clearStoredAdminSession,
  loadStoredAccessToken,
  onAdminSessionExpired,
  updateStoredAccessToken,
} from "@/lib/auth-storage"
import { tryRefreshAdminSession } from "@/lib/auth-api"
import { getVocabularyList } from "@/lib/vocabulary-api"

vi.mock("@/lib/auth-api", () => ({
  tryRefreshAdminSession: vi.fn(),
}))

describe("vocabulary-api auth retry", () => {
  beforeEach(() => {
    clearStoredAdminSession()
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
    vi.mocked(tryRefreshAdminSession).mockReset()
  })

  it("retries vocabulary request with refreshed token", async () => {
    updateStoredAccessToken("old-token")
    vi.mocked(tryRefreshAdminSession).mockResolvedValue("new-token")

    const fetchMock = vi.spyOn(globalThis, "fetch")
    fetchMock
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [],
            pagination: { page: 1, perPage: 20, total: 0, pages: 0 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )

    await getVocabularyList()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const firstHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers
    const secondHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers
    expect(firstHeaders.get("Authorization")).toBe("Bearer old-token")
    expect(secondHeaders.get("Authorization")).toBe("Bearer new-token")
    expect(loadStoredAccessToken()).toBe("new-token")
  })

  it("clears token and emits expiration when refresh fails", async () => {
    updateStoredAccessToken("old-token")
    vi.mocked(tryRefreshAdminSession).mockResolvedValue(null)

    const expiredListener = vi.fn()
    const dispose = onAdminSessionExpired(expiredListener)

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("unauthorized", { status: 401 }),
    )

    await expect(getVocabularyList()).rejects.toThrow("unauthorized")

    expect(loadStoredAccessToken()).toBeNull()
    expect(expiredListener).toHaveBeenCalledTimes(1)

    dispose()
  })
})
