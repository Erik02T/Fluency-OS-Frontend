"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  BookOpen,
  Edit3,
  Layers,
  RefreshCcw,
  Shield,
  Sparkles,
  Star,
  Volume2,
} from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  getKanjiDetail,
  studyKanji,
  sendKanjiToReview,
  type KanjiDetailResponseDto,
} from "@/lib/kanji-api"

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Erro inesperado ao carregar o detalhe do kanji."
}

function LoadingState() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <Card className="bg-card/60 border-border/50">
        <CardContent className="p-6 animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-muted/50" />
          <div className="h-28 w-28 rounded-3xl bg-muted/50" />
          <div className="h-6 w-3/4 rounded bg-muted/50" />
          <div className="h-4 w-1/2 rounded bg-muted/50" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-24 rounded-2xl bg-muted/50" />
            <div className="h-24 rounded-2xl bg-muted/50" />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <div className="h-40 rounded-3xl bg-muted/50 animate-pulse" />
        <div className="h-40 rounded-3xl bg-muted/50 animate-pulse" />
      </div>
    </div>
  )
}

export default function KanjiDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [kanji, setKanji] = React.useState<KanjiDetailResponseDto | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isStudying, setIsStudying] = React.useState(false)
  const [isReviewing, setIsReviewing] = React.useState(false)
  const [actionFeedback, setActionFeedback] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!id) {
      setErrorMessage("Identificador do kanji ausente na rota.")
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    let isActive = true

    async function loadDetail() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const payload = await getKanjiDetail(id, { signal: controller.signal })
        if (isActive) {
          setKanji(payload)
        }
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          setKanji(null)
          setErrorMessage(getErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadDetail()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [id])

  async function handleStudy() {
    if (!kanji || isStudying) return
    setIsStudying(true)
    setActionError(null)
    setActionFeedback(null)
    try {
      await studyKanji(kanji.id)
      setActionFeedback("Kanji adicionado ao estudo")
      router.push("/dashboard/study")
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setIsStudying(false)
    }
  }

  async function handleReview() {
    if (!kanji || isReviewing) return
    setIsReviewing(true)
    setActionError(null)
    setActionFeedback(null)
    try {
      await sendKanjiToReview(kanji.id)
      setActionFeedback("Kanji enviado para review")
      router.push("/dashboard/review")
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <DashboardShell
      title="Detalhe do Kanji"
      subtitle="Dados completos carregados do backend"
      kanji={kanji?.character ?? "字"}
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/kanji">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          {kanji && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/kanji/admin?id=${kanji.id}`}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/dashboard/kanji/admin">
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          {kanji && (
            <>
              <Button
                variant="outline"
                disabled={isStudying || isReviewing}
                onClick={handleStudy}
              >
                {isStudying ? "..." : "Estudar"}
              </Button>
              <Button
                variant="outline"
                disabled={isStudying || isReviewing}
                onClick={handleReview}
              >
                {isReviewing ? "..." : "Enviar para Review"}
              </Button>
            </>
          )}
        </div>

        {actionFeedback && (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4 text-sm text-emerald-500">
              {actionFeedback}
            </CardContent>
          </Card>
        )}

        {actionError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              {actionError}
            </CardContent>
          </Card>
        )}

        {errorMessage && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-destructive">Não foi possível carregar o detalhe</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <LoadingState />
        ) : kanji ? (
          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <Card className="bg-card/60 backdrop-blur border-border/50 overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{kanji.unicodeCodepoint}</p>
                    <h1 className="text-3xl font-semibold text-foreground mt-2">{kanji.character}</h1>
                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                      Dados carregados via GET /kanji/:id com relacionamentos completos.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{kanji.jlpt}</Badge>
                    <Badge variant="outline">Traços {kanji.strokes}</Badge>
                    <Badge variant="outline">Grade {kanji.grade || "—"}</Badge>
                    <Badge variant="outline">Frequência #{kanji.frequency || "—"}</Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <HeroStat label="Leituras Onyomi" value={kanji.readings.onyomi.length} icon="音" />
                  <HeroStat label="Leituras Kunyomi" value={kanji.readings.kunyomi.length} icon="訓" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBlock title="Significados" icon={<Sparkles className="h-4 w-4" />}>
                    <div className="flex flex-wrap gap-2">
                      {kanji.meanings.map((meaning) => (
                        <Badge key={`${meaning.meaning}-${meaning.language}`} variant="outline">
                          {meaning.meaning}
                        </Badge>
                      ))}
                    </div>
                  </InfoBlock>

                  <InfoBlock title="Progresso do usuário" icon={<Star className="h-4 w-4" />}>
                    {kanji.userProgress ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">SRS</span>
                          <span className="text-foreground font-medium">
                            {kanji.userProgress.srsLevel}/5
                          </span>
                        </div>
                        <Progress value={kanji.userProgress.srsLevel * 20} className="h-2" />
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Mastered: {kanji.userProgress.isMastered ? "sim" : "não"}</span>
                          <span>Favorito: {kanji.userProgress.isFavorited ? "sim" : "não"}</span>
                          <span>Suspenso: {kanji.userProgress.isSuspended ? "sim" : "não"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum progresso disponível para o usuário autenticado.
                      </p>
                    )}
                  </InfoBlock>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBlock title="Leituras" icon={<BookOpen className="h-4 w-4" />}>
                    <div className="space-y-3">
                      <ReadingLine label="Onyomi" readings={kanji.readings.onyomi} />
                      <ReadingLine label="Kunyomi" readings={kanji.readings.kunyomi} />
                      <ReadingLine label="Nanori" readings={kanji.readings.nanori} />
                    </div>
                  </InfoBlock>

                  <InfoBlock title="Metadados" icon={<Layers className="h-4 w-4" />}>
                    <div className="grid gap-3 text-sm">
                      <MetaLine label="Código Unicode" value={kanji.unicodeCodepoint} />
                      <MetaLine label="Traços" value={String(kanji.strokes)} />
                      <MetaLine label="Frequência" value={String(kanji.frequency || "—")} />
                      <MetaLine label="Grade" value={String(kanji.grade || "—")} />
                    </div>
                  </InfoBlock>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="bg-card/60 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Exemplos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {kanji.examples.length > 0 ? (
                    kanji.examples.map((example) => (
                      <div
                        key={`${example.word}-${example.reading}`}
                        className="rounded-2xl border border-border/50 bg-secondary/20 p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-japanese text-2xl text-foreground">{example.word}</span>
                          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Reproduzir áudio">
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm font-mono text-muted-foreground">{example.reading}</p>
                        <p className="text-sm text-foreground">{example.meaning}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{example.jlpt}</Badge>
                          {example.audioUrl && <span>Áudio disponível</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem exemplos cadastrados.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/60 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Radicais</CardTitle>
                </CardHeader>
                <CardContent>
                  {kanji.radicals.length > 0 ? (
                    <div className="space-y-3">
                      {kanji.radicals.map((radical) => (
                        <div
                          key={`${radical.character}-${radical.name}`}
                          className="rounded-2xl border border-border/50 bg-secondary/20 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-background flex items-center justify-center">
                                <span className="font-japanese text-xl text-[var(--gold)]">{radical.character}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{radical.name}</p>
                                <p className="text-xs text-muted-foreground">{radical.meaning}</p>
                              </div>
                            </div>
                            {radical.isPrimary && (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                Primário
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum radical cadastrado.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="bg-card/60 border-border/50">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-[var(--torii-red)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium text-foreground">Kanji não encontrado</p>
              <p className="text-sm text-muted-foreground">
                O backend retornou vazio para este identificador.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardShell>
  )
}

function HeroStat({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: string
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/20 p-4 flex items-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-background flex items-center justify-center">
        <span className="font-japanese text-lg text-[var(--torii-red)]">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function InfoBlock({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/15 p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

function ReadingLine({
  label,
  readings,
}: {
  label: string
  readings?: Array<{ reading: string; romanization: string; isCommon?: boolean }>
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-1">
        {readings && readings.length > 0
          ? readings.map((reading) => reading.reading).join("、")
          : "—"}
      </p>
    </div>
  )
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}
