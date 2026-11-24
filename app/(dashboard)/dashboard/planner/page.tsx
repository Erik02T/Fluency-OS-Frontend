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
  RefreshCw,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DashboardShell } from "@/components/layout"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  deletePlannerTask,
  getPlannerOverview,
  getWeeklyPlan,
  togglePlannerTaskCompletion,
  updatePlannerTask,
  type PlannerHabitDto,
  type PlannerOverviewResponseDto,
  type PlannerTaskDto,
  type PlannerTaskDomain,
  type PlannerWeeklyGoalDto,
  type WeeklyGoalItemDto,
  type WeeklyPlanResponseDto,
} from "@/lib/planner-api"
import { AddTaskModal } from "@/components/planner/add-task-modal"
import { EditGoalsModal } from "@/components/planner/edit-goals-modal"

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const HABIT_COLOR_BY_DOMAIN: Record<PlannerTaskDomain, string> = {
  kanji: "text-[var(--gold)]",
  vocabulary: "text-[var(--teal)]",
  grammar: "text-[var(--neon-blue)]",
  immersion: "text-[var(--teal)]",
  general: "text-[var(--torii-red)]",
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
  const { user, isInitializing } = useAdminAuth()
  if (!user || isInitializing) {
    return <DashboardShell title="Planner" kanji="計">
      <p role="status" className="text-sm text-muted-foreground">
        {isInitializing ? "Restaurando sua sessão..." : "Entre para consultar seu planejamento."}
      </p>
    </DashboardShell>
  }
  return <PlannerContent key={user.id} />
}

function PlannerContent() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false)
  const [isEditGoalsOpen, setIsEditGoalsOpen] = React.useState(false)
  const [
    overview,
    setOverview,
  ] = React.useState<PlannerOverviewResponseDto | null>(null)
  const [weeklyPlan, setWeeklyPlan] = React.useState<WeeklyPlanResponseDto | null>(null)
  const [completedTaskIds, setCompletedTaskIds] = React.useState<
    Record<string, boolean>
  >({})
  const [targetDate, setTargetDate] = React.useState<string>()
  const [editTask, setEditTask] = React.useState<{
    id: string
    title: string
    date: string
    duration: string
  } | null>(null)
  const [editError, setEditError] = React.useState<string | null>(null)
  const [isSavingTask, setIsSavingTask] = React.useState(false)
  const overviewRequest = React.useRef(0)
  const planRequest = React.useRef(0)

  const todayTasks: PlannerTaskDto[] = React.useMemo(() => overview?.todayTasks ?? [], [overview?.todayTasks])
  const habits: PlannerHabitDto[] = overview?.habits ?? []
  const weeklyGoals: PlannerWeeklyGoalDto[] = overview?.weeklyGoals ?? []
  const weekDays = overview?.week ?? []

  const selectedDate = overview?.selectedDate
  const selectedDay = weekDays.findIndex((day) => day.isoDate === selectedDate)
  const monthLabel = selectedDate
    ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(selectedDate))
    : ""
  const shiftWeek = (days: number) => {
    if (!selectedDate) return
    const shifted = new Date(selectedDate)
    shifted.setUTCDate(shifted.getUTCDate() + days)
    const date = shifted.toISOString().slice(0, 10)
    setTargetDate(date === overview?.todayDate ? undefined : date)
  }

  const tasksCompletedToday = React.useMemo(() => {
    if (!overview) return 0
    return todayTasks.filter((t) => completedTaskIds[t.id] ?? t.completed).length
  }, [todayTasks, overview, completedTaskIds])

  const tasksTotalToday = todayTasks.length

  const fetchOverview = React.useCallback(async (targetDate?: string, skipLoading = false) => {
    const request = ++overviewRequest.current
    try {
      if (!skipLoading) {
        setIsLoading(true)
      }
      setErrorMessage(null)

      const payload = await getPlannerOverview(targetDate)
      if (request !== overviewRequest.current) return
      setOverview(payload)

      // Initialize completedTaskIds from server response
      const initialCompleted: Record<string, boolean> = {}
      for (const t of payload.todayTasks) {
        if (t.completed || t.status === "COMPLETED") {
          initialCompleted[t.id] = true
        }
      }
      setCompletedTaskIds(initialCompleted)

    } catch (error) {
      if (request !== overviewRequest.current) return
      const message = parseApiMessage(getErrorMessage(error))
      console.error("[planner-page] Failed to load planner:", {
        error,
        message,
      })
      setErrorMessage(message)
      toast({
        title: "Erro ao carregar planner",
        description:
          "Não foi possível gerar o planejamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      if (request === overviewRequest.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const fetchWeeklyPlan = React.useCallback(async (targetDate?: string) => {
    const request = ++planRequest.current
    try {
      const plan = await getWeeklyPlan({ date: targetDate })
      if (request === planRequest.current) setWeeklyPlan(plan)
    } catch (error) {
      console.error("[planner-page] Failed to load weekly plan:", error)
    }
  }, [])

  React.useEffect(() => {
    void fetchOverview(targetDate)
    void fetchWeeklyPlan(targetDate)
  }, [fetchOverview, fetchWeeklyPlan, targetDate])

  const refreshTasks = () => {
    void fetchOverview(targetDate, true)
    void fetchWeeklyPlan(targetDate)
  }

  const openTaskEditor = (task: PlannerTaskDto) => {
    if (!selectedDate) return
    setEditError(null)
    setEditTask({ id: task.id, title: task.task, date: selectedDate, duration: String(task.estimatedMinutes) })
  }

  const saveTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editTask || isSavingTask) return
    const title = editTask.title.trim()
    const estimatedMinutes = Number(editTask.duration)
    if (!title || !editTask.date || !Number.isInteger(estimatedMinutes) || estimatedMinutes < 1 || estimatedMinutes > 720) {
      setEditError("Informe um título, uma data válida e uma duração entre 1 e 720 minutos.")
      return
    }
    setIsSavingTask(true)
    setEditError(null)
    try {
      await updatePlannerTask(editTask.id, { title, date: editTask.date, estimatedMinutes })
      setEditTask(null)
      refreshTasks()
      toast({ title: "Tarefa atualizada" })
    } catch (error) {
      setEditError(parseApiMessage(getErrorMessage(error)) || "Não foi possível salvar a tarefa.")
    } finally {
      setIsSavingTask(false)
    }
  }

  const toggleTask = async (taskId: string) => {
    const isCurrentlyDone = !!completedTaskIds[taskId]
    const nextDone = !isCurrentlyDone

    // Optimistic UI update
    setCompletedTaskIds((prev) => ({ ...prev, [taskId]: nextDone }))

    // If it's a persistent task (CUID format), call API
    if (!taskId.startsWith("task-")) {
      try {
        await togglePlannerTaskCompletion(taskId, { completed: nextDone })
        refreshTasks()
      } catch (error) {
        console.error("[planner-page] Failed to toggle task:", error)
        // Rollback
        setCompletedTaskIds((prev) => ({ ...prev, [taskId]: isCurrentlyDone }))
        toast({
          title: "Erro ao atualizar tarefa",
          description: "Não foi possível sincronizar o status da tarefa.",
          variant: "destructive",
        })
        return
      }
    }

    if (nextDone) {
      const remaining = todayTasks.filter(
        (t) => t.id !== taskId && !completedTaskIds[t.id],
      ).length
      if (remaining === 0 && tasksTotalToday > 0) {
        toast({
          title: "Parabéns! Todas as tarefas concluídas 🎉",
          description: "Excelente progresso de hoje. Continue assim!",
        })
      }
    }
  }

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (taskId.startsWith("task-")) return

    try {
      await deletePlannerTask(taskId)
      toast({
        title: "Tarefa removida",
        description: "A tarefa foi excluída com sucesso.",
      })
      refreshTasks()
    } catch (error) {
      console.error("[planner-page] Failed to delete task:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a tarefa.",
        variant: "destructive",
      })
    }
  }

  const handleGoalsUpdated = (plan: WeeklyPlanResponseDto) => {
    setWeeklyPlan(plan)
    void fetchOverview(targetDate, true)
  }

  const currentGoals: WeeklyGoalItemDto[] = weeklyPlan?.goals.map((g) => ({
    category: g.category,
    targetValue: g.targetValue,
    unit: g.unit,
  })) || []

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
                  onClick={refreshTasks}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => shiftWeek(-7)}
                    aria-label="Semana anterior"
                    disabled={isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-center">
                    <h3 className="text-sm font-medium text-foreground">
                      {monthLabel}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {weeklyPlan && `Semana ${weeklyPlan.weekNumber}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => shiftWeek(7)}
                    aria-label="Próxima semana"
                    disabled={isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2" role="navigation" aria-label="Navegação semanal">
                  {weekDays.map((day) => (
                    <motion.button
                      key={day.isoDate}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTargetDate(day.isToday ? undefined : day.isoDate)}
                      aria-label={`${day.day} ${day.date}${day.isToday ? " (hoje)" : ""}`}
                      aria-pressed={selectedDate === day.isoDate}
                      className={cn(
                        "flex min-w-0 flex-col items-center rounded-xl px-1 py-2 transition-all sm:p-3",
                        selectedDate === day.isoDate
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
                      {day.isToday && selectedDate !== day.isoDate && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--torii-red)] mt-1" aria-hidden="true" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6" role="main">
            <motion.div variants={itemVariants}>
              {isLoading ? (
                <LoadingTodayTasks />
              ) : (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[var(--torii-red)]" />
                        {selectedDate === overview?.todayDate ? "Tarefas de Hoje" : "Tarefas do Dia"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {tasksCompletedToday}/{tasksTotalToday}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => setIsAddTaskOpen(true)}
                          className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white font-medium"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Tarefa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={refreshTasks}
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
                          Nenhuma tarefa agendada
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          Crie suas próprias metas para o dia ou comece a estudar
                          para receber recomendações personalizadas.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setIsAddTaskOpen(true)}
                          className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Tarefa
                        </Button>
                      </div>
                    ) : (
                      todayTasks.map((task, index) => {
                        const completed = completedTaskIds[task.id] ?? !!task.completed
                        const isPersistent = !task.id.startsWith("task-")

                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "group flex items-center gap-3 p-3 rounded-lg border transition-all",
                              completed
                                ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                                : "bg-secondary/30 border-border/50 hover:bg-secondary/50",
                            )}
                          >
                            <Checkbox
                              checked={completed}
                              onCheckedChange={() => void toggleTask(task.id)}
                              aria-label={`Marcar tarefa "${task.task}" como ${completed ? 'pendente' : 'concluída'}`}
                              className={cn(
                                "h-5 w-5 border-2 transition-all",
                                completed
                                  ? "bg-emerald-500 border-emerald-500"
                                  : "border-border/60"
                              )}
                            />
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                              completed
                                ? "bg-emerald-500/20"
                                : "bg-background/50"
                            )}>
                              <span
                                className={cn(
                                  "font-japanese text-sm font-semibold",
                                  completed
                                    ? "text-emerald-600"
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
                                    "text-sm font-medium transition-all",
                                    completed
                                      ? "text-emerald-700 line-through opacity-75"
                                      : "text-foreground",
                                  )}
                                >
                                  {task.task}
                                </span>
                                {task.description && (
                                  <p className={cn(
                                    "text-[11px] mt-0.5 line-clamp-1 transition-all",
                                    completed
                                      ? "text-emerald-600/70 opacity-60"
                                      : "text-muted-foreground"
                                  )}>
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
                              {isPersistent && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openTaskEditor(task)
                                  }}
                                  aria-label={`Editar tarefa "${task.task}"`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isPersistent && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                                  onClick={(e) =>
                                    void handleDeleteTask(task.id, e)
                                  }
                                  aria-label={`Excluir tarefa "${task.task}"`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
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
                      <div className="text-center py-8 space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-secondary mx-auto flex items-center justify-center">
                          <Repeat className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Nenhum hábito detectado ainda.
                        </p>
                        <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                          Conclua tarefas regularmente para que o sistema detecte seus padrões de estudo.
                        </p>
                      </div>
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

                        {habits.map((habit) => {
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
                                  role="checkbox"
                                  aria-checked={done}
                                  aria-label={`${habit.name} - ${WEEK_LABELS[dayIndex]}: ${done ? 'concluído' : 'pendente'}`}
                                  className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors",
                                    done
                                      ? "bg-emerald-500/20 text-emerald-500"
                                      : dayIndex <= selectedDay
                                        ? "bg-secondary/50 hover:bg-secondary"
                                        : "bg-secondary/20",
                                  )}
                                >
                                  {done && <Check className="h-4 w-4" aria-hidden="true" />}
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

          <div className="space-y-6" role="complementary" aria-label="Painel lateral">
            <motion.div variants={itemVariants}>
              {isLoading ? (
                <LoadingWeeklyGoals />
              ) : (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-[var(--torii-red)]" />
                        Metas Semanais
                      </CardTitle>
                      {weeklyPlan && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditGoalsOpen(true)}
                          disabled={isLoading}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {weeklyGoals.length === 0 ? (
                      <div className="text-center py-4 space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-secondary mx-auto flex items-center justify-center">
                          <Target className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Nenhuma meta calculada para esta semana.
                        </p>
                        <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                          As metas serão calculadas automaticamente baseadas no seu histórico.
                        </p>
                      </div>
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
                            Recorde: {overview?.summary.longestStreakDays ?? 0}{" "}
                            dias
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

        <AddTaskModal
          open={isAddTaskOpen}
          onOpenChange={setIsAddTaskOpen}
          defaultDate={selectedDate}
          onTaskCreated={refreshTasks}
        />
        <Dialog open={editTask !== null} onOpenChange={(open) => {
          if (!open && !isSavingTask) setEditTask(null)
        }}>
          {editTask && (
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Editar tarefa</DialogTitle>
                <DialogDescription>Altere o título, a data ou a duração estimada.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={saveTask}>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-task-title">Título</Label>
                  <Input id="edit-task-title" required maxLength={300} value={editTask.title}
                    disabled={isSavingTask} onChange={(event) => setEditTask({ ...editTask, title: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-task-date">Data</Label>
                  <Input id="edit-task-date" required type="date" value={editTask.date}
                    disabled={isSavingTask} onChange={(event) => setEditTask({ ...editTask, date: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-task-duration">Duração estimada em minutos</Label>
                  <Input id="edit-task-duration" required type="number" min={1} max={720} value={editTask.duration}
                    disabled={isSavingTask} onChange={(event) => setEditTask({ ...editTask, duration: event.target.value })} />
                </div>
                {editError && <p role="alert" className="text-sm text-destructive">{editError}</p>}
                <DialogFooter>
                  <Button variant="outline" type="button" disabled={isSavingTask} onClick={() => setEditTask(null)}>Cancelar</Button>
                  <Button type="submit" disabled={isSavingTask}>{isSavingTask ? "Salvando..." : "Salvar alterações"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          )}
        </Dialog>
        {weeklyPlan && (
          <EditGoalsModal
            open={isEditGoalsOpen}
            onOpenChange={setIsEditGoalsOpen}
            planId={weeklyPlan.id}
            currentGoals={currentGoals}
            onGoalsUpdated={handleGoalsUpdated}
          />
        )}
      </motion.div>
    </DashboardShell>
  )
}
