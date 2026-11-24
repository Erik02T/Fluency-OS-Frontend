"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Search,
  Bell,
  User,
  ChevronDown,
  Moon,
  Menu,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useReviewQueueVersion, useUIStore } from "@/store"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { getReviewQueueCount } from "@/lib/review-api"
import { getSidebarNavigationFeatures } from "@/lib/navigation-features"

interface TopBarProps {
  title?: string
  subtitle?: string
  kanji?: string
}

export function TopBar({ title = "Dashboard", subtitle, kanji }: TopBarProps) {
  const router = useRouter()
  const { toggleCommandPalette } = useUIStore()
  const { user, isAuthenticated, isInitializing, isAdmin, signOut } = useAdminAuth()
  const navigation = getSidebarNavigationFeatures({ isAuthenticated, isAdmin })
  const userId = user?.id
  const queueVersion = useReviewQueueVersion()
  const [reviewCountResult, setReviewCountResult] = React.useState<{ userId: string; total: number } | null>(null)
  const reviewCount = reviewCountResult?.userId === userId ? reviewCountResult?.total ?? null : null

  React.useEffect(() => {
    if (isInitializing || !userId) return
    const owner = userId
    const controller = new AbortController()

    async function loadReviewCount() {
      try {
        const payload = await getReviewQueueCount({ signal: controller.signal })
        if (!controller.signal.aborted) {
          setReviewCountResult({ userId: owner, total: payload.total })
        }
      } catch {
        if (!controller.signal.aborted) {
          setReviewCountResult(null)
        }
      }
    }

    void loadReviewCount()

    return () => controller.abort()
  }, [isInitializing, userId, queueVersion])

  async function handleSignOut() {
    await signOut()
    window.location.href = "/dashboard/login"
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="h-full flex items-center justify-between gap-2 px-3 md:px-6">
        {/* Left - Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-w-0 items-center gap-2 md:gap-4"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Abrir navegação">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[70vh] w-56 overflow-y-auto">
              {navigation.map((item) => (
                <DropdownMenuItem key={item.id} asChild>
                  <Link href={item.href}>{item.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {kanji && (
            <div className="hidden w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--torii-red)]/10 to-transparent border border-[var(--torii-red)]/20 items-center justify-center shrink-0 sm:flex">
              <span aria-hidden="true" lang="ja" className="font-japanese text-xl text-[var(--torii-red)]">
                {kanji}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>
            )}
          </div>
        </motion.div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <Button
            variant="outline"
            onClick={toggleCommandPalette}
            aria-label="Buscar páginas e ações"
            aria-keyshortcuts="Control+K Meta+K"
            className="h-9 w-9 items-center gap-2 border-border bg-secondary/50 px-0 text-muted-foreground hover:bg-secondary md:w-auto md:px-3"
          >
            <Search className="h-4 w-4" />
            <span className="hidden text-sm md:inline">Buscar páginas</span>
            <kbd aria-hidden="true" className="pointer-events-none hidden h-5 select-none items-center rounded border bg-background px-1.5 font-mono text-[10px] xl:inline-flex">Ctrl+K</kbd>
          </Button>

          {/* Review Button */}
          <Button
            variant="default"
            onClick={() => router.push("/dashboard/review")}
            aria-label={reviewCount === null ? "Revisar" : `Revisar, ${reviewCount} ${reviewCount === 1 ? "card pendente" : "cards pendentes"}`}
            className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white gap-2 h-9"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Revisar</span>
            {reviewCount !== null && (
              <Badge
                variant="secondary"
                className="bg-white/20 text-white text-[10px] px-1.5"
              >
                {reviewCount}
              </Badge>
            )}
          </Button>

          <span className="hidden sm:inline-flex" title="Notificações indisponíveis">
            <Button variant="ghost" size="icon" disabled aria-label="Notificações indisponíveis" className="text-muted-foreground">
              <Bell aria-hidden="true" className="h-5 w-5" />
            </Button>
          </span>

          <span className="hidden sm:inline-flex" title="Alternância de tema indisponível">
            <Button variant="ghost" size="icon" disabled aria-label="Alternância de tema indisponível" className="text-muted-foreground">
              <Moon aria-hidden="true" className="h-5 w-5" />
            </Button>
          </span>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Conta"
                className="flex items-center gap-2 px-2 h-9"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-[var(--torii-red)]/10 text-[var(--torii-red)] text-xs font-japanese">
                    学
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">
                    {isAuthenticated ? user?.displayName || user?.username || "Admin" : "Convidado"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {isAuthenticated ? user?.role || "ADMIN" : "Sem sessão"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {isAuthenticated ? user?.displayName || user?.username || "Administrador" : "Convidado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAuthenticated ? user?.email || "" : "Sem autenticação"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User aria-hidden="true" className="mr-2 h-4 w-4" />
                <span>Perfil indisponível</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span aria-hidden="true" lang="ja" className="font-japanese mr-2">設</span>
                <span>Configurações indisponíveis</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isAuthenticated ? (
                <DropdownMenuItem className="text-destructive" onSelect={handleSignOut}>Sair</DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild><Link href="/dashboard/login">Entrar</Link></DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
