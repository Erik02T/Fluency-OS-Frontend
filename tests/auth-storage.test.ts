import {
  clearStoredAdminSession,
  loadStoredAccessToken,
  saveStoredAdminSession,
  updateStoredAccessToken,
} from "@/lib/auth-storage"

describe("auth-storage (in-memory only)", () => {
  const key = "fluency-admin-access-token"

  beforeEach(() => {
    clearStoredAdminSession()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it("stores access token only in memory", () => {
    saveStoredAdminSession({ accessToken: "token-a" })

    expect(loadStoredAccessToken()).toBe("token-a")
    expect(window.localStorage.getItem(key)).toBeNull()
    expect(window.sessionStorage.getItem(key)).toBeNull()

    updateStoredAccessToken("token-b")

    expect(loadStoredAccessToken()).toBe("token-b")
    expect(window.localStorage.getItem(key)).toBeNull()
    expect(window.sessionStorage.getItem(key)).toBeNull()
  })

  it("clears legacy persisted token keys", () => {
    window.localStorage.setItem(key, "legacy-local")
    window.sessionStorage.setItem(key, "legacy-session")
    saveStoredAdminSession({ accessToken: "token-a" })

    clearStoredAdminSession()

    expect(loadStoredAccessToken()).toBeNull()
    expect(window.localStorage.getItem(key)).toBeNull()
    expect(window.sessionStorage.getItem(key)).toBeNull()
  })
})
