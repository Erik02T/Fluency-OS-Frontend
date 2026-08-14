"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Calendar,
  Plus,
  Check,
  Clock,
  Flame,
  Target,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Star,
  Zap,
  BookOpen,
  Headphones,
  Brain,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DashboardShell } from "@/components/layout"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  getPlannerOverview,
  type PlannerHabitDto,
  type PlannerOverviewResponseDto,
  type PlannerTaskDto,
  type PlannerTaskDomain,
  type PlannerWeeklyGoalDto,
} from "@/lib/planner-api"

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const HABIT_COLOR_BY_DOMAIN: Record<PlannerTaskDomain, string> = {
  kanji: "text-[var(--gold)]",
  vocabulary: "text-[var(--teal)]",
  grammar: "text-[var(--neon-blue)]",
  immersion: "text-[var(--teal)]",
  general: "text-[var(--torii-red)]",
}

const HABIT_ICON_BY_DOMAIN: Record<
  PlannerTaskDomain,
  React.ComponentType<{ className?: string }>
> = {
  kanji: BookOpen,
  vocabulary: BookOpen,
  grammar: Brain,
  immersion: Headphones,
  general: Zap,
}

const WEEK_COLOR_CLASS = [
  "bg-[var(--torii-red)]",
  "bg-[var(--gold)]",
  "bg-[var(--teal)]",
  "bg-[var(--neon-blue)]",
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "Erro inesperado ao carregar planner."
}

function parseApiMessage(message: string): string {
  try {
    const parsed = JSON.parse(message) as { message?: string | string[] }
    if (Array.isArray(parsed.message)) {
      return parsed.message.join(" ")
    }
    if (typeof parsed.message === "string") {
      return parsed.message
    }
  } catch {
    return message
  }
  return message
}

function getDomainBadgeColor(priority: PlannerTaskDto["priority"]) {
  if (priority === "high") {
    return "border-[var(--torii-red)]/30 text-[var(--torii-red)]"
  }
  if (priority === "medium") {
    return "border-[var(--gold)]/30 text-[var(--gold)]"
  }
  return "border-[var(--teal)]/30 text-[var(--teal)]"
}

function priorityLabel(priority: PlannerTaskDto["priority"]) {
  if (priority === "high") return "Alta"
  if (priority === "medium") return "Média"
  return "Baixa"
}

function LoadingWeekNavigation() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="text-center space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center p-3 rounded-xl bg-secondary/30 space-y-2 animate-pulse"
            >
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingTodayTasks() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 animate-pulse"
          >
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-56" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-4 w-12 ml-auto" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function LoadingHabits() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr,repeat(7,40px)] gap-2 items-center animate-pulse"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            {Array.from({ length: 7 }).map((__, j) => (
              <Skeleton key={j} className="h-10 w-10 rounded-lg" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function LoadingWeeklyGoals() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 animate-pulse">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function LoadingSummaryCards() {
  return (
    <>
      <Card className="bg-gradient-to-br from-[var(--torii-red)]/10 to-[var(--torii-red)]/5 border-[var(--torii-red)]/20">
        <CardContent className="p-4">
          <div className="text-center space-y-4 animate-pulse">
            <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-3 w-44 mx-auto" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardContent className="p-4 animate-pulse space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default function PlannerPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [
    overview,
    setOverview,
  ] = React.useState<PlannerOverviewResponseDto | null>(null)
  const [completedTaskIds, setCompletedTaskIds] = React.useState<
    Record<string, boolean>
  >({})
  const [selectedDay, setSelectedDay] = React.useState<number>(3)

  const todayTasks: PlannerTaskDto[] = overview?.todayTasks ?? []
  const habits: PlannerHabitDto[] = overview?.habits ?? []
  const weeklyGoals: PlannerWeeklyGoalDto[] = overview?.weeklyGoals ?? []
  const weekDays = overview?.week ?? []

  const monthLabel = React.useMemo(() => {
    const now = new Date()
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`
  }, [])

  const weekNumber = React.useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    return Math.max(1, Math.ceil(diff / oneWeek))
  }, [])

  const tasksCompletedToday = React.useMemo(() => {
    if (!overview) return 0
    return todayTasks.filter((t) => completedTaskIds[t.id]).length
  }, [todayTasks, overview, completedTaskIds])

  const tasksTotalToday = todayTasks.length

  const fetchOverview = React.useCallback(async () => {
    const controller = new AbortController()
    let isActive = true

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const payload = await getPlannerOverview({ signal: controller.signal })
      if (isActive) {
        setOverview(payload)
        const todayIndex = payload.week.findIndex((d) => d.isToday)
        if (todayIndex >= 0) {
          setSelectedDay(todayIndex)
        }
      }
    } catch (error) {
      if (
        isActive &&
        !(error instanceof DOMException && error.name === "AbortError")
      ) {
        const message = parseApiMessage(getErrorMessage(error))
        console.error("[planner-page] Failed to load planner:", {
          error,
          message,
        })
        setErrorMessage(message)
        toast({
          title: "Erro ao carregar planner",
          description:
            "Não foi possível gerar o planejamento de hoje. Tente novamente.",
          variant: "destructive",
        })
      }
    } finally {
      if (isActive) {
        setIsLoading(false)
      }
    }

    return () => {
      isActive = false
      controller.abort()
    }
  }, [])

  React.useEffect(() => {
    void fetchOverview()
  }, [fetchOverview])

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] }
      const nowCompleted = todayTasks.filter((t) => next[t.id]).length
      if (nowCompleted === tasksTotalToday && tasksTotalToday > 0) {
        toast({
          title: "Parabéns! Todas as tarefas concluídas",
          description: "Excelente progresso de hoje. Continue assim!",
        })
      }
      return next
    })
  }

  return (
    <DashboardShell
      title="Planner"
      subtitle="Planeje sua semana de estudos"
      kanji="計"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {errorMessage && (
          <motion.div variants={itemVariants}>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar planner</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{errorMessage}</p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void fetchOverview()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          {isLoading ? (
            <LoadingWeekNavigation />
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-foreground">
                      {monthLabel}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Semana {weekNumber}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDay(index)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-xl transition-all",
                        selectedDay === index
                          ? "bg-[var(--torii-red)] text-white"
                          : day.isToday
                            ? "bg-[var(--torii-red)]/10 border border-[var(--torii-red)]/30"
                            : "bg-secondary/30 hover:bg-secondary/50",
                      )}
                    >
                      <span className="text-[10px] text-inherit opacity-70">
                        {day.day}
                      </span>
                      <span className="text-lg font-bold">{day.date}</span>
                      {day.isToday && selectedDay !== index && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--torii-red)] mt-1" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants}>
              {isLoading ? (
                <LoadingTodayTasks />
              ) : (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[var(--torii-red)]" />
                        Tarefas de Hoje
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {tasksCompletedToday}/{tasksTotalToday}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void fetchOverview()}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          Atualizar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {todayTasks.length === 0 ? (
                      <div className="text-center py-10 space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center">
                          <Star className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground">
                          Nenhuma tarefa gerada
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          Comece a estudar para gerar recomendações personalizadas
                          de revisão e imersão.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => void fetchOverview()}
                          className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Recomendar tarefas
                        </Button>
                      </div>
                    ) : (
                      todayTasks.map((task, index) => {
                        const completed = !!completedTaskIds[task.id]
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all",
                              completed
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : "bg-secondary/30 border-border/50 hover:bg-secondary/50",
                            )}
                          >
                            <Checkbox
                              checked={completed}
                              onCheckedChange={() => toggleTask(task.id)}
                              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                            <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
                              <span
                                className={cn(
                                  "font-japanese text-sm",
                                  completed
                                    ? "text-emerald-500"
                                    : "text-muted-foreground",
                                )}
                              >
                                {task.kanjiGlyph}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div>
                                <span
                                  className={cn(
                                    "text-sm",
                                    completed
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground",
                                  )}
                                >
                                  {task.task}
                                </span>
                                {task.description && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  getDomainBadgeColor(task.priority),
                                )}
                              >
                                {priorityLabel(task.priority)}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.estimatedMinutes} min
                              </span>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              {isLoading ? (
                <LoadingHabits />
              ) : (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-[var(--gold)]" />
                        Hábitos Diários
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        Esta semana
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {habits.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">
                        Nenhum hábito detectado ainda.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-[1fr,repeat(7,40px)] gap-2 items-center">
                          <div />
                          {WEEK_LABELS.map((label, i) => (
                            <div
                              key={label}
                              className={cn(
                                "text-center text-[10px] text-muted-foreground",
                                weekDays[i]?.isToday &&
                                  "text-[var(--torii-red)] font-medium",
                              )}
                            >
                              {label}
                            </div>
                          ))}
                        </div>

                        {habits.map((habit, habitIndex) => {
                          const color =
                            HABIT_COLOR_BY_DOMAIN[habit.domain] ||
                            "text-muted-foreground"
                          return (
                            <div
                              key={habit.id}
                              className="grid grid-cols-[1fr,repeat(7,40px)] gap-2 items-center"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-lg bg-secondary flex items-center justify-center",
                                    color,
                                  )}
                                >
                                  <span className="font-japanese text-sm">
                                    {habit.kanji}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-foreground">
                                    {habit.name}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Flame className="h-3 w-3 text-orange-500" />
                                    <span className="text-[10px] text-muted-foreground">
                                      {habit.streak} dias
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {habit.completedThisWeek.map((done, dayIndex) => (
                                <motion.div
                                  key={`${habit.id}-${dayIndex}`}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors",
                                    done
                                      ? "bg-emerald-500/20 text-emerald-500"
                                      : dayIndex <= selectedDay
                                        ? "bg-secondary/50 hover:bg-secondary"
                                        : "bg-secondary/20",
                                  )}
                                  style={
                                    !done
                                      ? {
                                          background:
                                            dayIndex < habitIndex + 1
                                              ? undefined
                                              : undefined,
                                        }
                                      : undefined
                                  }
                                >
                                  {done && <Check className="h-4 w-4" />}
                                </motion.div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              {isLoading ? (
                <LoadingWeeklyGoals />
              ) : (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-[var(--torii-red)]" />
                      Metas Semanais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {weeklyGoals.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Nenhuma meta calculada para esta semana.
                      </p>
                    ) : (
                      weeklyGoals.map((goal, index) => {
                        const percent =
                          goal.target > 0
                            ? Math.min(
                                100,
                                Math.round((goal.current / goal.target) * 100),
                              )
                            : 0
                        const color =
                          WEEK_COLOR_CLASS[index % WEEK_COLOR_CLASS.length]
                        return (
                          <div key={goal.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                                  <span className="font-japanese text-sm text-muted-foreground">
                                    {goal.kanji}
                                  </span>
                                </div>
                                <span className="text-sm text-foreground">
                                  {goal.name}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {goal.current.toLocaleString("pt-BR")}/
                                {goal.target.toLocaleString("pt-BR")}
                                {goal.unit}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                role="progressbar"
                                aria-valuenow={percent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                className={cn("h-full rounded-full", color)}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {isLoading ? (
              <LoadingSummaryCards />
            ) : (
              <>
                <motion.div variants={itemVariants}>
                  <Card className="bg-gradient-to-br from-[var(--torii-red)]/10 to-[var(--torii-red)]/5 border-[var(--torii-red)]/20">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--torii-red)]/20 mx-auto mb-3 flex items-center justify-center">
                          <span className="font-japanese text-3xl text-[var(--torii-red)]">
                            今
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          Resumo de Hoje
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          {overview?.summary.todayDateLabel ?? "—"}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-background/50">
                            <p className="text-2xl font-bold text-foreground">
                              {tasksCompletedToday}/{tasksTotalToday || 0}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Tarefas completas
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-background/50">
                            <p className="text-2xl font-bold text-foreground">
                              {overview?.summary.studyMinutesToday ?? 0}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Minutos estudados
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                          <Flame className="h-7 w-7 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Streak Atual
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {overview?.summary.currentStreakDays ?? 0} dias
                          </p>
                          <p className="text-xs text-orange-500">
                            Recorde: {overview?.summary.longestStreakDays ?? 0} dias
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardShell>
  )
}
