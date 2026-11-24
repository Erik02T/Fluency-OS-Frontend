"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid3X3,
  Layers,
  List,
  Search,
  Shield,
  Star,
} from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { CatalogField } from "@/components/catalog/catalog-field"
import { useRestoreCatalogItem } from "@/components/catalog/catalog-navigation"
import { CatalogOverview, catalogItemSurface, catalogSurface, catalogTerm } from "@/components/catalog/catalog-presentation"
import { ContentStudyActions } from "@/components/content-study-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { invalidateReviewQueue } from "@/store"
import { cn } from "@/lib/utils"
import {
  getKanjiList,
  studyKanji,
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

function readBooleanFilter(value: string | null): BooleanFilter {
  return value === "true" || value === "false" ? value : "all"
}

function updateCatalogUrl(values: Record<string, string | null>) {
  const url = new URL(window.location.href)
  url.searchParams.delete("item")
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  window.history.replaceState(null, "", url)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Erro inesperado ao carregar kanjis."
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
  const { user, isInitializing } = useAdminAuth()
  return (
    <React.Suspense fallback={<DashboardShell title="Banco de Kanji" kanji="字"><LoadingGrid /></DashboardShell>}>
      <KanjiCatalog key={user?.id ?? "visitor"} isInitializing={isInitializing} />
    </React.Suspense>
  )
}

function KanjiCatalog({ isInitializing }: { isInitializing: boolean }) {
  const { isAdmin, isAuthenticated } = useAdminAuth()
  const params = useSearchParams()
  const viewMode: ViewMode = params.get("view") === "list" ? "list" : "grid"
  const itemToRestore = params.get("item")
  const [searchQuery, setSearchQuery] = React.useState(params.get("search") ?? "")
  const selectedJlpt = jlptOptions.find((option) => option.value === params.get("jlpt"))?.value ?? "all"
  const masteredFilter = isAuthenticated ? readBooleanFilter(params.get("mastered")) : "all"
  const favoritesFilter = isAuthenticated ? readBooleanFilter(params.get("favorites")) : "all"
  const suspendedFilter = isAuthenticated ? readBooleanFilter(params.get("suspended")) : "all"
  const requestedSort = sortOptions.find((option) => option.value === params.get("sort"))?.value
  const sortBy = !isAuthenticated && (requestedSort === "srsLevel" || requestedSort === "mastered")
    ? "frequency"
    : requestedSort ?? "frequency"
  const order = params.get("order") === "desc" ? "desc" : "asc"
  const requestedPage = Number(params.get("page"))
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const [requestVersion, reloadCatalog] = React.useReducer((version: number) => version + 1, 0)
  const [response, setResponse] = React.useState<PaginatedKanjiResponseDto>({
    data: [],
    pagination: { page: 1, perPage: PAGE_SIZE, total: 0, pages: 0 },
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const deferredSearch = React.useDeferredValue(searchQuery.trim())

  React.useEffect(() => {
    if (isInitializing) return
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
    isInitializing,
    requestVersion,
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
  const hasResults = !isLoading && !errorMessage
  useRestoreCatalogItem(itemToRestore ? `kanji-${itemToRestore}` : null, hasResults && pagination.page === page)
  const masteredCount = kanjis.filter((kanji) => kanji.userProgress?.isMastered).length
  const progressCount = kanjis.filter((kanji) => kanji.userProgress).length
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.perPage + 1
  const endItem = Math.min(pagination.page * pagination.perPage, pagination.total)

  return (
    <DashboardShell
      title="Banco de Kanji"
      subtitle="Consulte significados, leituras e seu progresso"
      kanji="字"
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <CatalogOverview
          isLoading={isLoading}
          onRefresh={reloadCatalog}
          metrics={[
            { label: "Total da consulta", value: hasResults ? pagination.total : null },
            { label: "Itens nesta página", value: hasResults ? kanjis.length : null },
            { label: "Dominados nesta página", value: hasResults && isAuthenticated ? masteredCount : null },
            { label: "Com progresso nesta página", value: hasResults && isAuthenticated ? progressCount : null },
          ]}
          actions={!isInitializing && isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/kanji/admin">
                <Shield aria-hidden="true" />
                Admin
              </Link>
            </Button>
          )}
        />

        <Card className={catalogSurface}>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))]">
              <CatalogField id="kanji-search" label="Busca" className="col-span-full lg:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="kanji-search"
                    placeholder="Buscar por kanji, significado, leitura..."
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      updateCatalogUrl({ search: event.target.value, page: null })
                    }}
                    className="pl-9 bg-secondary/40 border-border"
                  />
                </div>
              </CatalogField>

              <CatalogField id="kanji-jlpt" label="JLPT">
                <Select
                  value={selectedJlpt}
                  onValueChange={(value) => updateCatalogUrl({ jlpt: value === "all" ? null : value, page: null })}
                >
                  <SelectTrigger id="kanji-jlpt" className="bg-secondary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jlptOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CatalogField>

              <CatalogField id="kanji-mastered" label="Dominados">
                <Select
                  value={masteredFilter}
                  disabled={isInitializing || !isAuthenticated}
                  onValueChange={(value) => updateCatalogUrl({ mastered: value === "all" ? null : value, page: null })}
                >
                  <SelectTrigger id="kanji-mastered" className="bg-secondary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {booleanOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                          {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CatalogField>

              <CatalogField id="kanji-favorites" label="Favoritos">
                <Select
                  value={favoritesFilter}
                  disabled={isInitializing || !isAuthenticated}
                  onValueChange={(value) => updateCatalogUrl({ favorites: value === "all" ? null : value, page: null })}
                >
                  <SelectTrigger id="kanji-favorites" className="bg-secondary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {booleanOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                          {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CatalogField>

              <CatalogField id="kanji-suspended" label="Suspensos">
                <Select
                  value={suspendedFilter}
                  disabled={isInitializing || !isAuthenticated}
                  onValueChange={(value) => updateCatalogUrl({ suspended: value === "all" ? null : value, page: null })}
                >
                  <SelectTrigger id="kanji-suspended" className="bg-secondary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {booleanOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                          {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CatalogField>
            </div>

            {!isInitializing && !isAuthenticated && (
              <p className="text-sm text-muted-foreground">
                <Link href="/dashboard/login" className="underline underline-offset-4">Entre na sua conta</Link>{" "}
                para usar os filtros de progresso.
              </p>
            )}

            <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))_auto_auto]">
              <CatalogField id="kanji-sort" label="Ordenar por">
                <Select
                  value={sortBy}
                  onValueChange={(value) => updateCatalogUrl({ sort: value === "frequency" ? null : value, page: null })}
                >
                  <SelectTrigger id="kanji-sort" className="bg-secondary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={!isAuthenticated && (option.value === "srsLevel" || option.value === "mastered")}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CatalogField>

              <CatalogField id="kanji-order" label="Ordem">
                <Select
                  value={order}
                  onValueChange={(value) => updateCatalogUrl({ order: value === "asc" ? null : value, page: null })}
                >
                  <SelectTrigger id="kanji-order" className="bg-secondary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascendente</SelectItem>
                    <SelectItem value="desc">Descendente</SelectItem>
                  </SelectContent>
                </Select>
              </CatalogField>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  updateCatalogUrl({
                    search: null, jlpt: null, mastered: null, favorites: null,
                    suspended: null, sort: null, order: null, page: null,
                  })
                }}
              >
                Limpar
              </Button>

              <div className="flex border border-border rounded-xl overflow-hidden justify-self-start md:justify-self-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => updateCatalogUrl({ view: null })}
                  aria-label="Grade"
                  aria-pressed={viewMode === "grid"}
                  className={cn("rounded-none", viewMode === "grid" && "bg-secondary")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => updateCatalogUrl({ view: "list" })}
                  aria-label="Lista"
                  aria-pressed={viewMode === "list"}
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
              <Button onClick={reloadCatalog}>Tentar novamente</Button>
            </CardContent>
          </Card>
        )}

        {errorMessage ? null : isLoading ? (
          <LoadingGrid />
        ) : kanjis.length > 0 ? (
          <div className={cn(viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3") }>
            {kanjis.map((kanji) => (
              <KanjiResultCard key={kanji.id} kanji={kanji} viewMode={viewMode} catalogQuery={params.toString()} />
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

        {hasResults && <Card className={catalogSurface}>
          <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {pagination.total === 0 ? 0 : startItem}–{endItem} de {pagination.total.toLocaleString("pt-BR")} resultados
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 lg:shrink-0">
              <Button
                variant="outline"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => updateCatalogUrl({ page: page > 2 ? String(page - 1) : null })}
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
                onClick={() => updateCatalogUrl({ page: String(page + 1) })}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>}
      </motion.div>
    </DashboardShell>
  )
}

function KanjiResultCard({
  kanji,
  viewMode,
  catalogQuery,
}: {
  kanji: KanjiListItemDto
  viewMode: ViewMode
  catalogQuery: string
}) {
  const router = useRouter()
  const { isAuthenticated } = useAdminAuth()
  const isGrid = viewMode === "grid"
  const [isStudying, setIsStudying] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleStudy() {
    if (isStudying) return
    setIsStudying(true)
    setError(null)
    try {
      await studyKanji(kanji.id)
      invalidateReviewQueue()
      toast({ title: "Kanji marcado como estudado" })
      router.push("/dashboard/study")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsStudying(false)
    }
  }

  const actionButtons = (
    <div className="relative z-10 w-fit">
      <ContentStudyActions itemType="kanji" itemId={kanji.id} isStudying={isStudying} onStudy={() => void handleStudy()} />
    </div>
  )
  const returnParams = new URLSearchParams(catalogQuery)
  returnParams.set("item", kanji.id)
  const detailHref = `/dashboard/kanji/${kanji.id}?${new URLSearchParams({ from: returnParams.toString() })}`
  function rememberCard() {
    window.history.replaceState(window.history.state, "", `/dashboard/kanji?${returnParams}`)
  }
  const missingProgress = isAuthenticated ? "Sem progresso registrado" : "Entre para ver seu progresso"

  if (isGrid) {
    return (
      <Card id={`kanji-${kanji.id}`} className={cn(catalogItemSurface, "group relative h-full overflow-hidden")}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-[0.18em]">
              {kanji.jlpt}
            </Badge>
            <span className="text-xs text-muted-foreground">#{kanji.frequency}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--torii-red)]/10 to-transparent border border-[var(--torii-red)]/15 flex items-center justify-center shrink-0">
              <span lang="ja" className={cn(catalogTerm, "text-5xl")}>{kanji.character}</span>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm text-foreground line-clamp-2">{kanji.meanings.join(", ")}</p>
              <p lang="ja" className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
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
              <Progress aria-label="Nível SRS" value={kanji.userProgress.srsLevel} max={5} className="h-2" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              {missingProgress}
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs text-destructive">{error}</p>
          )}

          {actionButtons}

          <Link
            href={detailHref}
            onNavigate={rememberCard}
            aria-label={`Ver detalhes de ${kanji.character}`}
            data-catalog-detail-link=""
            className="flex items-center justify-between pt-1 text-sm text-muted-foreground after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
          >
            <span>Ver detalhes</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id={`kanji-${kanji.id}`} className={cn(catalogItemSurface, "group relative")}>
      <CardContent className="p-4 flex flex-wrap items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
          <span lang="ja" className={cn(catalogTerm, "text-3xl")}>{kanji.character}</span>
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
            <span lang="ja">音 {formatList(kanji.onyomi)}</span>
            <span lang="ja">訓 {formatList(kanji.kunyomi)}</span>
            <span>Traços {kanji.strokes}</span>
            <span>Grade {kanji.grade || "—"}</span>
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">{error}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {kanji.userProgress ? (
            <div className="w-28">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>SRS</span>
                <span>{kanji.userProgress.srsLevel}/5</span>
              </div>
              <Progress aria-label="Nível SRS" value={kanji.userProgress.srsLevel} max={5} className="h-1.5" />
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground">{missingProgress}</span>
          )}
          {actionButtons}
          <Link
            href={detailHref}
            onNavigate={rememberCard}
            aria-label={`Ver detalhes de ${kanji.character}`}
            data-catalog-detail-link=""
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
          >
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
