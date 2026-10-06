import {
  getSidebarNavigationFeatures,
  NAVIGATION_FEATURES,
} from "@/lib/navigation-features"
import {
  isAdminAppRoute,
  parseSignedAuthRoleCookie,
  resolveSafeAdminNextPath,
} from "@/lib/admin-routes"

describe("admin navigation visibility", () => {
  it("hides admin items for guests and students", () => {
    const guestNav = getSidebarNavigationFeatures({
      isAuthenticated: false,
      isAdmin: false,
    })
    const studentNav = getSidebarNavigationFeatures({
      isAuthenticated: true,
      isAdmin: false,
    })

    expect(guestNav.some((item) => item.requiresAdmin)).toBe(false)
    expect(studentNav.some((item) => item.requiresAdmin)).toBe(false)
    expect(guestNav.some((item) => item.id === "login")).toBe(true)
    expect(studentNav.some((item) => item.id === "login")).toBe(false)
  })

  it("shows admin items only for admins", () => {
    const adminNav = getSidebarNavigationFeatures({
      isAuthenticated: true,
      isAdmin: true,
    })

    expect(adminNav.some((item) => item.id === "admin-kanji")).toBe(true)
    expect(adminNav.some((item) => item.id === "admin-vocabulary")).toBe(true)
    expect(adminNav.some((item) => item.id === "admin-grammar")).toBe(true)
    expect(adminNav.some((item) => item.id === "login")).toBe(false)
  })

  it("marks all admin CRUD features as requiresAdmin", () => {
    const adminFeatures = NAVIGATION_FEATURES.filter((feature) =>
      feature.id.startsWith("admin-"),
    )

    expect(adminFeatures.length).toBeGreaterThan(0)
    expect(adminFeatures.every((feature) => feature.requiresAdmin)).toBe(true)
  })
})

describe("admin route helpers", () => {
  const previousJwt = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret"
  })

  afterAll(() => {
    process.env.JWT_SECRET = previousJwt
  })

  it("detects admin app routes", () => {
    expect(isAdminAppRoute("/dashboard/kanji/admin")).toBe(true)
    expect(isAdminAppRoute("/dashboard/vocab/admin/edit")).toBe(true)
    expect(isAdminAppRoute("/dashboard/grammar/admin")).toBe(true)
    expect(isAdminAppRoute("/dashboard/kanji")).toBe(false)
    expect(isAdminAppRoute("/dashboard/login")).toBe(false)
  })

  it("sanitizes next path to admin routes only", () => {
    expect(resolveSafeAdminNextPath("/dashboard/vocab/admin")).toBe(
      "/dashboard/vocab/admin",
    )
    expect(resolveSafeAdminNextPath("//evil.com")).toBe("/dashboard/kanji/admin")
    expect(resolveSafeAdminNextPath("/dashboard")).toBe("/dashboard/kanji/admin")
    expect(resolveSafeAdminNextPath(null)).toBe("/dashboard/kanji/admin")
  })

  it("verifies signed auth role cookies and rejects tampering", async () => {
    const { createHmac } = await import("node:crypto")
    const signature = createHmac("sha256", "test-jwt-secret")
      .update("role:ADMIN")
      .digest("base64url")

    await expect(parseSignedAuthRoleCookie(`ADMIN.${signature}`)).resolves.toBe("ADMIN")
    await expect(parseSignedAuthRoleCookie(`STUDENT.${signature}`)).resolves.toBeNull()
    await expect(parseSignedAuthRoleCookie("ADMIN.invalid")).resolves.toBeNull()
  })
})
