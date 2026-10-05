"use client"

import * as React from "react"
import {
  getCurrentAdminUser,
  loginUser,
  logoutAdmin,
  registerUser,
  tryRefreshAdminSession,
  type AuthenticatedUser,
} from "@/lib/auth-api"
import {
  clearStoredAdminSession,
  onAdminSessionExpired,
  saveStoredAdminSession,
  updateStoredAccessToken,
} from "@/lib/auth-storage"

interface LoginInput {
  email: string
  password: string
}

interface RegisterInput {
  email: string
  password: string
  name: string
}

interface AdminAuthContextValue {
  user: AuthenticatedUser | null
  accessToken: string | null
  isInitializing: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  signIn: (input: LoginInput) => Promise<AuthenticatedUser>
  signUp: (input: RegisterInput) => Promise<AuthenticatedUser>
  signOut: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null)

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Falha inesperada de autenticação."
}

function applySession(
  auth: { accessToken: string; user: AuthenticatedUser },
  setUser: React.Dispatch<React.SetStateAction<AuthenticatedUser | null>>,
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>,
): AuthenticatedUser {
  setUser(auth.user)
  setAccessToken(auth.accessToken)
  saveStoredAdminSession({ accessToken: auth.accessToken })
  return auth.user
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthenticatedUser | null>(null)
  const [accessToken, setAccessToken] = React.useState<string | null>(null)
  const [isInitializing, setIsInitializing] = React.useState(true)

  const applyAnonymousSession = React.useCallback(() => {
    clearStoredAdminSession()
    setUser(null)
    setAccessToken(null)
  }, [])

  const hydrateSession = React.useCallback(async () => {
    const refreshedToken = await tryRefreshAdminSession()
    if (!refreshedToken) {
      applyAnonymousSession()
      return
    }

    try {
      const profile = await getCurrentAdminUser(refreshedToken)
      setUser(profile)
      setAccessToken(refreshedToken)
      updateStoredAccessToken(refreshedToken)
    } catch {
      applyAnonymousSession()
    }
  }, [applyAnonymousSession])

  React.useEffect(() => {
    return onAdminSessionExpired(() => {
      applyAnonymousSession()
    })
  }, [applyAnonymousSession])

  React.useEffect(() => {
    let isActive = true

    ;(async () => {
      await hydrateSession()
      if (isActive) {
        setIsInitializing(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [hydrateSession])

  const signIn = React.useCallback(async (input: LoginInput) => {
    const auth = await loginUser(input)
    return applySession(auth, setUser, setAccessToken)
  }, [])

  const signUp = React.useCallback(async (input: RegisterInput) => {
    const auth = await registerUser(input)
    return applySession(auth, setUser, setAccessToken)
  }, [])

  const refreshSession = React.useCallback(async (): Promise<boolean> => {
    const refreshedToken = await tryRefreshAdminSession()
    if (!refreshedToken) {
      applyAnonymousSession()
      return false
    }

    try {
      const profile = await getCurrentAdminUser(refreshedToken)
      setUser(profile)
      setAccessToken(refreshedToken)
      updateStoredAccessToken(refreshedToken)
      return true
    } catch {
      applyAnonymousSession()
      return false
    }
  }, [applyAnonymousSession])

  const signOut = React.useCallback(async () => {
    try {
      await logoutAdmin()
    } catch {
      // O estado local ainda precisa ser limpo mesmo se o backend falhar.
    } finally {
      applyAnonymousSession()
    }
  }, [applyAnonymousSession])

  const value = React.useMemo<AdminAuthContextValue>(
    () => ({
      user,
      accessToken,
      isInitializing,
      isAuthenticated: Boolean(user && accessToken),
      isAdmin: user?.role === "ADMIN",
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [user, accessToken, isInitializing, signIn, signUp, signOut, refreshSession],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = React.useContext(AdminAuthContext)
  if (!context) {
    throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider")
  }

  return context
}

export { getErrorMessage as getAdminAuthErrorMessage }
