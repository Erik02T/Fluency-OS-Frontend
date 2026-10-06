"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Headphones,
  Play,
  Clock,
  Plus,
  Star,
  Film,
  Mic,
  Youtube,
  BookOpen,
  MessageCircle,
  TrendingUp,
  Calendar,
  ChevronRight,
  Target,
  Loader2,
  AlertCircle,
  Gamepad2,
  Newspaper,
  Music,
  Clapperboard,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DashboardShell } from "@/components/layout"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  IMMERSION_TYPE_LABELS,
  ImmersionApiType,
  createImmersionLog,
  getImmersionLogs,
  type ImmersionLogResponseDto,
  type PaginatedImmersionLogResponseDto,
} from "@/lib/immersion-api"
import {
  getWeeklyPlan,
  updateWeeklyGoals,
  type WeeklyPlanResponseDto,
  type WeeklyGoalItemDto,
} from "@/lib/planner-api"

const PAGE_SIZE = 50

const IMMERSION_TYPE_OPTIONS: Array<{
  value: ImmersionApiType
  label: string
}> = [
  { value: ImmersionApiType.ANIME, label: "Anime" },
  { value: ImmersionApiType.DRAMA, label: "Drama" },
  { value: ImmersionApiType.PODCAST, label: "Podcast" },
  { value: ImmersionApiType.YOUTUBE, label: "YouTube" },
  { value: ImmersionApiType.MANGA, label: "Mangá" },
  { value: ImmersionApiType.NOVEL, label: "Novela Leve" },
  { value: ImmersionApiType.VISUAL_NOVEL, label: "Visual Novel" },
  { value: ImmersionApiType.GAME, label: "Jogo" },
  { value: ImmersionApiType.NEWS, label: "Notícias" },
  { value: ImmersionApiType.MUSIC, label: "Música" },
  { value: ImmersionApiType.MOVIE, label: "Filme" },
  { value: ImmersionApiType.OTHER, label: "Outro" },
]

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "Erro inesperado ao carregar imersão."
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

const typeIcons: Record<ImmersionApiType, React.ComponentType<{ className?: string }>> = {
  [ImmersionApiType.ANIME]: Film,
  [ImmersionApiType.DRAMA]: Clapperboard,
  [ImmersionApiType.PODCAST]: Headphones,
  [ImmersionApiType.YOUTUBE]: Youtube,
  [ImmersionApiType.MANGA]: BookOpen,
  [ImmersionApiType.NOVEL]: BookOpen,
  [ImmersionApiType.VISUAL_NOVEL]: Gamepad2,
  [ImmersionApiType.GAME]: Gamepad2,
  [ImmersionApiType.NEWS]: Newspaper,
  [ImmersionApiType.MUSIC]: Music,
  [ImmersionApiType.MOVIE]: Film,
  [ImmersionApiType.OTHER]: Play,
}

const typeColors: Record<ImmersionApiType, string> = {
  [ImmersionApiType.ANIME]: "text-[var(--torii-red)]",
  [ImmersionApiType.DRAMA]: "text-pink-500",
  [ImmersionApiType.PODCAST]: "text-[var(--gold)]",
  [ImmersionApiType.YOUTUBE]: "text-[var(--neon-blue)]",
  [ImmersionApiType.MANGA]: "text-[var(--teal)]",
  [ImmersionApiType.NOVEL]: "text-emerald-500",
  [ImmersionApiType.VISUAL_NOVEL]: "text-purple-500",
  [ImmersionApiType.GAME]: "text-indigo-500",
  [ImmersionApiType.NEWS]: "text-blue-500",
  [ImmersionApiType.MUSIC]: "text-fuchsia-500",
  [ImmersionApiType.MOVIE]: "text-amber-500",
  [ImmersionApiType.OTHER]: "text-muted-foreground",
}

function comprehensionToStars(comprehension: number | null): number {
  if (comprehension === null || comprehension === undefined) return 0
  const clamped = Math.max(0, Math.min(100, comprehension))
  return Math.ceil(clamped / 20)
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function startOfMonth(date: Date): Date {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function getWeekdayName(date: Date): string {
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][date.getDay()]
}

function buildWeekBreakdown(
  logs: ImmersionLogResponseDto[],
  now: Date,
): Array<{ day: string; minutes: number }> {
  const weekStart = startOfWeek(now)
  const days: Array<{ day: string; minutes: number }> = []

  for (let i = 0; i < 7; i++) {
    const current = new Date(weekStart)
    current.setDate(weekStart.getDate() + i)
    const dayStart = startOfDay(current)
    const dayEnd = endOfDay(current)

    const totalMinutes = logs.reduce((sum, log) => {
      const logDate = new Date(log.loggedAt)
      if (logDate >= dayStart && logDate <= dayEnd) {
        return sum + log.durationMinutes
      }
      return sum
    }, 0)

    days.push({
      day: getWeekdayName(current),
      minutes: totalMinutes,
    })
  }

  return days
}

interface StatsSummary {
  todayMinutes: number
  weekMinutes: number
  monthMinutes: number
  totalMinutes: number
  streakDays: number
  averageComprehension: number
  weeklyCurrent: number
  weeklyTarget: number
}

function computeStats(
  logs: ImmersionLogResponseDto[],
  now: Date,
  weeklyTarget?: number,
): StatsSummary {
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  let todayMinutes = 0
  let weekMinutes = 0
  let monthMinutes = 0
  let totalMinutes = 0
  let comprehensionSum = 0
  let comprehensionCount = 0

  const activeDays = new Set<string>()

  for (const log of logs) {
    const logDate = new Date(log.loggedAt)
    totalMinutes += log.durationMinutes

    const dateKey = `${logDate.getFullYear()}-${logDate.getMonth()}-${logDate.getDate()}`
    activeDays.add(dateKey)

    if (logDate >= todayStart && logDate <= todayEnd) {
      todayMinutes += log.durationMinutes
    }
    if (logDate >= weekStart) {
      weekMinutes += log.durationMinutes
    }
    if (logDate >= monthStart) {
      monthMinutes += log.durationMinutes
    }
    if (log.comprehension !== null && log.comprehension !== undefined) {
      comprehensionSum += log.comprehension
      comprehensionCount += 1
    }
  }

  let streakDays = 0
  if (activeDays.size > 0) {
    let cursor = startOfDay(now)
    while (true) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`
      if (activeDays.has(key)) {
        streakDays += 1
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }
  }

  const averageComprehension =
    comprehensionCount > 0
      ? Math.round((comprehensionSum / comprehensionCount) / 20) / 1
      : 0

  // Use provided weeklyTarget or fallback to calculated value
  const finalWeeklyTarget = weeklyTarget ?? Math.max(420, weekMinutes + 100)

  return {
    todayMinutes,
    weekMinutes,
    monthMinutes,
    totalMinutes,
    streakDays,
    averageComprehension: Math.min(5, Math.max(0, averageComprehension)),
    weeklyCurrent: weekMinutes,
    weeklyTarget: finalWeeklyTarget,
  }
}

function computeTypeBreakdown(
  logs: ImmersionLogResponseDto[],
): Array<{ type: string; percentage: number; kanji: string; apiType: ImmersionApiType }> {
  if (logs.length === 0) {
    return []
  }

  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0)
  if (totalMinutes === 0) {
    return []
  }

  const byType = new Map<ImmersionApiType, number>()
  for (const log of logs) {
    const current = byType.get(log.type) ?? 0
    byType.set(log.type, current + log.durationMinutes)
  }

  const kanjiByType: Record<ImmersionApiType, string> = {
    [ImmersionApiType.ANIME]: "映",
    [ImmersionApiType.DRAMA]: "劇",
    [ImmersionApiType.PODCAST]: "聴",
    [ImmersionApiType.YOUTUBE]: "見",
    [ImmersionApiType.MANGA]: "漫",
    [ImmersionApiType.NOVEL]: "本",
    [ImmersionApiType.VISUAL_NOVEL]: "視",
    [ImmersionApiType.GAME]: "遊",
    [ImmersionApiType.NEWS]: "新",
    [ImmersionApiType.MUSIC]: "音",
    [ImmersionApiType.MOVIE]: "画",
    [ImmersionApiType.OTHER]: "他",
  }

  return [...byType.entries()]
    .map(([apiType, minutes]) => ({
      type: IMMERSION_TYPE_LABELS[apiType],
      percentage: Math.round((minutes / totalMinutes) * 100),
      kanji: kanjiByType[apiType],
      apiType,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)
}

function StatCard({
  label,
  value,
  suffix,
  kanji,
  color,
}: {
  label: string
  value: string
  suffix: string
  kanji: string
  color: string
}) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-secondary mx-auto mb-2 flex items-center justify-center">
          <span className={cn("font-japanese text-lg", color)}>{kanji}</span>
        </div>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{suffix}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}

function LoadingStatsCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card
          key={index}
          className="bg-card/50 backdrop-blur-sm border-border/50"
        >
          <CardContent className="p-4 text-center space-y-2 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-muted/50 mx-auto mb-2" />
            <div className="h-8 w-16 mx-auto rounded bg-muted/50" />
            <div className="h-3 w-16 mx-auto rounded bg-muted/40" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LoadingWeeklyGoal() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-3 w-6 mx-auto rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSessionRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="p-3 rounded-lg bg-secondary/30 border border-border/50 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/50 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
              <Skeleton className="h-4 w-60 rounded" />
            </div>
            <div className="space-y-2 w-16 shrink-0">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-12 rounded ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingTypeBreakdown() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32 rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1 animate-pulse">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function ImmersionPage() {
  const [isAddingSession, setIsAddingSession] = React.useState(false)
  const [isEditingGoal, setIsEditingGoal] = React.useState(false)
  const [formType, setFormType] = React.useState<string>("")
  const [formTitle, setFormTitle] = React.useState("")
  const [formEpisode, setFormEpisode] = React.useState("")
  const [formDuration, setFormDuration] = React.useState("")
  const [formComprehension, setFormComprehension] = React.useState<number | null>(null)
  const [formNotes, setFormNotes] = React.useState("")
  const [formLoggedAt, setFormLoggedAt] = React.useState<string>(
    () => new Date().toISOString().split("T")[0],
  )
  const [goalValue, setGoalValue] = React.useState<string>("")

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isUpdatingGoal, setIsUpdatingGoal] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [
    response,
    setResponse,
  ] = React.useState<PaginatedImmersionLogResponseDto>({
    data: [],
    pagination: { page: 1, perPage: PAGE_SIZE, total: 0, pages: 0 },
  })
  const [weeklyPlan, setWeeklyPlan] = React.useState<WeeklyPlanResponseDto | null>(null)

  const now = new Date()
  const allLogs = response.data

  // Extract immersion goal from weekly plan
  const immersionGoal = weeklyPlan?.goals.find(g => g.category === "IMMERSION")
  const weeklyTarget = immersionGoal?.targetValue

  const stats = computeStats(allLogs, now, weeklyTarget)
  const weekBreakdown = buildWeekBreakdown(allLogs, now)
  const typeBreakdown = computeTypeBreakdown(allLogs)

  const resetForm = () => {
    setFormType("")
    setFormTitle("")
    setFormEpisode("")
    setFormDuration("")
    setFormComprehension(null)
    setFormNotes("")
    setFormLoggedAt(new Date().toISOString().split("T")[0])
  }

  const fetchLogs = React.useCallback(async () => {
    const controller = new AbortController()
    let isActive = true

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const payload = await getImmersionLogs(
        {
          page: 1,
          perPage: PAGE_SIZE,
          sort: "loggedAt",
          order: "desc",
        },
        { signal: controller.signal },
      )

      if (isActive) {
        setResponse(payload)
      }
    } catch (error) {
      if (isActive && !(error instanceof DOMException && error.name === "AbortError")) {
        const message = parseApiMessage(getErrorMessage(error))
        console.error("[immersion-page] Failed to fetch immersion logs:", {
          error,
          message,
        })
        setErrorMessage(message)
        toast({
          title: "Erro ao carregar sessões",
          description:
            "Não foi possível carregar o histórico de imersão. Tente novamente.",
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

  const fetchWeeklyPlan = React.useCallback(async () => {
    try {
      const plan = await getWeeklyPlan({ date: new Date().toISOString().split("T")[0] })
      setWeeklyPlan(plan)
      // Initialize goal value when plan loads
      const immersionGoal = plan?.goals.find(g => g.category === "IMMERSION")
      if (immersionGoal) {
        setGoalValue(immersionGoal.targetValue.toString())
      }
    } catch (error) {
      console.error("[immersion-page] Failed to fetch weekly plan:", error)
      // Don't show error toast for this - it's not critical
    }
  }, [])

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!weeklyPlan) {
      toast({
        title: "Erro ao atualizar meta",
        description: "Não foi possível encontrar o planejamento semanal.",
        variant: "destructive",
      })
      return
    }

    const goalNum = Number(goalValue)
    if (!goalNum || goalNum < 1 || !Number.isFinite(goalNum)) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor positivo para a meta semanal.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUpdatingGoal(true)

      // Get current goals and update only the immersion goal
      const currentGoals: WeeklyGoalItemDto[] = weeklyPlan.goals.map(g => ({
        category: g.category,
        targetValue: g.category === "IMMERSION" ? goalNum : g.targetValue,
        unit: g.unit,
      }))

      const updatedPlan = await updateWeeklyGoals(weeklyPlan.id, currentGoals)

      toast({
        title: "Meta atualizada!",
        description: `Sua meta semanal de imersão foi alterada para ${goalNum} minutos.`,
      })

      setWeeklyPlan(updatedPlan)
      setIsEditingGoal(false)
    } catch (error) {
      const message = parseApiMessage(getErrorMessage(error))
      console.error("[immersion-page] Failed to update goal:", error)
      toast({
        title: "Erro ao atualizar meta",
        description: message || "Não foi possível atualizar a meta semanal.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingGoal(false)
    }
  }

  React.useEffect(() => {
    void fetchLogs()
    void fetchWeeklyPlan()
  }, [fetchLogs, fetchWeeklyPlan])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formType) {
      toast({
        title: "Selecione o tipo de atividade",
        description: "É necessário informar o tipo de imersão.",
        variant: "destructive",
      })
      return
    }

    const durationNum = Number(formDuration)
    if (!durationNum || durationNum < 1 || !Number.isFinite(durationNum)) {
      toast({
        title: "Duração inválida",
        description: "Informe uma duração em minutos maior que zero.",
        variant: "destructive",
      })
      return
    }

    if (!formTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Informe um título para a sessão de imersão.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const logDate = new Date(`${formLoggedAt}T12:00:00`)

      console.debug("[immersion-page] Submitting new session:", {
        type: formType,
        title: formTitle,
        durationMinutes: durationNum,
        episode: formEpisode || undefined,
        comprehension: formComprehension ?? undefined,
        notes: formNotes || undefined,
        loggedAt: logDate.toISOString(),
      })

      const created = await createImmersionLog({
        type: formType as ImmersionApiType,
        title: formTitle.trim(),
        durationMinutes: durationNum,
        episode: formEpisode.trim() || undefined,
        comprehension: formComprehension ?? undefined,
        notes: formNotes.trim() || undefined,
        isActive: true,
        loggedAt: logDate,
      })

      console.debug("[immersion-page] Session created successfully:", {
        id: created.id,
        title: created.title,
      })

      toast({
        title: "Sessão registrada!",
        description: `Adicionados ${durationNum} minutos de ${IMMERSION_TYPE_LABELS[created.type]}.`,
      })

      resetForm()
      setIsAddingSession(false)
      await fetchLogs()
      void fetchWeeklyPlan() // Refresh to get updated progress
    } catch (error) {
      const message = parseApiMessage(getErrorMessage(error))
      console.error("[immersion-page] Failed to create immersion session:", {
        error,
        message,
      })
      toast({
        title: "Falha ao registrar sessão",
        description: message || "Tente novamente em alguns minutos.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const statCards = [
    {
      label: "Hoje",
      value: `${stats.todayMinutes}`,
      suffix: "min",
      kanji: "今",
      color: "text-[var(--torii-red)]",
    },
    {
      label: "Esta Semana",
      value: `${Math.floor(stats.weekMinutes / 60)}`,
      suffix: "h",
      kanji: "週",
      color: "text-[var(--gold)]",
    },
    {
      label: "Este Mês",
      value: `${Math.floor(stats.monthMinutes / 60)}`,
      suffix: "h",
      kanji: "月",
      color: "text-[var(--teal)]",
    },
    {
      label: "Total",
      value: `${Math.floor(stats.totalMinutes / 60)}`,
      suffix: "h",
      kanji: "全",
      color: "text-[var(--neon-blue)]",
    },
    {
      label: "Streak",
      value: `${stats.streakDays}`,
      suffix: "dias",
      kanji: "継",
      color: "text-orange-500",
    },
    {
      label: "Compreensão",
      value: stats.averageComprehension > 0 ? `${stats.averageComprehension}` : "-",
      suffix: stats.averageComprehension > 0 ? "/5" : "",
      kanji: "解",
      color: "text-emerald-500",
    },
  ]

  const weeklyProgressPercent =
    stats.weeklyTarget > 0
      ? Math.min(100, Math.round((stats.weeklyCurrent / stats.weeklyTarget) * 100))
      : 0

  return (
    <DashboardShell
      title="Imersão"
      subtitle="Acompanhe seu input em japonês"
      kanji="聴"
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
              <AlertTitle>Erro ao carregar dados</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{errorMessage}</p>
                <Button size="sm" variant="destructive" onClick={() => {
                  void fetchLogs()
                  void fetchWeeklyPlan()
                }}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          {isLoading ? <LoadingStatsCards /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants}>
              {isLoading ? (
                <LoadingWeeklyGoal />
              ) : (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-[var(--torii-red)]" />
                        Meta Semanal
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {stats.weeklyCurrent}/{stats.weeklyTarget} min
                        </span>
                        <Dialog open={isEditingGoal} onOpenChange={setIsEditingGoal}>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              disabled={!weeklyPlan}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border">
                            <DialogHeader>
                              <DialogTitle>Editar Meta Semanal de Imersão</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpdateGoal} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="goal-value">Meta semanal (minutos)</Label>
                                <Input
                                  id="goal-value"
                                  type="number"
                                  min={1}
                                  max={10000}
                                  value={goalValue}
                                  onChange={(e) => setGoalValue(e.target.value)}
                                  disabled={isUpdatingGoal}
                                  className="bg-secondary/50 border-border"
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsEditingGoal(false)}
                                  disabled={isUpdatingGoal}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="submit"
                                  size="sm"
                                  className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
                                  disabled={isUpdatingGoal}
                                >
                                  {isUpdatingGoal ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Target className="h-4 w-4 mr-1" />
                                  )}
                                  Salvar
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={weeklyProgressPercent} className="h-2 mb-4" />
                    <div className="grid grid-cols-7 gap-2">
                      {weekBreakdown.map((day) => (
                        <div key={day.day} className="text-center">
                          <div
                            className={cn(
                              "h-16 rounded-lg flex items-end justify-center pb-2 transition-colors",
                              day.minutes > 0
                                ? "bg-[var(--torii-red)]/20"
                                : "bg-secondary/50",
                            )}
                            style={{
                              background:
                                day.minutes > 0
                                  ? `linear-gradient(to top, var(--torii-red) ${Math.min(
                                      (day.minutes / 90) * 100,
                                      100,
                                    )}%, transparent ${Math.min(
                                      (day.minutes / 90) * 100,
                                      100,
                                    )}%)`
                                  : undefined,
                            }}
                          >
                            <span className="text-xs font-medium text-foreground">
                              {day.minutes > 0 ? `${day.minutes}` : ""}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 block">
                            {day.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[var(--gold)]" />
                      Sessões Recentes
                    </CardTitle>
                    <Dialog
                      open={isAddingSession}
                      onOpenChange={(open) => {
                        setIsAddingSession(open)
                        if (!open) resetForm()
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
                          disabled={isLoading}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Registrar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Registrar Sessão de Imersão</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="im-type">Tipo</Label>
                              <Select value={formType} onValueChange={setFormType}>
                                <SelectTrigger
                                  id="im-type"
                                  className="bg-secondary/50 border-border"
                                >
                                  <SelectValue placeholder="Selecionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {IMMERSION_TYPE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="im-duration">Duração (min)</Label>
                              <Input
                                id="im-duration"
                                type="number"
                                min={1}
                                step={1}
                                placeholder="30"
                                value={formDuration}
                                onChange={(e) => setFormDuration(e.target.value)}
                                className="bg-secondary/50 border-border"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="im-title">Título</Label>
                            <Input
                              id="im-title"
                              placeholder="Nome do anime, podcast..."
                              value={formTitle}
                              onChange={(e) => setFormTitle(e.target.value)}
                              className="bg-secondary/50 border-border"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="im-episode">Episódio / Detalhe</Label>
                              <Input
                                id="im-episode"
                                placeholder="EP 12, Cap 40..."
                                value={formEpisode}
                                onChange={(e) => setFormEpisode(e.target.value)}
                                className="bg-secondary/50 border-border"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="im-date">Data</Label>
                              <Input
                                id="im-date"
                                type="date"
                                value={formLoggedAt}
                                onChange={(e) => setFormLoggedAt(e.target.value)}
                                className="bg-secondary/50 border-border"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Compreensão (1 a 5 estrelas)</Label>
                            <div className="flex gap-2" role="radiogroup" aria-label="Compreensão">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <Button
                                  key={level}
                                  type="button"
                                  variant={
                                    formComprehension === level ? "default" : "outline"
                                  }
                                  className={cn(
                                    "flex-1 h-10",
                                    formComprehension === level &&
                                      "bg-[var(--gold)] text-white hover:bg-[var(--gold)]/90",
                                  )}
                                  onClick={() =>
                                    setFormComprehension(
                                      formComprehension === level ? null : level,
                                    )
                                  }
                                  disabled={isSubmitting}
                                >
                                  <Star
                                    className={cn(
                                      "h-4 w-4 mr-1",
                                      formComprehension === level && "fill-current",
                                    )}
                                  />
                                  {level}
                                </Button>
                              ))}
                            </div>
                            {formComprehension !== null && (
                              <p className="text-[11px] text-muted-foreground">
                                Equivale a {formComprehension * 20}% de compreensão
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="im-notes">Notas</Label>
                            <Textarea
                              id="im-notes"
                              placeholder="O que você aprendeu? Dificuldades?"
                              className="bg-secondary/50 border-border min-h-[80px]"
                              value={formNotes}
                              onChange={(e) => setFormNotes(e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              "Salvar Sessão"
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    <LoadingSessionRows />
                  ) : allLogs.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-medium text-foreground">
                        Nenhuma sessão registrada ainda
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        Comece a registrar suas sessões de imersão para acompanhar
                        seu progresso e stats semanais.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsAddingSession(true)}
                        className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Primeira sessão
                      </Button>
                    </div>
                  ) : (
                    allLogs.map((session, index) => {
                      const Icon = typeIcons[session.type]
                      const colorClass = typeColors[session.type]
                      const stars = comprehensionToStars(session.comprehension)
                      const loggedLabel = new Date(
                        session.loggedAt,
                      ).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                      return (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center shrink-0",
                                colorClass,
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {session.title}
                                </span>
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  {IMMERSION_TYPE_LABELS[session.type]}
                                </Badge>
                                {session.episode && (
                                  <Badge variant="secondary" className="text-[10px] shrink-0">
                                    {session.episode}
                                  </Badge>
                                )}
                              </div>
                              {session.notes ? (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {session.notes}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground/60 italic">
                                  Sem notas
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[11px] text-muted-foreground">
                                  {loggedLabel}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {session.durationMinutes}min
                              </div>
                              {stars > 0 ? (
                                <div className="flex items-center justify-end gap-0.5 mt-1">
                                  {[1, 2, 3, 4, 5].map((level) => (
                                    <Star
                                      key={level}
                                      className={cn(
                                        "w-3 h-3",
                                        level <= stars
                                          ? "fill-[var(--gold)] text-[var(--gold)]"
                                          : "text-secondary",
                                      )}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-1 text-[10px] text-muted-foreground/50">
                                  s/avaliação
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-[var(--teal)]/10 to-[var(--teal)]/5 border-[var(--teal)]/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--teal)]/20 flex items-center justify-center shrink-0">
                      <Mic className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        Dica: Shadowing
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Tente repetir o que ouve em tempo real. Isso melhora sua
                        pronúncia e fluência natural.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[var(--teal)]/30 text-[var(--teal)] hover:bg-[var(--teal)]/10"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Iniciar Shadowing
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              {isLoading ? (
                <LoadingTypeBreakdown />
              ) : typeBreakdown.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[var(--neon-blue)]" />
                      Tipos de Input
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Registre sessões para ver a distribuição por tipo de atividade.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[var(--neon-blue)]" />
                      Tipos de Input
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {typeBreakdown.map((item) => (
                      <div key={item.type} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-japanese",
                                typeColors[item.apiType] || "text-muted-foreground",
                              )}
                            >
                              {item.kanji}
                            </span>
                            <span className="text-foreground">{item.type}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {item.percentage}%
                          </span>
                        </div>
                        <Progress value={item.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </DashboardShell>
  )
}
