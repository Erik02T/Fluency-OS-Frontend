"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
} from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { CatalogAudio } from "@/components/catalog/catalog-audio"
import { catalogDetailColumns, catalogSurface } from "@/components/catalog/catalog-presentation"
import { ContentStudyActions } from "@/components/content-study-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { cn } from "@/lib/utils"
import { invalidateReviewQueue } from "@/store"
import {
  getKanjiDetail,
  studyKanji,
  KanjiApiError,
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
    <div className={catalogDetailColumns}>
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
  const params = useParams<{ id: string }>()
  const { user, isInitializing } = useAdminAuth()
  return (
    <KanjiDetail key={JSON.stringify([params?.id, user?.id])} id={params?.id} isInitializing={isInitializing} />
  )
}

function KanjiDetail({ id, isInitializing }: { id?: string; isInitializing: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const returnQuery = new URLSearchParams(params.get("from") ?? "").toString()
  const catalogHref = returnQuery ? `/dashboard/kanji?${returnQuery}` : "/dashboard/kanji"
  const { isAdmin, isAuthenticated } = useAdminAuth()
  const [kanji, setKanji] = React.useState<KanjiDetailResponseDto | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isMissing, setIsMissing] = React.useState(false)
  const [requestVersion, reloadDetail] = React.useReducer((version: number) => version + 1, 0)
  const [isStudying, setIsStudying] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isInitializing) return
    if (!id) {
      setErrorMessage("Identificador do kanji ausente na rota.")
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    let isActive = true

    async function loadDetail(kanjiId: string) {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        setIsMissing(false)

        const payload = await getKanjiDetail(kanjiId, { signal: controller.signal })
        if (isActive) {
          setKanji(payload)
          setIsMissing(!payload)
        }
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          setKanji(null)
          if (error instanceof KanjiApiError && error.status === 404) {
            setIsMissing(true)
          } else {
            setErrorMessage(getErrorMessage(error))
          }
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadDetail(id)

    return () => {
      isActive = false
      controller.abort()
    }
  }, [id, isInitializing, requestVersion])

  async function handleStudy() {
    if (!kanji || isStudying) return
    setIsStudying(true)
    setActionError(null)
    try {
      await studyKanji(kanji.id)
      invalidateReviewQueue()
      toast({ title: "Kanji marcado como estudado" })
      router.push("/dashboard/study")
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setIsStudying(false)
    }
  }

  return (
    <DashboardShell
      title="Detalhe do Kanji"
      subtitle="Leituras, significados e exemplos"
      kanji={kanji?.character ?? "字"}
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={catalogHref} scroll={!returnQuery}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          {!isInitializing && isAdmin && kanji && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/kanji/admin?id=${kanji.id}`}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          )}
          {!isInitializing && isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/kanji/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Link>
            </Button>
          )}
          {!isMissing && (
            <Button variant="outline" onClick={reloadDetail}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          )}
          {kanji && (
            <ContentStudyActions itemType="kanji" itemId={kanji.id} isStudying={isStudying} onStudy={() => void handleStudy()} />
          )}
        </div>

        {actionError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent role="alert" className="p-4 text-sm text-destructive">
              {actionError}
            </CardContent>
          </Card>
        )}

        {isMissing && (
          <Card className="border-border/50 bg-card/60">
            <CardContent role="status" className="p-5 space-y-1">
              <p className="font-medium">Kanji indisponível</p>
              <p className="text-sm text-muted-foreground">Volte ao catálogo para procurar outro kanji.</p>
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
              <Button onClick={reloadDetail}>Tentar novamente</Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <LoadingState />
        ) : kanji ? (
          <div className={catalogDetailColumns}>
            <Card className={catalogSurface}>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{kanji.unicodeCodepoint}</p>
                    <h2 lang="ja" className="mt-2 font-japanese text-3xl font-semibold text-foreground">{kanji.character}</h2>
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
                        <Badge key={`${meaning.meaning}-${meaning.language}`} lang={meaning.language || undefined} variant="outline" className="whitespace-normal [overflow-wrap:anywhere]">
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
                        <Progress aria-label="Nível SRS" value={kanji.userProgress.srsLevel} max={5} className="h-2" />
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Dominado: {kanji.userProgress.isMastered ? "sim" : "não"}</span>
                          <span>Favorito: {kanji.userProgress.isFavorited ? "sim" : "não"}</span>
                          <span>Suspenso: {kanji.userProgress.isSuspended ? "sim" : "não"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {isAuthenticated ? "Sem progresso registrado" : "Entre para ver seu progresso"}
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
              <Card className={cn(catalogSurface, "py-5")}>
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
                        <p lang="ja" className="font-japanese text-2xl text-foreground [overflow-wrap:anywhere]">{example.word}</p>
                        <p lang="ja" className="font-japanese text-sm text-muted-foreground [overflow-wrap:anywhere]">{example.reading}</p>
                        <p className="text-sm text-foreground">{example.meaning}</p>
                        <Badge variant="outline">{example.jlpt}</Badge>
                        <CatalogAudio src={example.audioUrl} subject={example.word} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem exemplos cadastrados.</p>
                  )}
                </CardContent>
              </Card>

              <Card className={cn(catalogSurface, "py-5")}>
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
                              <div className="h-11 w-11 shrink-0 rounded-xl bg-background flex items-center justify-center">
                                <span lang="ja" className="font-japanese text-xl text-[var(--gold)]">{radical.character}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground [overflow-wrap:anywhere]">{radical.name}</p>
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
        <span lang="ja" aria-hidden="true" className="font-japanese text-lg text-[var(--torii-red)]">{icon}</span>
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
      <p lang="ja" className="mt-1 font-japanese text-sm text-foreground [overflow-wrap:anywhere]">
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
