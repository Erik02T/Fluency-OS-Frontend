"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  BookOpen,
  Languages,
  FileText,
  Headphones,
  Calendar,
  BarChart3,
  Search,
  Command,
  ChevronLeft,
  Zap,
  Brain,
  Flame,
  Target,
  Shield,
  LogIn,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUIStore } from "@/store"
import {
  getSidebarNavigationFeatures,
  type NavigationFeature,
} from "@/lib/navigation-features"
import { useAdminAuth } from "@/contexts/admin-auth-context"

const FEATURE_ICON_MAP = {
  home: Home,
  kanji: Languages,
  admin: Shield,
  auth: LogIn,
  book: BookOpen,
  grammar: FileText,
  immersion: Headphones,
  planner: Calendar,
  analytics: BarChart3,
} as const

const FEATURE_STATUS_LABEL = {
  beta: "Beta",
  "coming-soon": "Em breve",
} as const

const quickActions = [
  { name: "Review", icon: Zap, kanji: "復", color: "text-[var(--torii-red)]" },
  { name: "AI Tutor", icon: Brain, kanji: "智", color: "text-[var(--gold)]" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, toggleCommandPalette } = useUIStore()
  const { isAuthenticated, isAdmin } = useAdminAuth()
  const navigation = React.useMemo(
    () => getSidebarNavigationFeatures({ isAuthenticated, isAdmin }),
    [isAuthenticated, isAdmin],
  )

  const isFeatureActive = React.useCallback(
    (feature: NavigationFeature) => {
      if (feature.href === "/dashboard") {
        return pathname === feature.href
      }

      return pathname === feature.href || pathname.startsWith(`${feature.href}/`)
    },
    [pathname],
  )

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 280 : 80 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--torii-red)] to-[var(--torii-red)]/80 flex items-center justify-center">
            <span className="text-xl font-japanese text-white">日</span>
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <span className="font-semibold text-sidebar-foreground text-sm">
                  Fluency OS
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  日本語
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="ml-auto text-muted-foreground hover:text-sidebar-foreground"
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <Button
          variant="outline"
          onClick={toggleCommandPalette}
          className={cn(
            "w-full justify-start gap-2 bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent text-muted-foreground",
            !sidebarOpen && "px-3"
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-left text-sm"
              >
                Buscar...
              </motion.span>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          )}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="px-3 mb-2">
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.name}
              variant="ghost"
              className={cn(
                "flex-1 h-auto py-3 flex-col gap-1 bg-sidebar-accent/30 hover:bg-sidebar-accent border border-sidebar-border/50",
                !sidebarOpen && "p-2"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center",
                  action.color
                )}
              >
                <span className="font-japanese text-lg">{action.kanji}</span>
              </div>
              {sidebarOpen && (
                <span className="text-xs text-muted-foreground">
                  {action.name}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {sidebarOpen && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2 block">
            Módulos
          </span>
        )}
        {navigation.map((item) => {
          const isActive = isFeatureActive(item)
          const IconComponent = FEATURE_ICON_MAP[item.icon]
          const statusLabel =
            item.status === "live" ? null : FEATURE_STATUS_LABEL[item.status]

          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--torii-red)] rounded-r-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isActive
                      ? "bg-[var(--torii-red)]/10 text-[var(--torii-red)]"
                      : "bg-sidebar-accent/50 group-hover:bg-sidebar-accent"
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.name}</span>
                        {statusLabel && (
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[9px] leading-none"
                          >
                            {statusLabel}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {item.description}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Stats Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/30",
            !sidebarOpen && "justify-center px-2"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Streak</span>
              <span className="text-sm font-semibold text-sidebar-foreground">
                7 dias
              </span>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <div className="mt-2 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                Meta diária
              </span>
            </div>
            <span className="text-[10px] font-medium text-[var(--gold)]">
              45/60 min
            </span>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
