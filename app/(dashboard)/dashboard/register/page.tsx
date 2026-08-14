"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserPlus, Loader2 } from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminAuth, getAdminAuthErrorMessage } from "@/contexts/admin-auth-context"
import { validateRegisterInput } from "@/lib/auth-validation"

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, isAuthenticated, isInitializing } = useAdminAuth()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, isInitializing, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateRegisterInput({
      email: email.trim(),
      password,
      name,
    })

    if (validationError) {
      setError(validationError)
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
      })
      router.replace("/dashboard")
    } catch (submitError) {
      setError(getAdminAuthErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardShell
      title="Criar conta"
      subtitle="Registre-se para acompanhar seu progresso no japonês"
      kanji="記"
    >
      <div className="max-w-xl mx-auto">
        <Card className="bg-card/60 border-border/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[var(--torii-red)]" />
              Registro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="register-name">Nome</Label>
                <Input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  required
                  minLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mín. 8 caracteres, maiúscula, minúscula e número"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Use no mínimo 8 caracteres, com 1 maiúscula, 1 minúscula e 1 número.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">Confirmar senha</Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita a senha"
                  required
                  minLength={8}
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
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar conta
                  </>
                )}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center">
              Já tem uma conta?{" "}
              <Link
                href="/dashboard/login"
                className="text-[var(--torii-red)] hover:underline font-medium"
              >
                Fazer login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
