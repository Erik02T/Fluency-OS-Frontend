"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Languages,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardShell } from "@/components/layout"
import { getDashboardSummary, type DashboardSummaryDto } from "@/lib/dashboard-api"
import { getPlannerOverview, type PlannerOverviewResponseDto } from "@/lib/planner-api"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { cn } from "@/lib/utils"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function formatLastReview(lastReviewAt: string | null): string {
  if (!lastReviewAt) {
    return "Sem revisões recentes"
  }

  const date = new Date(lastReviewAt)
  return `Última revisão: ${date.toLocaleDateString("pt-BR")}`
}

const kanjiExamples = [
  { kanji: "電", reading: "でん", meaning: "eletricidade", level: "N4" },
  { kanji: "話", reading: "はなし", meaning: "fala, conversa", level: "N4" },
  { kanji: "食", reading: "た・べる", meaning: "comer", level: "N5" },
  { kanji: "飲", reading: "の・む", meaning: "beber", level: "N5" },
  { kanji: "見", reading: "み・る", meaning: "ver", level: "N5" },
  { kanji: "聞", reading: "き・く", meaning: "ouvir", level: "N4" },
]

export default function DashboardPage() {
  const { user, isInitializing } = useAdminAuth()
  if (!user || isInitializing) {
    return <DashboardShell title="Dashboard" kanji="学">
      <p role="status" className="text-sm text-muted-foreground">
        {isInitializing ? "Restaurando sua sessão..." : "Entre para consultar seu Dashboard."}
      </p>
    </DashboardShell>
  }
  return <DashboardContent key={user.id} />
}

function DashboardContent() {
  const [summary, setSummary] = React.useState<DashboardSummaryDto | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(true)
  const [summaryError, setSummaryError] = React.useState<string | null>(null)
  const [today, setToday] = React.useState<PlannerOverviewResponseDto | null>(null)
  const [tasksError, setTasksError] = React.useState<string | null>(null)
  const dailyTasks = today?.todayTasks ?? []

  React.useEffect(() => {
    let isMounted = true

    async function loadSummary() {
      try {
        setIsLoadingSummary(true)
        setSummaryError(null)
        const payload = await getDashboardSummary()

        if (isMounted) {
          setSummary(payload)
        }
      } catch {
        if (isMounted) {
          setSummaryError("Não foi possível carregar as métricas agora.")
        }
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false)
        }
      }
    }

    void loadSummary()

    return () => {
      isMounted = false
    }
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()
    let loading = false
    async function loadTasks() {
      if (loading || controller.signal.aborted) return
      loading = true
      try {
        const data = await getPlannerOverview(undefined, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setToday(data)
          setTasksError(null)
        }
      } catch {
        if (!controller.signal.aborted) {
          setToday(null)
          setTasksError("Não foi possível carregar as tarefas.")
        }
      } finally {
        loading = false
      }
    }
    void loadTasks()
    window.addEventListener("focus", loadTasks)
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadTasks()
    }, 60_000)
    return () => {
      controller.abort()
      window.removeEventListener("focus", loadTasks)
      window.clearInterval(timer)
    }
  }, [])

  const statsCards = React.useMemo(
    () => [
      {
        title: "Sequência atual",
        value: summary ? String(summary.currentStreak) : "—",
        suffix: "dias",
        change: summary ? `Recorde: ${summary.longestStreak} dias` : null,
        color: "from-orange-500/20 to-red-500/20",
        iconColor: "text-orange-500",
        kanji: "継",
        href: "/dashboard/analytics",
      },
      {
        title: "Kanji Aprendidos",
        value: summary ? String(summary.kanjiStudied) : "—",
        suffix: "itens",
        change: summary ? `${summary.kanjiMastered} dominados` : null,
        color: "from-[var(--gold)]/20 to-amber-500/20",
        iconColor: "text-[var(--gold)]",
        kanji: "字",
        href: "/dashboard/kanji",
      },
      {
        title: "Revisões pendentes",
        value: summary ? String(summary.dueReviews) : "—",
        suffix: "cards",
        change: summary ? `${summary.totalReviews} revisões totais` : null,
        color: "from-[var(--torii-red)]/20 to-rose-500/20",
        iconColor: "text-[var(--torii-red)]",
        kanji: "復",
        href: "/dashboard/review",
      },
      {
        title: "Precisão Geral",
        value: summary?.accuracyRate == null ? "—" : String(summary.accuracyRate),
        suffix: "%",
        change: summary ? formatLastReview(summary.lastReviewAt) : null,
        color: "from-[var(--neon-blue)]/20 to-blue-500/20",
        iconColor: "text-[var(--neon-blue)]",
        kanji: "時",
        href: "/dashboard/review",
      },
    ],
    [summary],
  )

  const quickActions = React.useMemo(
    () => [
      {
        title: "Abrir fila de revisão",
        description: summary ? `${summary.dueReviews} cards pendentes` : "Consultar fila",
        kanji: "復",
        color: "bg-[var(--torii-red)]",
        href: "/dashboard/review",
      },
      {
        title: "Estudar Kanji",
        description: summary ? `${summary.favoriteKanjis} favoritos` : "Abrir catálogo",
        kanji: "字",
        color: "bg-[var(--gold)]",
        href: "/dashboard/kanji",
      },
      {
        title: "AI Tutor",
        description: "Demonstração",
        kanji: "智",
        color: "bg-[var(--neon-blue)]",
        href: "/dashboard/ai",
      },
      {
        title: "Imersão",
        description: "Registrar sessão",
        kanji: "聴",
        color: "bg-[var(--teal)]",
        href: "/dashboard/immersion",
      },
    ],
    [summary],
  )

  return (
    <DashboardShell
      title="Dashboard"
      subtitle="Bem-vindo de volta! Continue sua jornada."
      kanji="家"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {summaryError && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent role="alert" className="py-3 text-sm text-red-400">{summaryError}</CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div aria-busy={isLoadingSummary} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={stat.href} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-border transition-colors h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                            stat.color
                          )}
                        >
                          <span aria-hidden="true" lang="ja" className={cn("font-japanese text-lg", stat.iconColor)}>
                            {stat.kanji}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {stat.title}
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-foreground">
                              {stat.value}
                            </span>
                            {stat.value !== "—" && <span className="text-sm text-muted-foreground">{stat.suffix}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    {stat.change && (
                      <p className="mt-3 text-xs text-muted-foreground">{stat.change}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Quick actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[var(--gold)]" />
                      Ações Rápidas
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {quickActions.map((action) => (
                      <Link
                        key={action.title}
                        href={action.href}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            action.color
                          )}
                        >
                          <span aria-hidden="true" lang="ja" className="font-japanese text-xl text-white">
                            {action.kanji}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">
                            {action.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>

          {/* Daily tasks and catalog examples */}
          <div className="space-y-6">
            {/* Daily Tasks */}
            <motion.div variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="font-japanese text-[var(--gold)]">日</span>
                      Tarefas Diárias
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {today && `${today.summary.tasksCompletedToday}/${today.summary.tasksTotalToday} completas`}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasksError ? (
                    <p role="alert" className="text-sm text-muted-foreground">{tasksError}</p>
                  ) : !today ? (
                    <p role="status" className="text-sm text-muted-foreground">Carregando tarefas...</p>
                  ) : dailyTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma tarefa para hoje.</p>
                  ) : null}
                  {dailyTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        task.completed
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          task.completed
                            ? "bg-emerald-500/10"
                            : "bg-secondary"
                        )}
                      >
                        <span
                          className={cn(
                            "font-japanese text-sm",
                            task.completed
                              ? "text-emerald-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {task.kanjiGlyph}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-sm flex-1",
                          task.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        )}
                      >
                        {task.task}
                      </span>
                      {task.completed && (
                        <span className="text-emerald-500 text-xs">✓</span>
                      )}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Kanji examples */}
            <motion.div variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Languages className="h-4 w-4 text-[var(--gold)]" />
                      Exemplos de Kanji
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      asChild
                    >
                      <Link href="/dashboard/kanji">
                        Ver todos
                        <ChevronRight aria-hidden="true" className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {kanjiExamples.map((item) => (
                      <Link
                        key={item.kanji}
                        href={`/dashboard/kanji?${new URLSearchParams({ search: item.kanji })}`}
                        className="flex min-w-0 flex-col items-center rounded-xl border border-border/50 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <span lang="ja" className="font-japanese text-2xl text-foreground">
                          {item.kanji}
                        </span>
                        <span lang="ja" className="mt-1 font-japanese text-[10px] text-muted-foreground [overflow-wrap:anywhere]">
                          {item.reading}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 mt-1"
                        >
                          {item.level}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </DashboardShell>
  )
}
