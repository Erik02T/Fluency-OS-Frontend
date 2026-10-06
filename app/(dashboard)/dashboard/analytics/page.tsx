"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Flame,
  BookOpen,
  Languages,
  Headphones,
  Brain,
  Star,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  Loader2,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DashboardShell } from "@/components/layout"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  AnalyticsOverviewResponseDto,
  AnalyticsPeriod,
  getAnalyticsOverview,
  type AnalyticsGranularity,
  type ImmersionBreakdownPointDto,
  type StudySeriesPointDto,
} from "@/lib/analytics-api"
import {
  IMMERSION_TYPE_LABELS,
  ImmersionApiType,
} from "@/lib/immersion-api"

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "Erro inesperado ao carregar análises."
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

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function getWeekdayName(date: Date): string {
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][date.getDay()]
}

const IMMERSION_BREAKDOWN_COLORS: Record<string, string> = {
  ANIME: "#e63946",
  DRAMA: "#ec4899",
  PODCAST: "#c9a84c",
  YOUTUBE: "#38bdf8",
  MANGA: "#14b8a6",
  NOVEL: "#10b981",
  VISUAL_NOVEL: "#a855f7",
  GAME: "#6366f1",
  NEWS: "#3b82f6",
  MUSIC: "#d946ef",
  MOVIE: "#f59e0b",
  OTHER: "#64748b",
}

const PIE_CHART_FALLBACK_PALETTE = [
  "#e63946",
  "#c9a84c",
  "#4ecdc4",
  "#667eea",
  "#a855f7",
  "#ec4899",
  "#10b981",
  "#f59e0b",
]

function immersionBreakdownColor(type: string, index: number): string {
  return (
    IMMERSION_BREAKDOWN_COLORS[type] ||
    PIE_CHART_FALLBACK_PALETTE[index % PIE_CHART_FALLBACK_PALETTE.length]
  )
}

interface TransformedStudyPoint {
  name: string
  date: string
  kanji: number
  vocab: number
  grammar: number
  immersion: number
}

function transformSeriesToWeekChartData(
  series: StudySeriesPointDto[],
): TransformedStudyPoint[] {
  if (series.length === 0) return []

  const lastPointDate = series[series.length - 1].date
  const [y, m, d] = lastPointDate.split("-").map(Number)
  const lastDate = new Date(y, m - 1, d)
  const weekStart = startOfWeek(lastDate)

  const weekPoints: TransformedStudyPoint[] = []
  for (let i = 0; i < 7; i++) {
    const cursor = new Date(weekStart)
    cursor.setDate(weekStart.getDate() + i)
    const stamp = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`
    const match = series.find((p) => p.date === stamp)
    weekPoints.push({
      name: getWeekdayName(cursor),
      date: stamp,
      kanji: match ? match.kanjiAdded + match.kanjiReviewed : 0,
      vocab: match ? match.vocabularyAdded + match.vocabularyReviewed : 0,
      grammar: match ? match.grammarStudied : 0,
      immersion: match ? match.immersionMinutes : 0,
    })
  }
  return weekPoints
}

const progressData = [
  { month: "Set", kanji: 120, vocab: 450, grammar: 35 },
  { month: "Out", kanji: 180, vocab: 680, grammar: 52 },
  { month: "Nov", kanji: 245, vocab: 920, grammar: 68 },
  { month: "Dez", kanji: 290, vocab: 1150, grammar: 82 },
  { month: "Jan", kanji: 312, vocab: 1380, grammar: 95 },
]

const jlptProgressData = [
  { subject: "Kanji", N5: 100, N4: 72, N3: 15, fullMark: 100 },
  { subject: "Vocab", N5: 100, N4: 68, N3: 20, fullMark: 100 },
  { subject: "Grammar", N5: 100, N4: 85, N3: 25, fullMark: 100 },
  { subject: "Reading", N5: 95, N4: 60, N3: 10, fullMark: 100 },
  { subject: "Listening", N5: 90, N4: 55, N3: 8, fullMark: 100 },
]

const accuracyData = [
  { name: "Sem 1", kanji: 78, vocab: 82 },
  { name: "Sem 2", kanji: 82, vocab: 85 },
  { name: "Sem 3", kanji: 85, vocab: 88 },
  { name: "Sem 4", kanji: 88, vocab: 91 },
  { name: "Sem 5", kanji: 90, vocab: 89 },
  { name: "Sem 6", kanji: 92, vocab: 92 },
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

function LoadingStatsOverview() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card
          key={i}
          className="bg-card/50 backdrop-blur-sm border-border/50"
        >
          <CardContent className="p-4 space-y-2 animate-pulse">
            <div className="flex items-start justify-between mb-1">
              <div className="w-10 h-10 rounded-xl bg-muted/50" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-7 w-14 rounded" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LoadingChartCard({ height = 300 }: { height?: number }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-44 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton
          className="w-full rounded-lg animate-pulse"
          style={{ height: `${height}px` }}
        />
        <div className="flex items-center justify-center gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function formatHoursOrMinutes(totalMinutes: number): {
  value: string
  changeLabel: string
} {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 1) {
    return {
      value: `${hours}h`,
      changeLabel: hours === 1 ? `${minutes}min` : `+${Math.round(hours * 0.1)}h`,
    }
  }
  return {
    value: `${totalMinutes}m`,
    changeLabel: totalMinutes === 0 ? "-" : "+min",
  }
}

function buildStatsOverview(summary: AnalyticsOverviewResponseDto["summary"]): Array<{
  label: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  kanji: string
  color: string
}> {
  const time = formatHoursOrMinutes(summary.totalImmersionMinutes)
  return [
    {
      label: "Tempo Total",
      value: time.value,
      change: time.changeLabel,
      trend: summary.totalImmersionMinutes > 0 ? "up" : "neutral",
      kanji: "時",
      color: "text-[var(--torii-red)]",
    },
    {
      label: "Kanji Aprendidos",
      value: `${summary.totalKanji}`,
      change: `+${summary.masteredKanji} dom.`,
      trend: summary.totalKanji > 0 ? "up" : "neutral",
      kanji: "字",
      color: "text-[var(--gold)]",
    },
    {
      label: "Vocabulário",
      value: `${summary.totalVocabulary.toLocaleString("pt-BR")}`,
      change: `+${summary.masteredVocabulary} dom.`,
      trend: summary.totalVocabulary > 0 ? "up" : "neutral",
      kanji: "語",
      color: "text-[var(--teal)]",
    },
    {
      label: "Precisão SRS",
      value: summary.accuracyRate !== null ? `${summary.accuracyRate}%` : "-",
      change:
        summary.totalReviews > 0
          ? `${summary.totalReviews.toLocaleString("pt-BR")} rev`
          : "sem dados",
      trend: (summary.accuracyRate ?? 0) >= 80 ? "up" : "neutral",
      kanji: "正",
      color: "text-emerald-500",
    },
    {
      label: "Streak Máximo",
      value: `${summary.longestStreakDays}`,
      change: summary.currentStreakDays > 0 ? `atual ${summary.currentStreakDays}` : "dias",
      trend: summary.currentStreakDays > 0 ? "up" : "neutral",
      kanji: "継",
      color: "text-orange-500",
    },
    {
      label: "Gramática",
      value: `${summary.studiedGrammar}`,
      change: `de ${summary.totalGrammar}`,
      trend: summary.studiedGrammar > 0 ? "up" : "neutral",
      kanji: "文",
      color: "text-[var(--neon-blue)]",
    },
  ]
}

function transformImmersionBreakdown(
  raw: ImmersionBreakdownPointDto[],
): Array<{ name: string; value: number; color: string }> {
  if (raw.length === 0) return []

  const total = raw.reduce((acc, p) => acc + p.totalMinutes, 0)
  if (total === 0) return []

  return raw.map((p, i) => {
    const baseName =
      IMMERSION_TYPE_LABELS[p.type as ImmersionApiType] ?? p.type
    return {
      name: baseName,
      value: Math.round((p.totalMinutes / total) * 100),
      color: immersionBreakdownColor(p.type, i),
    }
  })
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState<AnalyticsPeriod>("30d")
  const [domainFilter, setDomainFilter] = React.useState<string>("all")

  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [overviewData, setOverviewData] =
    React.useState<AnalyticsOverviewResponseDto | null>(null)

  const fetchOverview = React.useCallback(async () => {
    const controller = new AbortController()
    let isActive = true

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const data = await getAnalyticsOverview(
        { period: timeRange, granularity: "day" },
        { signal: controller.signal },
      )

      if (isActive) {
        console.debug("[analytics-page] Overview loaded:", {
          points: data.studyTimeSeries.length,
          immersionTypes: data.immersionBreakdown.length,
        })
        setOverviewData(data)
      }
    } catch (error) {
      if (
        isActive &&
        !(error instanceof DOMException && error.name === "AbortError")
      ) {
        const message = parseApiMessage(getErrorMessage(error))
        console.error("[analytics-page] Failed to fetch analytics:", {
          error,
          message,
        })
        setErrorMessage(message)
        toast({
          title: "Erro ao carregar análises",
          description:
            "Não foi possível carregar os dados analíticos. Tente novamente.",
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
  }, [timeRange])

  React.useEffect(() => {
    void fetchOverview()
  }, [fetchOverview])

  const statsOverview = overviewData
    ? buildStatsOverview(overviewData.summary)
    : []

  const studyTimeData: TransformedStudyPoint[] = overviewData
    ? transformSeriesToWeekChartData(overviewData.studyTimeSeries)
    : []

  const immersionBreakdownForPie = overviewData
    ? transformImmersionBreakdown(overviewData.immersionBreakdown)
    : []

  return (
    <DashboardShell
      title="Analytics"
      subtitle="Acompanhe seu progresso detalhado"
      kanji="析"
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
              <AlertTitle>Erro ao carregar análises</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{errorMessage}</p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void fetchOverview()}
                >
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between">
            <Tabs
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as AnalyticsPeriod)}
            >
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="7d">Semana</TabsTrigger>
                <TabsTrigger value="30d">Mês</TabsTrigger>
                <TabsTrigger value="90d">Trimestre</TabsTrigger>
                <TabsTrigger value="all">Tudo</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="w-[150px] bg-secondary/50 border-border">
                <SelectValue placeholder="Filtrar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="kanji">Kanji</SelectItem>
                <SelectItem value="vocab">Vocabulário</SelectItem>
                <SelectItem value="grammar">Gramática</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          {isLoading ? (
            <LoadingStatsOverview />
          ) : overviewData ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statsOverview.map((stat) => (
                <Card
                  key={stat.label}
                  className="bg-card/50 backdrop-blur-sm border-border/50"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <span
                          className={cn("font-japanese text-lg", stat.color)}
                        >
                          {stat.kanji}
                        </span>
                      </div>
                      {stat.trend === "up" && (
                        <ArrowUp className="h-4 w-4 text-emerald-500" />
                      )}
                      {stat.trend === "down" && (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      )}
                      {stat.trend === "neutral" && (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">
                        {stat.label}
                      </p>
                      <span
                        className={cn(
                          "text-[10px]",
                          stat.trend === "up" && "text-emerald-500",
                          stat.trend === "down" && "text-red-500",
                          stat.trend === "neutral" && "text-muted-foreground",
                        )}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            {isLoading ? (
              <LoadingChartCard />
            ) : (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[var(--torii-red)]" />
                    Tempo de Estudo por Categoria
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      Dados reais
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {studyTimeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={studyTimeData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            opacity={0.3}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{
                              fill: "var(--muted-foreground)",
                              fontSize: 12,
                            }}
                            axisLine={{ stroke: "var(--border)" }}
                          />
                          <YAxis
                            tick={{
                              fill: "var(--muted-foreground)",
                              fontSize: 12,
                            }}
                            axisLine={{ stroke: "var(--border)" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar
                            dataKey="kanji"
                            stackId="a"
                            fill="#e63946"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="vocab"
                            stackId="a"
                            fill="#c9a84c"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="grammar"
                            stackId="a"
                            fill="#4ecdc4"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="immersion"
                            stackId="a"
                            fill="#667eea"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-xs">
                          Sem dados históricos suficientes para exibir o gráfico.
                        </p>
                        <p className="text-[10px] mt-1 opacity-70">
                          Registre sessões de estudo e imersão para começar.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    {[
                      { name: "Kanji", color: "#e63946" },
                      { name: "Vocab", color: "#c9a84c" },
                      { name: "Grammar", color: "#4ecdc4" },
                      { name: "Imersão", color: "#667eea" },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.name}
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
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[var(--gold)]" />
                  Progresso ao Longo do Tempo
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    Estimativa
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData}>
                      <defs>
                        <linearGradient
                          id="colorKanji"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#e63946"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#e63946"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorVocab"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#c9a84c"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#c9a84c"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{
                          fill: "var(--muted-foreground)",
                          fontSize: 12,
                        }}
                        axisLine={{ stroke: "var(--border)" }}
                      />
                      <YAxis
                        tick={{
                          fill: "var(--muted-foreground)",
                          fontSize: 12,
                        }}
                        axisLine={{ stroke: "var(--border)" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="kanji"
                        stroke="#e63946"
                        fillOpacity={1}
                        fill="url(#colorKanji)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="vocab"
                        stroke="#c9a84c"
                        fillOpacity={1}
                        fill="url(#colorVocab)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#e63946]" />
                    <span className="text-xs text-muted-foreground">Kanji</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#c9a84c]" />
                    <span className="text-xs text-muted-foreground">
                      Vocabulário
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-[var(--teal)]" />
                  Progresso por Nível JLPT
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    Estimativa
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      data={jlptProgressData}
                    >
                      <PolarGrid stroke="var(--border)" opacity={0.3} />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                          fill: "var(--muted-foreground)",
                          fontSize: 11,
                        }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{
                          fill: "var(--muted-foreground)",
                          fontSize: 10,
                        }}
                      />
                      <Radar
                        name="N5"
                        dataKey="N5"
                        stroke="#4ecdc4"
                        fill="#4ecdc4"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Radar
                        name="N4"
                        dataKey="N4"
                        stroke="#c9a84c"
                        fill="#c9a84c"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Radar
                        name="N3"
                        dataKey="N3"
                        stroke="#e63946"
                        fill="#e63946"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  {[
                    { name: "N5", color: "#4ecdc4" },
                    { name: "N4", color: "#c9a84c" },
                    { name: "N3", color: "#e63946" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            {isLoading ? (
              <LoadingChartCard />
            ) : (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-[var(--neon-blue)]" />
                    Distribuição de Imersão
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      Dados reais
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    {immersionBreakdownForPie.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={immersionBreakdownForPie}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {immersionBreakdownForPie.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value}%`, "Participação"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Headphones className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-xs">
                          Sem sessões de imersão registradas neste período.
                        </p>
                        <p className="text-[10px] mt-1 opacity-70">
                          Adicione logs de imersão para ver a distribuição.
                        </p>
                      </div>
                    )}
                  </div>
                  {immersionBreakdownForPie.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {immersionBreakdownForPie.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-foreground">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {item.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-500" />
                Evolução da Precisão no SRS
                <Badge variant="outline" className="ml-auto text-[10px]">
                  Estimativa
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                      axisLine={{ stroke: "var(--border)" }}
                    />
                    <YAxis
                      domain={[70, 100]}
                      tick={{
                        fill: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                      axisLine={{ stroke: "var(--border)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="kanji"
                      stroke="#e63946"
                      strokeWidth={2}
                      dot={{ fill: "#e63946", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="vocab"
                      stroke="#c9a84c"
                      strokeWidth={2}
                      dot={{ fill: "#c9a84c", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#e63946]" />
                  <span className="text-xs text-muted-foreground">
                    Precisão Kanji
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#c9a84c]" />
                  <span className="text-xs text-muted-foreground">
                    Precisão Vocab
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardShell>
  )
}
