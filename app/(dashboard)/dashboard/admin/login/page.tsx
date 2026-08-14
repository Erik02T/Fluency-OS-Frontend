"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, ArrowLeft, Loader2, LockKeyhole } from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminAuth, getAdminAuthErrorMessage } from "@/contexts/admin-auth-context"
import { resolveSafeAdminNextPath } from "@/lib/admin-routes"

export default function AdminLoginPage() {
  const router = useRouter()
  const { signIn, signOut, isAuthenticated, isAdmin, isInitializing } = useAdminAuth()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [nextPath, setNextPath] = React.useState("/dashboard/kanji/admin")

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setNextPath(resolveSafeAdminNextPath(params.get("next")))
  }, [])

  React.useEffect(() => {
    if (!isInitializing && isAuthenticated && isAdmin) {
      router.replace(nextPath)
    }
  }, [isAuthenticated, isAdmin, isInitializing, nextPath, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)
      const authenticatedUser = await signIn({ email: email.trim(), password })

      if (authenticatedUser.role !== "ADMIN") {
        await signOut()
        setError("Seu usuário não possui permissão administrativa.")
        return
      }

      router.replace(nextPath)
    } catch (submitError) {
      setError(getAdminAuthErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardShell
      title="Login Administrativo"
      subtitle="Autentique-se para acessar o CRUD de kanjis"
      kanji="鍵"
    >
      <div className="max-w-xl mx-auto">
        <Card className="bg-card/60 border-border/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--torii-red)]" />
              Acesso de administrador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@empresa.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  id="admin-password"
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
                    <LockKeyhole className="h-4 w-4 mr-2" />
                    Entrar no admin
                  </>
                )}
              </Button>
            </form>

            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/kanji">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Kanji
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
