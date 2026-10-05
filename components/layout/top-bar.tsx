"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Search,
  Bell,
  User,
  ChevronDown,
  Moon,
  Zap,
  Command,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
import { useUIStore } from "@/store"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { getReviewQueueCount } from "@/lib/review-api"

interface TopBarProps {
  title?: string
  subtitle?: string
  kanji?: string
}

export function TopBar({ title = "Dashboard", subtitle, kanji }: TopBarProps) {
  const router = useRouter()
  const { toggleCommandPalette, sidebarOpen } = useUIStore()
  const { user, isAuthenticated, signOut } = useAdminAuth()
  const [reviewCount, setReviewCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function loadReviewCount() {
      try {
        const payload = await getReviewQueueCount()
        if (isMounted) {
          setReviewCount(payload.total)
        }
      } catch {
        if (isMounted) {
          setReviewCount(null)
        }
      }
    }

    void loadReviewCount()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSignOut() {
    await signOut()
    window.location.href = "/dashboard/login"
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left - Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          {kanji && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--torii-red)]/10 to-transparent border border-[var(--torii-red)]/20 flex items-center justify-center">
              <span className="font-japanese text-xl text-[var(--torii-red)]">
                {kanji}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </motion.div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <Button
            variant="outline"
            onClick={toggleCommandPalette}
            className="hidden md:flex items-center gap-2 bg-secondary/50 border-border hover:bg-secondary text-muted-foreground h-9 px-3"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Buscar</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>

          {/* Review Button */}
          <Button
            variant="default"
            onClick={() => router.push("/dashboard/review")}
            className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white gap-2 h-9"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Revisar</span>
            {reviewCount !== null && reviewCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-white/20 text-white text-[10px] px-1.5"
              >
                {reviewCount}
              </Badge>
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--torii-red)] rounded-full" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Moon className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
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
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="font-japanese mr-2">設</span>
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={handleSignOut}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
