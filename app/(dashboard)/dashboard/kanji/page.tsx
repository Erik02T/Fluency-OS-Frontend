"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid3X3,
  Layers,
  List,
  RefreshCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Star,
} from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  getKanjiList,
  studyKanji,
  sendKanjiToReview,
  type JLPTLevel,
  type KanjiListItemDto,
  type PaginatedKanjiResponseDto,
} from "@/lib/kanji-api"

const PAGE_SIZE = 24

type BooleanFilter = "all" | "true" | "false"
type ViewMode = "grid" | "list"

const jlptOptions: Array<{ label: string; value: "all" | JLPTLevel }> = [
  { label: "Todos", value: "all" },
  { label: "N5", value: "N5" },
  { label: "N4", value: "N4" },
  { label: "N3", value: "N3" },
  { label: "N2", value: "N2" },
  { label: "N1", value: "N1" },
]

const booleanOptions: Array<{ label: string; value: BooleanFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Sim", value: "true" },
  { label: "Não", value: "false" },
]

const sortOptions = [
  { label: "Frequência", value: "frequency" },
  { label: "JLPT", value: "jlpt" },
  { label: "Grau", value: "grade" },
  { label: "Traços", value: "strokes" },
  { label: "SRS", value: "srsLevel" },
  { label: "Dominado", value: "mastered" },
] as const

function formatList(values: string[] | undefined, fallback = "—"): string {
  return values && values.length > 0 ? values.join("、") : fallback
}

function parseBooleanFilter(value: BooleanFilter): boolean | undefined {
  if (value === "true") {
    return true
  }

  if (value === "false") {
    return false
  }

  return undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Erro inesperado ao carregar kanjis."
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
            <div className="h-16 w-16 rounded-2xl bg-muted/50" />
            <div className="h-4 w-3/4 rounded bg-muted/50" />
            <div className="h-4 w-1/2 rounded bg-muted/50" />
            <div className="h-2 w-full rounded bg-muted/50" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function KanjiPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedJlpt, setSelectedJlpt] = React.useState<"all" | JLPTLevel>("all")
  const [masteredFilter, setMasteredFilter] = React.useState<BooleanFilter>("all")
  const [favoritesFilter, setFavoritesFilter] = React.useState<BooleanFilter>("all")
  const [suspendedFilter, setSuspendedFilter] = React.useState<BooleanFilter>("all")
  const [sortBy, setSortBy] = React.useState<(typeof sortOptions)[number]["value"]>(
    "frequency"
  )
  const [order, setOrder] = React.useState<"asc" | "desc">("asc")
  const [page, setPage] = React.useState(1)
  const [response, setResponse] = React.useState<PaginatedKanjiResponseDto>({
    data: [],
    pagination: { page: 1, perPage: PAGE_SIZE, total: 0, pages: 0 },
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const deferredSearch = React.useDeferredValue(searchQuery.trim())

  React.useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    async function loadKanjis() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const payload = await getKanjiList(
          {
            page,
            perPage: PAGE_SIZE,
            search: deferredSearch || undefined,
            jlpt: selectedJlpt === "all" ? undefined : selectedJlpt,
            mastered: parseBooleanFilter(masteredFilter),
            favorites: parseBooleanFilter(favoritesFilter),
            suspended: parseBooleanFilter(suspendedFilter),
            sort: sortBy,
            order,
          },
          { signal: controller.signal },
        )

        if (isActive) {
          setResponse(payload)
        }
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          setErrorMessage(getErrorMessage(error))
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

    loadKanjis()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [
    page,
    deferredSearch,
    selectedJlpt,
    masteredFilter,
    favoritesFilter,
    suspendedFilter,
    sortBy,
    order,
  ])

  const kanjis = response.data
  const pagination = response.pagination
  const masteredCount = kanjis.filter((kanji) => kanji.userProgress?.isMastered).length
  const progressCount = kanjis.filter((kanji) => kanji.userProgress).length
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.perPage + 1
  const endItem = Math.min(pagination.page * pagination.perPage, pagination.total)

  return (
    <DashboardShell
      title="Banco de Kanji"
      subtitle="Busca, filtros e paginação consumindo a API em tempo real"
      kanji="字"
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dados ao vivo</p>
                  <h2 className="text-2xl font-semibold text-foreground mt-2">
                    {pagination.total.toLocaleString("pt-BR")} kanjis no backend
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    A busca, os filtros e a paginação são resolvidos pelo servidor.
                    O frontend só renderiza os dados e navega para os detalhes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/kanji/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => setPage(1)}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4 mt-5">
                <SummaryCard label="Resultados" value={pagination.total} icon="全" />
                <SummaryCard label="Visíveis" value={kanjis.length} icon="見" />
                <SummaryCard label="Dominados" value={masteredCount} icon="済" />
                <SummaryCard label="Com progresso" value={progressCount} icon="復" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-[var(--torii-red)]" />
                Estado da página
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Modo</span>
                <Badge variant="outline">{viewMode === "grid" ? "Grade" : "Lista"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Página</span>
                <span className="text-foreground font-medium">
                  {pagination.page}/{Math.max(pagination.pages, 1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Faixa</span>
                <span className="text-foreground font-medium">
                  {pagination.total === 0 ? "—" : `${startItem}-${endItem}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Busca</span>
                <span className="text-foreground font-medium">{deferredSearch || "Sem termo"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/60 backdrop-blur border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por kanji, significado, leitura..."
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
                value={masteredFilter}
                onValueChange={(value) => {
                  setMasteredFilter(value as BooleanFilter)
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-secondary/40 border-border">
                  <SelectValue placeholder="Dominados" />
                </SelectTrigger>
                <SelectContent>
                  {booleanOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={favoritesFilter}
                onValueChange={(value) => {
                  setFavoritesFilter(value as BooleanFilter)
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-secondary/40 border-border">
                  <SelectValue placeholder="Favoritos" />
                </SelectTrigger>
                <SelectContent>
                  {booleanOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={suspendedFilter}
                onValueChange={(value) => {
                  setSuspendedFilter(value as BooleanFilter)
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-secondary/40 border-border">
                  <SelectValue placeholder="Suspensos" />
                </SelectTrigger>
                <SelectContent>
                  {booleanOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))_auto_auto] items-center">
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value as (typeof sortOptions)[number]["value"])
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-secondary/40 border-border">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={order}
                onValueChange={(value) => {
                  setOrder(value as "asc" | "desc")
                  setPage(1)
                }}
              >
                <SelectTrigger className="bg-secondary/40 border-border">
                  <SelectValue placeholder="Ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendente</SelectItem>
                  <SelectItem value="desc">Descendente</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedJlpt("all")
                  setMasteredFilter("all")
                  setFavoritesFilter("all")
                  setSuspendedFilter("all")
                  setSortBy("frequency")
                  setOrder("asc")
                  setPage(1)
                }}
              >
                Limpar
              </Button>

              <div className="flex border border-border rounded-xl overflow-hidden justify-self-start md:justify-self-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn("rounded-none", viewMode === "grid" && "bg-secondary")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn("rounded-none", viewMode === "list" && "bg-secondary")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {errorMessage && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-destructive">Falha ao carregar kanjis</p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <Button onClick={() => setPage(1)}>Tentar novamente</Button>
            </CardContent>
          </Card>
        )}

        {isLoading && kanjis.length === 0 ? (
          <LoadingGrid />
        ) : kanjis.length > 0 ? (
          <div className={cn(viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3") }>
            {kanjis.map((kanji) => (
              <KanjiResultCard key={kanji.id} kanji={kanji} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <Card className="bg-card/60 border-border/50">
            <CardContent className="py-14 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-[var(--torii-red)]">
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Nenhum kanji encontrado</p>
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

function KanjiResultCard({
  kanji,
  viewMode,
}: {
  kanji: KanjiListItemDto
  viewMode: ViewMode
}) {
  const isGrid = viewMode === "grid"
  const [isStudying, setIsStudying] = React.useState(false)
  const [isReviewing, setIsReviewing] = React.useState(false)
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function handleStudy(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (isStudying) return
    setIsStudying(true)
    setError(null)
    setFeedback(null)
    try {
      await studyKanji(kanji.id)
      setFeedback("Adicionado ao estudo")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsStudying(false)
    }
  }

  async function handleReview(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    if (isReviewing) return
    setIsReviewing(true)
    setError(null)
    setFeedback(null)
    try {
      await sendKanjiToReview(kanji.id)
      setFeedback("Enviado para review")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsReviewing(false)
    }
  }

  const actionButtons = (
    <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
      <Button
        size="sm"
        variant="outline"
        disabled={isStudying || isReviewing}
        onClick={handleStudy}
      >
        {isStudying ? "..." : "Estudar"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isStudying || isReviewing}
        onClick={handleReview}
      >
        {isReviewing ? "..." : "Review"}
      </Button>
    </div>
  )

  if (isGrid) {
    return (
      <Link href={`/dashboard/kanji/${kanji.id}`} className="group block">
        <Card className="h-full overflow-hidden bg-card/60 backdrop-blur border-border/50 transition-all duration-200 group-hover:border-[var(--torii-red)]/40 group-hover:-translate-y-1">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
                {kanji.jlpt}
              </Badge>
              <span className="text-xs text-muted-foreground">#{kanji.frequency}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--torii-red)]/10 to-transparent border border-[var(--torii-red)]/15 flex items-center justify-center shrink-0">
                <span className="font-japanese text-5xl text-[var(--torii-red)]">{kanji.character}</span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm text-foreground line-clamp-2">{kanji.meanings.join(", ")}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  音 {formatList(kanji.onyomi)} · 訓 {formatList(kanji.kunyomi)}
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                  <span>Traços {kanji.strokes}</span>
                  <span>Grade {kanji.grade || "—"}</span>
                </div>
              </div>
            </div>

            {kanji.userProgress ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>SRS</span>
                  <span>
                    {kanji.userProgress.srsLevel}/5{kanji.userProgress.isMastered ? " · dominado" : ""}
                  </span>
                </div>
                <Progress value={kanji.userProgress.srsLevel * 20} className="h-2" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Progresso indisponível sem autenticação
              </div>
            )}

            {feedback && (
              <p className="text-xs text-emerald-500">{feedback}</p>
            )}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            {actionButtons}

            <div className="flex items-center justify-between pt-1 text-sm text-muted-foreground">
              <span>Ver detalhes</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/dashboard/kanji/${kanji.id}`} className="group block">
      <Card className="bg-card/60 backdrop-blur border-border/50 transition-all duration-200 group-hover:border-[var(--torii-red)]/40 group-hover:-translate-y-0.5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
            <span className="font-japanese text-3xl text-foreground">{kanji.character}</span>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {kanji.meanings.join(", ")}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {kanji.jlpt}
              </Badge>
              {kanji.userProgress?.isMastered && (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Dominado
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
              <span>音 {formatList(kanji.onyomi)}</span>
              <span>訓 {formatList(kanji.kunyomi)}</span>
              <span>Traços {kanji.strokes}</span>
              <span>Grade {kanji.grade || "—"}</span>
            </div>
            {feedback && (
              <p className="text-xs text-emerald-500">{feedback}</p>
            )}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {kanji.userProgress ? (
              <div className="w-28">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>SRS</span>
                  <span>{kanji.userProgress.srsLevel}/5</span>
                </div>
                <Progress value={kanji.userProgress.srsLevel * 20} className="h-1.5" />
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground">Sem progresso</span>
            )}
            {actionButtons}
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
