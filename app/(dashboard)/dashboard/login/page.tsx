"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogIn, Loader2, UserRound } from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminAuth, getAdminAuthErrorMessage } from "@/contexts/admin-auth-context"
import { validateLoginInput } from "@/lib/auth-validation"

function resolveNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard"
  }

  return nextPath
}

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isAuthenticated, isInitializing } = useAdminAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [nextPath, setNextPath] = React.useState("/dashboard")

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setNextPath(resolveNextPath(params.get("next")))
  }, [])

  React.useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace(nextPath)
    }
  }, [isAuthenticated, isInitializing, nextPath, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateLoginInput({
      email: email.trim(),
      password,
    })

    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await signIn({ email: email.trim(), password })
      router.replace(nextPath)
    } catch (submitError) {
      setError(getAdminAuthErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardShell
      title="Entrar"
      subtitle="Acesse sua conta para continuar seus estudos"
      kanji="入"
    >
      <div className="max-w-xl mx-auto">
        <Card className="bg-card/60 border-border/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-[var(--torii-red)]" />
              Login
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || isInitializing}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center">
              Ainda não tem conta?{" "}
              <Link
                href="/dashboard/register"
                className="text-[var(--torii-red)] hover:underline font-medium"
              >
                Criar conta
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
