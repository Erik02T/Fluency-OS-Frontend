"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Layers,
  RefreshCcw,
  Search,
  Sparkles,
  Star,
  Tag,
  Volume2,
  Zap,
} from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  getVocabularyDetail,
  getVocabularyList,
  updateVocabularyProgress,
  type JLPTLevel,
  type PaginatedVocabularyResponseDto,
  type VocabularyDetailResponseDto,
  type VocabularyListItemDto,
  type VocabularyProgressResponseDto,
} from "@/lib/vocabulary-api"

const PAGE_SIZE = 20

const jlptOptions: Array<{ label: string; value: "all" | JLPTLevel }> = [
  { label: "Todos", value: "all" },
  { label: "N5", value: "N5" },
  { label: "N4", value: "N4" },
  { label: "N3", value: "N3" },
  { label: "N2", value: "N2" },
  { label: "N1", value: "N1" },
]

const sortOptions = [
  { label: "Frequência", value: "frequency" },
  { label: "JLPT", value: "jlpt" },
  { label: "Palavra", value: "word" },
  { label: "Mais recentes", value: "createdAt" },
] as const

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Erro inesperado ao carregar vocabulário."
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

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 flex items-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center">
        <span className="font-japanese text-lg text-[var(--torii-red)]">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value.toLocaleString("pt-BR")}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="bg-card/60 border-border/50">
          <CardContent className="p-5 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 rounded bg-muted/50" />
              <div className="h-5 w-10 rounded-full bg-muted/50" />
            </div>
            <div className="h-20 w-20 rounded-2xl bg-muted/50" />
            <div className="h-4 w-3/4 rounded bg-muted/50" />
            <div className="h-4 w-1/2 rounded bg-muted/50" />
            <div className="h-2 w-full rounded bg-muted/50" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function VocabularyResultCard({
  item,
  isExpanded,
  detail,
  isLoadingDetail,
  isProgressLoading,
  onToggle,
  onProgressUpdate,
}: {
  item: VocabularyListItemDto
  isExpanded: boolean
  detail?: VocabularyDetailResponseDto
  isLoadingDetail: boolean
  isProgressLoading: boolean
  onToggle: () => void
  onProgressUpdate: (action: "study" | "review") => void
}) {
  const progress = detail?.userProgress ?? item.userProgress

  return (
    <div className="group">
      <Card className="h-full overflow-hidden bg-card/60 backdrop-blur border-border/50 transition-all duration-200 group-hover:border-[var(--torii-red)]/40 group-hover:-translate-y-1">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
              {item.jlpt}
            </Badge>
            <span className="text-xs text-muted-foreground">#{item.frequency ?? "—"}</span>
          </div>

          <div className="flex items-center gap-4 cursor-pointer" onClick={onToggle}>
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--torii-red)]/10 to-transparent border border-[var(--torii-red)]/15 flex items-center justify-center shrink-0">
              <span className="font-japanese text-5xl text-[var(--torii-red)]">{item.word.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-japanese text-xl text-foreground truncate">{item.word}</p>
                {item.userProgress?.isMastered ? (
                  <Star className="h-4 w-4 text-emerald-500 fill-emerald-500 shrink-0" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">{item.reading}</p>
              <p className="text-sm text-foreground line-clamp-2">{item.primaryMeaning || "—"}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            {item.partOfSpeech ? (
              <span className="rounded-md border border-border/50 bg-background/40 px-2 py-1">
                {item.partOfSpeech}
              </span>
            ) : (
              <span>Tipo não informado</span>
            )}
          </div>

          {progress ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>SRS</span>
                <span>
                  {progress.srsLevel}
                  {progress.isMastered ? " · dominado" : ""}
                </span>
              </div>
              <Progress value={progress.srsLevel * 10} className="h-2" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Progresso indisponível sem autenticação
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
              disabled={isProgressLoading}
              onClick={(event) => {
                event.stopPropagation()
                onProgressUpdate("study")
              }}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              Estudar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isProgressLoading}
              onClick={(event) => {
                event.stopPropagation()
                onProgressUpdate("review")
              }}
            >
              <Zap className="h-3 w-3 mr-1" />
              Review
            </Button>
          </div>

          {isExpanded ? (
            <div className="space-y-4 border-t border-border/50 pt-4">
              {isLoadingDetail && !detail ? (
                <div className="text-sm text-muted-foreground">Carregando detalhe...</div>
              ) : detail ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {detail.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {detail.audioUrl ? (
                      <Badge variant="outline" className="text-xs">
                        <Volume2 className="h-3 w-3 mr-1" />
                        Áudio disponível
                      </Badge>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Significados
                    </p>
                    <div className="space-y-2">
                      {detail.meanings.map((meaning, index) => (
                        <div
                          key={`${meaning.meaning}-${index}`}
                          className="rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                        >
                          <p className="text-sm text-foreground">{meaning.meaning}</p>
                          {meaning.context ? (
                            <p className="text-xs text-muted-foreground mt-1">{meaning.context}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Exemplos
                    </p>
                    <div className="space-y-2">
                      {detail.examples.length > 0 ? (
                        detail.examples.map((example, index) => (
                          <div
                            key={`${example.japanese}-${index}`}
                            className="p-3 rounded-lg bg-background/50 border border-border/50"
                          >
                            <p className="font-japanese text-foreground mb-1">{example.japanese}</p>
                            {example.reading ? (
                              <p className="text-xs font-mono text-muted-foreground mb-1">
                                {example.reading}
                              </p>
                            ) : null}
                            <p className="text-sm text-muted-foreground">{example.translation}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Sem exemplos cadastrados.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-3 space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-xs font-medium text-foreground uppercase tracking-wider mb-1">
                      <Clock className="h-3.5 w-3.5 text-[var(--torii-red)]" />
                      Progresso
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Nível SRS</span>
                      <span className="font-medium text-foreground">{progress?.srsLevel ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reviews corretos</span>
                      <span className="font-medium text-foreground">
                        {detail.userProgress?.correctReviews ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total reviews</span>
                      <span className="font-medium text-foreground">
                        {detail.userProgress?.totalReviews ?? 0}
                      </span>
                    </div>
                    {detail.notes ? (
                      <div className="rounded-lg border border-border/50 bg-card/40 px-3 py-2 text-xs text-muted-foreground">
                        {detail.notes}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Detalhe indisponível.</div>
              )}
            </div>
          ) : null}

          <div
            className="flex items-center justify-between pt-1 text-sm text-muted-foreground cursor-pointer select-none"
            onClick={onToggle}
          >
            <span>{isExpanded ? "Ocultar detalhes" : "Ver detalhes"}</span>
            <ChevronRight
              className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VocabPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedJlpt, setSelectedJlpt] = React.useState<"all" | JLPTLevel>("all")
  const [selectedTag, setSelectedTag] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState<(typeof sortOptions)[number]["value"]>("frequency")
  const [order, setOrder] = React.useState<"asc" | "desc">("asc")
  const [page, setPage] = React.useState(1)
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null)
  const [response, setResponse] = React.useState<PaginatedVocabularyResponseDto>({
    data: [],
    pagination: { page: 1, perPage: PAGE_SIZE, total: 0, pages: 0 },
  })
  const [details, setDetails] = React.useState<Record<string, VocabularyDetailResponseDto>>({})
  const [loadingDetailId, setLoadingDetailId] = React.useState<string | null>(null)
  const [progressLoadingId, setProgressLoadingId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const deferredSearch = React.useDeferredValue(searchQuery.trim())

  React.useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    async function loadVocabulary() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const payload = await getVocabularyList(
          {
            page,
            perPage: PAGE_SIZE,
            search: deferredSearch || undefined,
            jlpt: selectedJlpt === "all" ? undefined : selectedJlpt,
            sort: sortBy,
            order,
          },
          { signal: controller.signal },
        )

        if (isActive) {
          setResponse(payload)
          setExpandedRow(null)
        }
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          setErrorMessage(parseApiMessage(getErrorMessage(error)))
          setResponse({
            data: [],
            pagination: { page: 1, perPage: PAGE_SIZE, total: 0, pages: 0 },
          })
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadVocabulary()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [page, deferredSearch, selectedJlpt, sortBy, order])

  const allTags = React.useMemo(
    () => Array.from(new Set(response.data.flatMap((item) => item.tags))).sort(),
    [response.data],
  )

  const visibleItems = React.useMemo(() => {
    if (selectedTag === "all") {
      return response.data
    }

    return response.data.filter((item) => item.tags.includes(selectedTag))
  }, [response.data, selectedTag])

  const pagination = response.pagination
  const studiedCount = visibleItems.filter((item) => item.userProgress).length
  const masteredCount = visibleItems.filter((item) => item.userProgress?.isMastered).length
  const reviewCount = visibleItems.filter((item) => (item.userProgress?.srsLevel ?? 0) > 1).length
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.perPage + 1
  const endItem = Math.min(pagination.page * pagination.perPage, pagination.total)

  const handleExpand = React.useCallback(
    async (item: VocabularyListItemDto) => {
      const nextExpanded = expandedRow === item.id ? null : item.id
      setExpandedRow(nextExpanded)

      if (!nextExpanded || details[item.id]) {
        return
      }

      try {
        setLoadingDetailId(item.id)
        const detail = await getVocabularyDetail(item.id)
        setDetails((current) => ({ ...current, [item.id]: detail }))
      } catch (error) {
        toast({
          title: "Falha ao carregar detalhe",
          description: parseApiMessage(getErrorMessage(error)),
          variant: "destructive",
        })
      } finally {
        setLoadingDetailId((current) => (current === item.id ? null : current))
      }
    },
    [details, expandedRow],
  )

  const applyProgressResponse = React.useCallback(
    (id: string, progress: VocabularyProgressResponseDto) => {
      setResponse((current) => ({
        ...current,
        data: current.data.map((item) =>
          item.id === id
            ? {
                ...item,
                userProgress: {
                  srsLevel: progress.srsLevel,
                  isMastered: progress.isMastered,
                  isFavorited: progress.isFavorited,
                  isSuspended: progress.isSuspended,
                },
              }
            : item,
        ),
      }))

      setDetails((current) => {
        const detail = current[id]
        if (!detail) {
          return current
        }

        return {
          ...current,
          [id]: {
            ...detail,
            userProgress: {
              srsLevel: progress.srsLevel,
              isMastered: progress.isMastered,
              isFavorited: progress.isFavorited,
              isSuspended: progress.isSuspended,
              easeFactor: progress.easeFactor,
              intervalDays: progress.intervalDays,
              nextReviewAt: progress.nextReviewAt,
              lastReviewedAt: progress.lastReviewedAt,
              totalReviews: progress.totalReviews,
              correctReviews: progress.correctReviews,
            },
          },
        }
      })
    },
    [],
  )

  const handleProgressUpdate = React.useCallback(
    async (id: string, action: "study" | "review") => {
      try {
        setProgressLoadingId(id)
        const payload = await updateVocabularyProgress(id, {
          action,
          correct: action === "review" ? true : undefined,
        })

        applyProgressResponse(id, payload)

        toast({
          title: action === "study" ? "Vocabulário marcado como estudado" : "Review registrado",
          description:
            action === "study"
              ? "O item entrou no seu progresso de estudo."
              : "O item foi enviado para a fila de revisão.",
        })

        if (action === "study") {
          router.push("/dashboard/study")
        } else {
          router.push("/dashboard/review")
        }
      } catch (error) {
        toast({
          title: "Falha ao atualizar progresso",
          description: parseApiMessage(getErrorMessage(error)),
          variant: "destructive",
        })
      } finally {
        setProgressLoadingId((current) => (current === id ? null : current))
      }
    },
    [applyProgressResponse, router],
  )

  return (
    <DashboardShell
      title="Vocabulário"
      subtitle="Listagem, detalhe e progresso conectados à API real do backend"
      kanji="語"
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dados ao vivo</p>
                  <h2 className="text-2xl font-semibold text-foreground mt-2">
                    {pagination.total.toLocaleString("pt-BR")} itens de vocabulário no backend
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    A listagem consome a API em tempo real, o detalhe é carregado sob demanda e o progresso
                    usa os endpoints reais de study/review.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setPage(1)}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-4 mt-5">
                <SummaryCard label="Resultados" value={pagination.total} icon="語" />
                <SummaryCard label="Visíveis" value={visibleItems.length} icon="見" />
                <SummaryCard label="Estudados" value={studiedCount} icon="習" />
                <SummaryCard label="Dominados" value={masteredCount} icon="済" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-[var(--torii-red)]" />
                Estado da sessão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Página</span>
                <span className="text-foreground font-medium">
                  {pagination.page}/{Math.max(pagination.pages, 1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Busca</span>
                <span className="text-foreground font-medium">{deferredSearch || "Sem termo"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Filtro de tag</span>
                <span className="text-foreground font-medium">{selectedTag === "all" ? "Todas" : selectedTag}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Com review</span>
                <span className="text-foreground font-medium">{reviewCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Faixa</span>
                <span className="text-foreground font-medium">
                  {pagination.total === 0 ? "—" : `${startItem}-${endItem}`}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/60 backdrop-blur border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar palavra, leitura, significado..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                    setPage(1)
                  }}
                  className="pl-9 bg-secondary/40 border-border"
                />
              </div>

              <Select
                value={selectedJlpt}
                onValueChange={(value) => {
                  setSelectedJlpt(value as "all" | JLPTLevel)
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-secondary/40 border-border">
                  <SelectValue placeholder="JLPT" />
                </SelectTrigger>
                <SelectContent>
                  {jlptOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedTag}
                onValueChange={(value) => setSelectedTag(value)}
              >
                <SelectTrigger className="bg-secondary/40 border-border">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value as (typeof sortOptions)[number]["value"])
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-secondary/40 border-border">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Select
                value={order}
                onValueChange={(value) => {
                  setOrder(value as "asc" | "desc")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[180px] bg-secondary/40 border-border">
                  <SelectValue placeholder="Ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendente</SelectItem>
                  <SelectItem value="desc">Descendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Falha ao carregar vocabulário</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading && response.data.length === 0 ? (
          <LoadingGrid />
        ) : visibleItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <VocabularyResultCard
                key={item.id}
                item={item}
                isExpanded={expandedRow === item.id}
                detail={details[item.id]}
                isLoadingDetail={loadingDetailId === item.id && !details[item.id]}
                isProgressLoading={progressLoadingId === item.id}
                onToggle={() => void handleExpand(item)}
                onProgressUpdate={(action) => void handleProgressUpdate(item.id, action)}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-card/60 border-border/50">
            <CardContent className="py-14 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-[var(--torii-red)]">
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Nenhum vocabulário encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Ajuste a busca ou os filtros para consultar outro conjunto da API.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/60 backdrop-blur border-border/50">
          <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {pagination.total === 0 ? 0 : startItem}–{endItem} de {pagination.total.toLocaleString("pt-BR")} resultados
            </div>
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <Button
                variant="outline"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Badge variant="outline" className="px-3 py-2">
                Página {pagination.page} de {Math.max(pagination.pages, 1)}
              </Badge>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.pages || isLoading || pagination.pages === 0}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardShell>
  )
}