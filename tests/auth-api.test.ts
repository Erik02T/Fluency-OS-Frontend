import { clearStoredAdminSession, loadStoredAccessToken } from "@/lib/auth-storage"
import { loginAdmin, tryRefreshAdminSession } from "@/lib/auth-api"

describe("auth-api cookie session flow", () => {
  const key = "fluency-admin-access-token"

  beforeEach(() => {
    clearStoredAdminSession()
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("login keeps token out of localStorage/sessionStorage", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "access-1",
          refreshToken: "refresh-1",
          user: {
            id: "u1",
            email: "admin@example.com",
            role: "ADMIN",
            username: "admin",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const result = await loginAdmin({ email: "admin@example.com", password: "pw" })

    expect(result.accessToken).toBe("access-1")
    expect(loadStoredAccessToken()).toBeNull()
    expect(window.localStorage.getItem(key)).toBeNull()
    expect(window.sessionStorage.getItem(key)).toBeNull()

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      }),
    )
  })

  it("refresh failure returns null without persisting token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("expired", { status: 401 }))

    const refreshed = await tryRefreshAdminSession()

    expect(refreshed).toBeNull()
    expect(loadStoredAccessToken()).toBeNull()
    expect(window.localStorage.getItem(key)).toBeNull()
    expect(window.sessionStorage.getItem(key)).toBeNull()
  })
})
