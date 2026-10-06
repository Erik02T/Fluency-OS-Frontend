import {
  registerUser,
  loginUser,
} from "@/lib/auth-api"
import { clearStoredAdminSession, loadStoredAccessToken } from "@/lib/auth-storage"
import {
  validateLoginInput,
  validatePassword,
  validateRegisterInput,
} from "@/lib/auth-validation"

describe("auth-validation", () => {
  it("rejects weak passwords with backend-aligned rules", () => {
    expect(validatePassword("short")).toMatch(/8 caracteres/i)
    expect(validatePassword("alllowercase1")).toMatch(/maiúscula/i)
    expect(validatePassword("ALLUPPERCASE1")).toMatch(/minúscula/i)
    expect(validatePassword("NoNumberHere")).toMatch(/número/i)
    expect(validatePassword("SecurePass123")).toBeNull()
  })

  it("validates register and login payloads", () => {
    expect(
      validateRegisterInput({
        email: "invalid",
        password: "SecurePass123",
        name: "Ana",
      }),
    ).toMatch(/email/i)

    expect(
      validateRegisterInput({
        email: "ana@example.com",
        password: "SecurePass123",
        name: "A",
      }),
    ).toMatch(/nome/i)

    expect(
      validateLoginInput({
        email: "ana@example.com",
        password: "",
      }),
    ).toMatch(/senha/i)

    expect(
      validateRegisterInput({
        email: "ana@example.com",
        password: "SecurePass123",
        name: "Ana Silva",
      }),
    ).toBeNull()
  })
})

describe("auth-api register/login safety", () => {
  const storageKey = "fluency-admin-access-token"

  beforeEach(() => {
    clearStoredAdminSession()
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("registerUser calls /auth/register with credentials and strips refreshToken", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "access-reg",
          refreshToken: "should-not-leak-to-storage",
          user: {
            id: "u2",
            email: "student@example.com",
            role: "STUDENT",
            username: "student",
            displayName: "Student",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const result = await registerUser({
      email: "student@example.com",
      password: "SecurePass123",
      name: "Student",
    })

    expect(result.accessToken).toBe("access-reg")
    expect(result.user.role).toBe("STUDENT")
    expect(result).not.toHaveProperty("refreshToken")
    expect(loadStoredAccessToken()).toBeNull()
    expect(window.localStorage.getItem(storageKey)).toBeNull()
    expect(window.sessionStorage.getItem(storageKey)).toBeNull()

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/register"),
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      }),
    )
  })

  it("loginUser rejects responses that include passwordHash", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "access-bad",
          user: {
            id: "u3",
            email: "leak@example.com",
            role: "STUDENT",
            username: "leak",
            passwordHash: "hash",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    await expect(
      loginUser({ email: "leak@example.com", password: "SecurePass123" }),
    ).rejects.toThrow(/dados sensíveis/i)
  })
})
