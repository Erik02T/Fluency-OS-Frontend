"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Zap,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Brain,
  Clock,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardShell } from "@/components/layout"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import {
  getReviewQueue,
  getReviewErrorMessage,
  createReviewSession,
  getReviewHistory,
  getReviewSession,
  submitReviewAnswer,
  endReviewSession,
  getReviewSessionStats,
  abandonReviewSession,
  type ReviewQueueItemDto,
  type ReviewQueueResponseDto,
  type ReviewQueueKanjiItemDto,
  type ReviewQueueVocabularyItemDto,
  type ReviewSessionResponseDto,
} from "@/lib/review-api"
import { invalidateReviewQueue, useReviewQueueVersion, useReviewStore } from "@/store"

// Variantes de animação
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function isKanjiItem(item: ReviewQueueItemDto["item"]): item is ReviewQueueKanjiItemDto {
  return "character" in item
}

function isVocabularyItem(item: ReviewQueueItemDto["item"]): item is ReviewQueueVocabularyItemDto {
  return "word" in item
}

function formatAnswerTime(ms: number | null | undefined): string {
  if (!ms) return "--"
  return `${Math.round(ms / 1000)}s`
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "--"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

interface QueueViewProps {
  queue: ReviewQueueResponseDto | null
  isLoading: boolean
  error: string | null
  onStart: (sessionType: "kanji" | "vocabulary") => void
  onReload: () => void
}

function QueueView({ queue, isLoading, error, onStart, onReload }: QueueViewProps) {
  const items = queue?.items ?? []
  const total = queue?.total_due
  const kanjiCount = queue?.by_type.kanji ?? 0
  const vocabCount = queue?.by_type.vocabulary ?? 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Hero da Fila */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-[var(--torii-red)]/15 to-[var(--torii-red)]/5 border-[var(--torii-red)]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--torii-red)]/20 flex items-center justify-center">
                  <span className="font-japanese text-3xl text-[var(--torii-red)]">復</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Sessão de Revisão</h2>
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "Carregando fila…" : total === undefined ? "Fila indisponível" : total > 0
                      ? `${total} ${total === 1 ? "card pendente" : "cards pendentes"} de revisão`
                      : "Nenhum card pendente agora"}
                  </p>
                  {!isLoading && total !== undefined && total > 0 && (
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        字 {kanjiCount}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        語 {vocabCount}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1 text-[var(--torii-red)]" />
                  {isLoading || total === undefined ? "—" : `${total} na fila`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent role="alert" className="py-3 text-sm text-red-400">{error}</CardContent>
          </Card>
        </motion.div>
      )}

      {/* Preview da Fila */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-[var(--neon-blue)]" />
                Cards na Fila
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" disabled={isLoading} onClick={onReload}>
                <RotateCcw className="h-3 w-3 mr-1" />
                {error ? "Tentar novamente" : "Atualizar"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !queue ? null : total === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                  <Check className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Você está em dia! Nenhum card vencido para revisar.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReload}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Verificar novamente
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {items.slice(0, 8).map((item) => {
                  const kanji = isKanjiItem(item.item) ? item.item : null
                  const vocab = isVocabularyItem(item.item) ? item.item : null
                  return (
                    <div
                      key={item.progress_id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
                    >
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <span lang="ja" className="font-japanese text-lg text-foreground">
                          {kanji?.character ?? (vocab ? vocab.word.charAt(0) : "字")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {vocab && (
                            <span lang="ja" className="font-japanese text-sm font-semibold text-foreground shrink-0">
                              {vocab.word}
                            </span>
                          )}
                          <p className="text-sm font-medium text-foreground truncate">
                            {(kanji?.meanings.join(", ") ?? vocab?.meanings.join(", ") ?? "Item")}
                          </p>
                        </div>
                        <p lang="ja" className="font-japanese text-[10px] text-muted-foreground">
                          {kanji?.readings.onyomi.join("、") || kanji?.readings.kunyomi.join("、") || (vocab?.reading ?? "—")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {item.item_type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Nível {item.srs_level}
                      </Badge>
                    </div>
                  )
                })}
                {(total ?? 0) > 8 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    + {(total ?? 0) - 8} cards na fila…
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Botões Iniciar por Tipo */}
      {!isLoading && total !== undefined && total > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kanjiCount > 0 && (
              <Button
                onClick={() => onStart("kanji")}
                disabled={isLoading}
                className="w-full py-5 bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white text-base font-medium"
              >
                <span className="font-japanese text-xl mr-2">字</span>
                Revisar Kanji ({kanjiCount})
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {vocabCount > 0 && (
              <Button
                onClick={() => onStart("vocabulary")}
                disabled={isLoading}
                className="w-full py-5 bg-[var(--teal)] hover:bg-[var(--teal)]/90 text-white text-base font-medium"
              >
                <span className="font-japanese text-xl mr-2">語</span>
                Revisar Vocabulário ({vocabCount})
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

interface SessionViewProps {
  item: ReviewQueueItemDto
  index: number
  total: number
  progress: {
    reviewed: number
    total: number
    correct: number
    incorrect: number
  }
  isSubmitting: boolean
  error: string | null
  onAnswer: (quality: number, responseTimeMs: number) => void
  onAbandon: () => void
}

function SessionView({
  item,
  index,
  total,
  progress,
  isSubmitting,
  error,
  onAnswer,
  onAbandon,
}: SessionViewProps) {
  const kanji = isKanjiItem(item.item) ? item.item : null
  const vocab = isVocabularyItem(item.item) ? item.item : null
  const [showAnswer, setShowAnswer] = React.useState(false)
  const [startTime] = React.useState(() => Date.now())

  const handleAnswer = (quality: number) => {
    const responseTimeMs = Date.now() - startTime
    onAnswer(quality, responseTimeMs)
  }

  const prompt = vocab
    ? "Tente lembrar o significado desta palavra."
    : "Tente lembrar o significado e as leituras deste kanji."

  return (
    <motion.div
      key={item.progress_id}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Barra de Progresso */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Card {index + 1} de {total}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Nível {item.srs_level}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {item.item_type}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-500" />
                  {progress.correct}
                </span>
                <span className="flex items-center gap-1">
                  <X className="h-3 w-3 text-red-500" />
                  {progress.incorrect}
                </span>
              </div>
            </div>
            <Progress
              value={total > 0 ? ((index + 1) / total) * 100 : 0}
              className="h-2"
            />
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-3 text-sm text-red-400">{error}</CardContent>
          </Card>
        </motion.div>
      )}

      {/* Card de Revisão */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              {kanji ? (
                <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                  <span lang="ja" className="font-japanese text-6xl text-foreground">
                    {kanji.character}
                  </span>
                </div>
              ) : (
                <div className="min-w-[220px] max-w-full px-8 py-4 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                  <span lang="ja" className="font-japanese text-5xl text-foreground whitespace-nowrap">
                    {vocab?.word ?? "復"}
                  </span>
                </div>
              )}

              {!showAnswer ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {prompt}
                  </p>
                  <Button
                    onClick={() => setShowAnswer(true)}
                    className="bg-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/90 text-white"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Mostrar Resposta
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 w-full max-w-md">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Significados
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(kanji?.meanings ?? vocab?.meanings ?? []).map((m) => (
                        <Badge key={m} variant="secondary" className="text-sm">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {vocab?.reading && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Leitura
                      </p>
                      <p lang="ja" className="font-japanese text-sm text-foreground">
                        {vocab.reading}
                      </p>
                    </div>
                  )}

                  {kanji && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Onyomi
                        </p>
                        <p lang="ja" className="font-japanese text-sm text-foreground">
                          {kanji.readings.onyomi.join("、") || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Kunyomi
                        </p>
                        <p lang="ja" className="font-japanese text-sm text-foreground">
                          {kanji.readings.kunyomi.join("、") || "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-3">
                      Como você se saiu?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(0)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Não lembrei
                      </Button>
                      <Button
                        variant="outline"
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(1)}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Errei
                      </Button>
                      <Button
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(2)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Acertei
                      </Button>
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-500/90 text-white"
                        disabled={isSubmitting}
                        onClick={() => handleAnswer(3)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Fácil
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ações */}
      <motion.div variants={itemVariants} className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onAbandon}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 mr-1" />
          Abandonar sessão
        </Button>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatAnswerTime(0)}
        </span>
      </motion.div>
    </motion.div>
  )
}

interface ResultsViewProps {
  stats: {
    total_items: number
    reviewed_items: number
    correct_items: number
    incorrect_items: number
    accuracy_rate: number
    duration_seconds: number
    mastered_count: number
  }
  onRestart: () => void
}

function ResultsView({ stats, onRestart }: ResultsViewProps) {
  const accuracy = stats.accuracy_rate ?? 0
  const accuracyColor =
    accuracy >= 80 ? "text-emerald-500" : accuracy >= 50 ? "text-[var(--gold)]" : "text-red-500"

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Resultado Hero */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Sessão Concluída!
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Você revisou {stats.reviewed_items} cards em {formatDuration(stats.duration_seconds)}.
            </p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className={`text-4xl font-bold ${accuracyColor}`}>{accuracy}%</p>
                <p className="text-xs text-muted-foreground mt-1">Precisão</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-emerald-500">{stats.correct_items}</p>
                <p className="text-xs text-muted-foreground mt-1">Acertos</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-red-500">{stats.incorrect_items}</p>
                <p className="text-xs text-muted-foreground mt-1">Erros</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-[var(--gold)]">{stats.mastered_count}</p>
                <p className="text-xs text-muted-foreground mt-1">Dominados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ações */}
      <motion.div variants={itemVariants} className="flex justify-center gap-3">
        <Button
          onClick={onRestart}
          className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Nova Revisão
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default function ReviewPage() {
  const { user, isInitializing } = useAdminAuth()
  if (!user || isInitializing) {
    return <DashboardShell title="Revisão" kanji="復">
      <p role="status" className="text-sm text-muted-foreground">
        {isInitializing ? "Restaurando sua sessão..." : "Entre para consultar suas revisões."}
      </p>
    </DashboardShell>
  }
  return <ReviewContent key={user.id} />
}

function ReviewContent() {
  const {
    queue,
    currentSession,
    currentIndex,
    progress,
    lastStats,
    error,
    syncSessionProgress,
    syncSessionState,
    setQueue,
    setCurrentIndex,
    setLastStats,
    setError,
    nextCard,
    resetSession,
  } = useReviewStore()

  const queueVersion = useReviewQueueVersion()
  const [dueQueue, setDueQueue] = React.useState<ReviewQueueResponseDto | null>(null)
  const [isLoadingQueue, setIsLoadingQueue] = React.useState(true)
  const [queueError, setQueueError] = React.useState<string | null>(null)
  const [isRestoring, setIsRestoring] = React.useState(true)
  const [restoreError, setRestoreError] = React.useState<string | null>(null)
  const [restoreVersion, retryRestore] = React.useReducer((version: number) => version + 1, 0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const operationInFlight = React.useRef(false)
  const sessionController = React.useRef<AbortController | null>(null)
  const [view, setView] = React.useState<"queue" | "session" | "results">("queue")
  const [statsError, setStatsError] = React.useState<string | null>(null)
  const [statsVersion, retryStats] = React.useReducer((version: number) => version + 1, 0)

  const showSession = React.useCallback((session: ReviewSessionResponseDto) => {
    const answered = new Set(session.answers?.map((answer) => `${answer.item_type}:${answer.item_id}`))
    setQueue((session.cards ?? []).filter((card) => !answered.has(`${card.item_type}:${card.item.id}`)))
    setCurrentIndex(0)
    syncSessionState(session)
    setView("session")
  }, [setQueue, setCurrentIndex, syncSessionState])

  React.useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    sessionController.current = controller
    resetSession()
    setIsRestoring(true)
    setRestoreError(null)

    async function restoreSession() {
      try {
        const history = await getReviewHistory({ status: "in_progress", perPage: 1 }, { signal })
        const active = history.data[0]
        if (!active || signal.aborted) return
        const session = await getReviewSession(active.id, { signal })
        if (!signal.aborted && session.status === "in_progress") showSession(session)
      } catch (error) {
        if (!signal.aborted) {
          setRestoreError(getReviewErrorMessage(error, "Não foi possível verificar se há uma sessão em andamento."))
        }
      } finally {
        if (!signal.aborted) setIsRestoring(false)
      }
    }
    void restoreSession()
    return () => controller.abort()
  }, [resetSession, restoreVersion, showSession])

  React.useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    setIsLoadingQueue(true)
    setQueueError(null)
    getReviewQueue({ signal }).then(
      (response) => {
        if (!signal.aborted) setDueQueue(response)
      },
      (error: unknown) => {
        if (signal.aborted) return
        setDueQueue(null)
        setQueueError(getReviewErrorMessage(error, "Não foi possível atualizar a fila de revisão."))
      },
    ).finally(() => {
      if (!signal.aborted) setIsLoadingQueue(false)
    })
    return () => controller.abort()
  }, [queueVersion])

  const completedId = view === "results" ? currentSession?.id : undefined
  React.useEffect(() => {
    if (!completedId) return
    const controller = new AbortController()
    const { signal } = controller
    setStatsError(null)
    getReviewSessionStats(completedId, { signal }).then(
      (stats) => {
        if (!signal.aborted) setLastStats(stats)
      },
      (error: unknown) => {
        if (!signal.aborted) setStatsError(getReviewErrorMessage(error, "Não foi possível carregar as estatísticas da sessão."))
      },
    )
    return () => controller.abort()
  }, [completedId, setLastStats, statsVersion])

  async function runSessionOperation(
    operation: (signal: AbortSignal) => Promise<void>,
    failure: string,
  ) {
    const signal = sessionController.current?.signal
    if (!signal || signal.aborted || operationInFlight.current) return
    operationInFlight.current = true
    setIsSubmitting(true)
    setError(null)
    try {
      await operation(signal)
    } catch (error) {
      if (!signal.aborted) setError(getReviewErrorMessage(error, failure))
    } finally {
      operationInFlight.current = false
      if (!signal.aborted) setIsSubmitting(false)
    }
  }

  function handleReload() {
    setError(null)
    if (restoreError) retryRestore()
    invalidateReviewQueue()
  }

  function handleStart(sessionType: "kanji" | "vocabulary") {
    if (isRestoring || restoreError) return
    return runSessionOperation(async (signal) => {
      const session = await createReviewSession({ session_type: sessionType }, { signal })
      if (!signal.aborted) showSession(session)
    }, "Não foi possível iniciar a sessão.")
  }

  async function finishSession(sessionId: string, signal: AbortSignal) {
    const ended = await endReviewSession(sessionId, { signal })
    if (signal.aborted) return
    syncSessionState(ended)
    setLastStats(null)
    setView("results")
  }

  function handleFinish() {
    if (!currentSession) return
    return runSessionOperation(
      (signal) => finishSession(currentSession.id, signal),
      "Não foi possível encerrar a sessão. Tente novamente.",
    )
  }

  function handleAnswer(quality: number, responseTimeMs: number) {
    const currentItem = queue[currentIndex]
    const itemId = currentItem?.item.id
    if (!currentSession || !currentItem || typeof itemId !== "string") return
    return runSessionOperation(async (signal) => {
      const response = await submitReviewAnswer(currentSession.id, {
        item_id: itemId,
        item_type: currentItem.item_type,
        answer_quality: quality,
        response_time_ms: responseTimeMs,
      }, { signal })
      if (signal.aborted) return
      syncSessionProgress(response)
      nextCard()
      invalidateReviewQueue()
      if (currentIndex + 1 === queue.length) {
        try {
          await finishSession(currentSession.id, signal)
        } catch (error) {
          if (!signal.aborted) {
            const message = getReviewErrorMessage(error, "Tente encerrar a sessão novamente.")
            setError(`Resposta registrada. ${message}`)
          }
        }
      }
    }, "Não foi possível enviar a resposta. Tente novamente.")
  }

  function handleAbandon() {
    if (!currentSession) return
    return runSessionOperation(async (signal) => {
      await abandonReviewSession(currentSession.id, { signal })
      if (signal.aborted) return
      resetSession()
      setView("queue")
      invalidateReviewQueue()
    }, "Não foi possível abandonar a sessão. Tente novamente.")
  }

  function handleRestart() {
    resetSession()
    setView("queue")
    invalidateReviewQueue()
  }

  const currentItem = queue[currentIndex]

  return (
    <DashboardShell
      title="Revisão"
      subtitle="Sessão de revisão SRS"
      kanji="復"
    >
      <AnimatePresence mode="wait">
        {view === "queue" && (
          <QueueView
            key="queue"
            queue={restoreError ? null : dueQueue}
            isLoading={isLoadingQueue || isRestoring || isSubmitting}
            error={restoreError ?? queueError ?? error}
            onStart={handleStart}
            onReload={handleReload}
          />
        )}

        {view === "session" && currentItem && (
          <SessionView
            key={`session-${currentItem.progress_id}`}
            item={currentItem}
            index={(currentSession?.total_items ?? queue.length) - queue.length + currentIndex}
            total={currentSession?.total_items ?? queue.length}
            progress={progress}
            isSubmitting={isSubmitting}
            error={error}
            onAnswer={handleAnswer}
            onAbandon={handleAbandon}
          />
        )}

        {view === "session" && !currentItem && (
          <div key="finish" className="space-y-3">
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button disabled={isSubmitting} onClick={handleFinish}>Encerrar revisão</Button>
          </div>
        )}

        {view === "results" && (
          <div key="results" className="space-y-4">
            <p role="status" className="text-sm text-muted-foreground">
              {isLoadingQueue ? "Atualizando fila…" : dueQueue
                ? `${dueQueue.total_due} na fila`
                : "Contagem da fila indisponível"}
            </p>
            {lastStats ? (
              <ResultsView stats={lastStats} onRestart={handleRestart} />
            ) : (
              <Card className="bg-card/60 border-border/50">
                <CardContent className="p-6 space-y-3">
                  <h2 className="text-xl font-semibold">Sessão concluída</h2>
                  {statsError ? (
                    <p role="alert" className="text-sm text-destructive">{statsError}</p>
                  ) : (
                    <p role="status" className="text-sm text-muted-foreground">Carregando estatísticas…</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {statsError && <Button onClick={retryStats}>Tentar novamente</Button>}
                    <Button variant="outline" onClick={handleRestart}>Voltar à fila</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  )
}
