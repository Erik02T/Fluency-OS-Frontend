"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Flame,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Brain,
  BookOpen,
  Languages,
  Headphones,
  Calendar,
  ChevronRight,
  Play,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardShell } from "@/components/layout"
import { getDashboardSummary, type DashboardSummaryDto } from "@/lib/dashboard-api"
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

// Progress data
const jlptProgress = [
  { level: "N5", progress: 100, kanji: 80, vocab: 650, color: "bg-emerald-500" },
  { level: "N4", progress: 72, kanji: 168, vocab: 1200, color: "bg-[var(--teal)]" },
  { level: "N3", progress: 15, kanji: 45, vocab: 300, color: "bg-[var(--gold)]" },
]

// Daily tasks
const dailyTasks = [
  { task: "30 reviews de kanji", completed: true, kanji: "字" },
  { task: "20 reviews de vocabulário", completed: true, kanji: "語" },
  { task: "Estudar 5 gramáticas novas", completed: false, kanji: "文" },
  { task: "30 minutos de imersão", completed: false, kanji: "聴" },
  { task: "Sentence mining (10 frases)", completed: false, kanji: "句" },
]

// Recent kanji
const recentKanji = [
  { kanji: "電", reading: "でん", meaning: "eletricidade", level: "N4" },
  { kanji: "話", reading: "はなし", meaning: "fala, conversa", level: "N4" },
  { kanji: "食", reading: "た・べる", meaning: "comer", level: "N5" },
  { kanji: "飲", reading: "の・む", meaning: "beber", level: "N5" },
  { kanji: "見", reading: "み・る", meaning: "ver", level: "N5" },
  { kanji: "聞", reading: "き・く", meaning: "ouvir", level: "N4" },
]

// Study heatmap data (last 12 weeks)
const generateHeatmapData = () => {
  const data = []
  for (let week = 0; week < 12; week++) {
    for (let day = 0; day < 7; day++) {
      data.push({
        week,
        day,
        value: Math.floor(Math.random() * 5),
      })
    }
  }
  return data
}

const heatmapData = generateHeatmapData()

export default function DashboardPage() {
  const router = useRouter()
  const [summary, setSummary] = React.useState<DashboardSummaryDto | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(true)
  const [summaryError, setSummaryError] = React.useState<string | null>(null)

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

  const statsCards = React.useMemo(
    () => [
      {
        title: "Streak Atual",
        value: isLoadingSummary ? "--" : String(summary?.currentStreak ?? 0),
        suffix: "dias",
        icon: Flame,
        change: `Recorde: ${summary?.longestStreak ?? 0} dias`,
        changeType: "positive" as const,
        color: "from-orange-500/20 to-red-500/20",
        iconColor: "text-orange-500",
        kanji: "継",
        href: "/dashboard/analytics",
      },
      {
        title: "Kanji Aprendidos",
        value: isLoadingSummary ? "--" : String(summary?.kanjiStudied ?? 0),
        suffix: "itens",
        icon: Languages,
        change: `${summary?.kanjiMastered ?? 0} dominados`,
        changeType: "positive" as const,
        color: "from-[var(--gold)]/20 to-amber-500/20",
        iconColor: "text-[var(--gold)]",
        kanji: "字",
        href: "/dashboard/kanji",
      },
      {
        title: "Reviews Pendentes",
        value: isLoadingSummary ? "--" : String(summary?.dueReviews ?? 0),
        suffix: "cards",
        icon: Zap,
        change: `${summary?.totalReviews ?? 0} revisões totais`,
        changeType: "neutral" as const,
        color: "from-[var(--torii-red)]/20 to-rose-500/20",
        iconColor: "text-[var(--torii-red)]",
        kanji: "復",
        href: "/dashboard/review",
      },
      {
        title: "Precisão Geral",
        value: isLoadingSummary ? "--" : String(summary?.accuracyRate ?? 0),
        suffix: "%",
        icon: Clock,
        change: formatLastReview(summary?.lastReviewAt ?? null),
        changeType: "positive" as const,
        color: "from-[var(--neon-blue)]/20 to-blue-500/20",
        iconColor: "text-[var(--neon-blue)]",
        kanji: "時",
        href: "/dashboard/review",
      },
    ],
    [isLoadingSummary, summary],
  )

  const quickActions = React.useMemo(
    () => [
      {
        title: "Iniciar Review",
        description: `${summary?.dueReviews ?? 0} cards pendentes`,
        icon: Zap,
        kanji: "復",
        color: "bg-[var(--torii-red)]",
        href: "/dashboard/review",
      },
      {
        title: "Estudar Kanji",
        description: `${summary?.favoriteKanjis ?? 0} favoritos`,
        icon: Languages,
        kanji: "字",
        color: "bg-[var(--gold)]",
        href: "/dashboard/kanji",
      },
      {
        title: "AI Tutor",
        description: "Tire suas dúvidas",
        icon: Brain,
        kanji: "智",
        color: "bg-[var(--neon-blue)]",
        href: "/dashboard/ai",
      },
      {
        title: "Imersão",
        description: "Registrar sessão",
        icon: Headphones,
        kanji: "聴",
        color: "bg-[var(--teal)]",
        href: "/dashboard/immersion",
      },
    ],
    [summary?.dueReviews, summary?.favoriteKanjis],
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
            <CardContent className="py-3 text-sm text-red-400">{summaryError}</CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer"
              onClick={() => router.push(stat.href)}
            >
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
                        <span className={cn("font-japanese text-lg", stat.iconColor)}>
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
                          <span className="text-sm text-muted-foreground">
                            {stat.suffix}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">
                      {stat.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - JLPT Progress & Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickActions.map((action) => (
                      <motion.button
                        key={action.title}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(action.href)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 transition-colors group"
                      >
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            action.color
                          )}
                        >
                          <span className="font-japanese text-xl text-white">
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
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* JLPT Progress */}
            <motion.div variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-[var(--torii-red)]" />
                      Progresso JLPT
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Meta: N3
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jlptProgress.map((level) => (
                    <div key={level.level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <span className="font-mono text-sm font-bold text-foreground">
                              {level.level}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {level.progress}% completo
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {level.kanji} kanji · {level.vocab} vocab
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">
                          {level.progress}%
                        </span>
                      </div>
                      <Progress
                        value={level.progress}
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Study Heatmap */}
            <motion.div variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[var(--teal)]" />
                      Atividade de Estudo
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      Últimas 12 semanas
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1">
                    {Array.from({ length: 12 }).map((_, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                          const cellData = heatmapData.find(
                            (d) => d.week === weekIndex && d.day === dayIndex
                          )
                          const intensity = cellData?.value || 0
                          return (
                            <motion.div
                              key={dayIndex}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: (weekIndex * 7 + dayIndex) * 0.01,
                              }}
                              className={cn(
                                "w-3 h-3 rounded-sm",
                                intensity === 0 && "bg-secondary",
                                intensity === 1 && "bg-[var(--torii-red)]/20",
                                intensity === 2 && "bg-[var(--torii-red)]/40",
                                intensity === 3 && "bg-[var(--torii-red)]/60",
                                intensity === 4 && "bg-[var(--torii-red)]/80"
                              )}
                              title={`${intensity} sessões`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                    <span>Menos</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-sm bg-secondary" />
                      <div className="w-3 h-3 rounded-sm bg-[var(--torii-red)]/20" />
                      <div className="w-3 h-3 rounded-sm bg-[var(--torii-red)]/40" />
                      <div className="w-3 h-3 rounded-sm bg-[var(--torii-red)]/60" />
                      <div className="w-3 h-3 rounded-sm bg-[var(--torii-red)]/80" />
                    </div>
                    <span>Mais</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Daily Tasks & Recent Kanji */}
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
                      2/5 completas
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dailyTasks.map((task, index) => (
                    <motion.div
                      key={index}
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
                          {task.kanji}
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

            {/* Recent Kanji */}
            <motion.div variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Languages className="h-4 w-4 text-[var(--gold)]" />
                      Kanji Recentes
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => router.push("/dashboard/kanji")}
                    >
                      Ver todos
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {recentKanji.map((item, index) => (
                      <motion.div
                        key={item.kanji}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => router.push("/dashboard/kanji")}
                        className="flex flex-col items-center p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/50 cursor-pointer transition-colors group"
                      >
                        <span className="font-japanese text-2xl text-foreground group-hover:text-[var(--gold)] transition-colors">
                          {item.kanji}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono mt-1">
                          {item.reading}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[8px] px-1 py-0 mt-1"
                        >
                          {item.level}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Recommendation */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-[var(--neon-blue)]/10 to-[var(--neon-blue)]/5 border-[var(--neon-blue)]/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--neon-blue)]/20 flex items-center justify-center shrink-0">
                      <Brain className="h-5 w-5 text-[var(--neon-blue)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        Recomendação AI
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Baseado no seu progresso, recomendo focar nos kanji de N4
                        relacionados a verbos de ação. Você já dominou 72% deles!
                      </p>
                      <Button
                        size="sm"
                        onClick={() => router.push("/dashboard/ai")}
                        className="bg-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/90 text-white text-xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Começar Sessão
                      </Button>
                    </div>
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
