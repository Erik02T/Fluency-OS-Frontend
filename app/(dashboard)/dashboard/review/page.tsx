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
  Play,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardShell } from "@/components/layout"
import {
  getReviewQueue,
  createReviewSession,
  submitReviewAnswer,
  endReviewSession,
  getReviewSessionStats,
  abandonReviewSession,
  type ReviewQueueItemDto,
  type ReviewQueueKanjiItemDto,
} from "@/lib/review-api"
import { useReviewStore } from "@/store"

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

function isKanjiItem(item: ReviewQueueKanjiItemDto | Record<string, unknown>): item is ReviewQueueKanjiItemDto {
  return "character" in item
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
  items: ReviewQueueItemDto[]
  isLoading: boolean
  error: string | null
  onStart: () => void
  onReload: () => void
}

function QueueView({ items, isLoading, error, onStart, onReload }: QueueViewProps) {
  const total = items.length

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
                    {total > 0
                      ? `${total} ${total === 1 ? "card pendente" : "cards pendentes"} de revisão`
                      : "Nenhum card pendente agora"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1 text-[var(--torii-red)]" />
                  {total} na fila
                </Badge>
              </div>
            </div>
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

      {/* Preview da Fila */}
      <motion.div variants={itemVariants}>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-[var(--neon-blue)]" />
                Cards na Fila
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={onReload}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
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
                  return (
                    <div
                      key={item.progress_id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
                    >
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <span className="font-japanese text-lg text-foreground">
                          {kanji?.character ?? "字"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {kanji?.meanings.join(", ") ?? "Item"}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {kanji?.readings.onyomi.join("、") || kanji?.readings.kunyomi.join("、") || "—"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Nível {item.srs_level}
                      </Badge>
                    </div>
                  )
                })}
                {items.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    + {items.length - 8} cards na fila...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Botão Iniciar */}
      {!isLoading && items.length > 0 && (
        <motion.div variants={itemVariants}>
          <Button
            onClick={onStart}
            disabled={isLoading}
            className="w-full py-6 bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white text-base font-medium"
          >
            <Play className="h-5 w-5 mr-2" />
            Iniciar Revisão
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
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
  const [showAnswer, setShowAnswer] = React.useState(false)
  const [startTime] = React.useState(() => Date.now())

  const handleAnswer = (quality: number) => {
    const responseTimeMs = Date.now() - startTime
    onAnswer(quality, responseTimeMs)
  }

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
              <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <span className="font-japanese text-6xl text-foreground">
                  {kanji?.character ?? "字"}
                </span>
              </div>

              {!showAnswer ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tente lembrar o significado e as leituras deste kanji.
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
                      {kanji?.meanings.map((m) => (
                        <Badge key={m} variant="secondary" className="text-sm">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Onyomi
                      </p>
                      <p className="text-sm font-mono text-foreground">
                        {kanji?.readings.onyomi.join("、") || "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Kunyomi
                      </p>
                      <p className="text-sm font-mono text-foreground">
                        {kanji?.readings.kunyomi.join("、") || "—"}
                      </p>
                    </div>
                  </div>

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
  const {
    queue,
    currentSession,
    currentIndex,
    progress,
    lastStats,
    isLoading,
    error,
    setQueueFromResponse,
    setCurrentSession,
    syncSessionProgress,
    syncSessionState,
    setLastStats,
    setLoading,
    setError,
    nextCard,
    resetSession,
  } = useReviewStore()

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [view, setView] = React.useState<"queue" | "session" | "results">("queue")

  const loadQueue = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getReviewQueue()
      setQueueFromResponse(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar fila de revisão")
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setQueueFromResponse])

  React.useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  const handleStart = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const session = await createReviewSession({ session_type: "kanji" })
      setCurrentSession(session)
      syncSessionState(session)
      setView("session")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar sessão")
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setCurrentSession, syncSessionState])

  const handleAnswer = React.useCallback(
    async (quality: number, responseTimeMs: number) => {
      if (!currentSession || isSubmitting) return
      const currentItem = queue[currentIndex]
      if (!currentItem) return

      setIsSubmitting(true)
      setError(null)
      try {
        const itemId = (currentItem.item as { id?: string }).id ?? ""
        const response = await submitReviewAnswer(currentSession.id, {
          item_id: itemId,
          item_type: currentItem.item_type,
          answer_quality: quality,
          response_time_ms: responseTimeMs,
        })
        syncSessionProgress(response)

        // Se chegou ao fim da fila, finaliza a sessão
        if (currentIndex + 1 >= queue.length) {
          const ended = await endReviewSession(currentSession.id)
          syncSessionState(ended)
          const stats = await getReviewSessionStats(currentSession.id)
          setLastStats(stats)
          setView("results")
        } else {
          nextCard()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao enviar resposta")
      } finally {
        setIsSubmitting(false)
      }
    },
    [currentSession, isSubmitting, queue, currentIndex, syncSessionProgress, nextCard, setError, syncSessionState, setLastStats],
  )

  const handleAbandon = React.useCallback(async () => {
    if (!currentSession) return
    setLoading(true)
    setError(null)
    try {
      await abandonReviewSession(currentSession.id)
      resetSession()
      setView("queue")
      void loadQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao abandonar sessão")
    } finally {
      setLoading(false)
    }
  }, [currentSession, setLoading, setError, resetSession, loadQueue])

  const handleRestart = React.useCallback(() => {
    resetSession()
    setView("queue")
    void loadQueue()
  }, [resetSession, loadQueue])

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
            items={queue}
            isLoading={isLoading}
            error={error}
            onStart={handleStart}
            onReload={loadQueue}
          />
        )}

        {view === "session" && currentItem && (
          <SessionView
            key={`session-${currentItem.progress_id}`}
            item={currentItem}
            index={currentIndex}
            total={queue.length}
            progress={progress}
            isSubmitting={isSubmitting}
            error={error}
            onAnswer={handleAnswer}
            onAbandon={handleAbandon}
          />
        )}

        {view === "results" && lastStats && (
          <ResultsView
            key="results"
            stats={lastStats}
            onRestart={handleRestart}
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  )
}
