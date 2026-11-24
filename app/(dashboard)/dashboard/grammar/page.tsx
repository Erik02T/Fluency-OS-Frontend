"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  RefreshCcw,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DashboardShell } from "@/components/layout"
import { CatalogField } from "@/components/catalog/catalog-field"
import { CatalogOverview, catalogItemSurface, catalogSurface, catalogTerm } from "@/components/catalog/catalog-presentation"
import { CatalogDetailLink, grammarCatalogPath, readCatalogPage, updateCatalogQuery, useRestoreCatalogItem } from "@/components/catalog/catalog-navigation"
import { getCatalogErrorMessage } from "@/lib/catalog-api-error"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { cn } from "@/lib/utils"
import {
  getGrammarList,
  type JLPTLevel,
  type PaginatedGrammarResponseDto,
} from "@/lib/grammar-api"

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
  { label: "Ordem didática", value: "position" },
  { label: "Dificuldade", value: "difficulty" },
  { label: "JLPT", value: "jlpt" },
  { label: "Padrão", value: "pattern" },
  { label: "Mais recentes", value: "createdAt" },
] as const

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

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card
          key={index}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden"
        >
          <CardContent className="p-4 animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-28 rounded bg-muted/50" />
                  <div className="h-5 w-10 rounded bg-muted/50" />
                </div>
                <div className="h-4 w-48 rounded bg-muted/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function GrammarPage() {
  const { user, isInitializing } = useAdminAuth()
  return (
    <React.Suspense fallback={<DashboardShell title="Gramática" kanji="文"><LoadingGrid /></DashboardShell>}>
      <GrammarCatalog key={user?.id ?? "visitor"} isInitializing={isInitializing} />
    </React.Suspense>
  )
}

function GrammarCatalog({ isInitializing }: { isInitializing: boolean }) {
  const { isAuthenticated } = useAdminAuth()
  const missingProgress = isAuthenticated ? "Sem progresso registrado" : "Entre para ver seu progresso"
  const params = useSearchParams()
  const [searchQuery, setSearchQuery] = React.useState(params.get("search") ?? "")
  const selectedJLPT = jlptOptions.find((option) => option.value === params.get("jlpt"))?.value ?? "all"
  const difficulty = params.get("difficulty")
  const selectedDifficulty = difficulty && /^[1-5]$/.test(difficulty) ? difficulty : "all"
  const selectedTag = params.get("tag")
  const sortBy = sortOptions.find((option) => option.value === params.get("sort"))?.value ?? "position"
  const order = params.get("order") === "desc" ? "desc" : "asc"
  const page = readCatalogPage(params.get("page"))
  const [requestVersion, reloadCatalog] = React.useReducer((version: number) => version + 1, 0)
  const [response, setResponse] = React.useState<PaginatedGrammarResponseDto>({
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

    async function loadGrammar() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const payload = await getGrammarList(
          {
            page,
            perPage: PAGE_SIZE,
            search: deferredSearch || undefined,
            jlpt: selectedJLPT === "all" ? undefined : selectedJLPT,
            difficulty:
              selectedDifficulty === "all"
                ? undefined
                : Number.parseInt(selectedDifficulty, 10),
            tag: selectedTag ?? undefined,
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
          setErrorMessage(getCatalogErrorMessage(error, "Não foi possível carregar a gramática."))
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

    void loadGrammar()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [isInitializing, requestVersion, page, deferredSearch, selectedJLPT, selectedDifficulty, selectedTag, sortBy, order])

  const visibleItems = response.data
  const pagination = response.pagination
  const hasResults = !isLoading && !errorMessage
  const itemToRestore = params.get("item")
  useRestoreCatalogItem(itemToRestore ? `catalog-item-${itemToRestore}` : null, hasResults && pagination.page === page)
  const studiedCount = visibleItems.filter((item) => item.userProgress?.isStudied).length

  const hasFilters = selectedJLPT !== "all" || selectedDifficulty !== "all" || selectedTag !== null || Boolean(deferredSearch)
  const canResetQuery = hasFilters || sortBy !== "position" || order !== "asc"

  function resetQuery() {
    setSearchQuery("")
    updateCatalogQuery({ search: null, jlpt: null, difficulty: null, tag: null, sort: null, order: null, page: null })
  }

  const filterTags = React.useMemo(() => {
    const pageTags = Array.from(new Set(response.data.flatMap((item) => item.tags))).sort().slice(0, 18)
    return selectedTag && !pageTags.includes(selectedTag) ? [...pageTags, selectedTag] : pageTags
  }, [response.data, selectedTag])

  return (
    <DashboardShell
      title="Gramática"
      subtitle="Consulte estruturas, contextos e exemplos do JLPT"
      kanji="文"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        <motion.div variants={itemVariants}>
          <CatalogOverview
            isLoading={isLoading}
            onRefresh={reloadCatalog}
            metrics={[
              { label: "Total da consulta", value: hasResults ? pagination.total : null },
              { label: "Estudados nesta página", value: hasResults && isAuthenticated ? studiedCount : null },
              { label: "N5 nesta página", value: hasResults ? visibleItems.filter((item) => item.jlpt === "N5").length : null },
              { label: "N4 nesta página", value: hasResults ? visibleItems.filter((item) => item.jlpt === "N4").length : null },
              { label: "N3 nesta página", value: hasResults ? visibleItems.filter((item) => item.jlpt === "N3").length : null },
              { label: "N2/N1 nesta página", value: hasResults ? visibleItems.filter((item) => item.jlpt === "N2" || item.jlpt === "N1").length : null },
            ]}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={catalogSurface}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 xl:flex-row">
                <CatalogField id="grammar-search" label="Busca" className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="grammar-search"
                      placeholder="Buscar padrão, título, explicação ou exemplo..."
                      disabled={isInitializing}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        updateCatalogQuery({ search: e.target.value, page: null })
                      }}
                      className="pl-9 bg-secondary/50 border-border"
                    />
                  </div>
                </CatalogField>
                <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 xl:flex-2">
                  <CatalogField id="grammar-jlpt" label="JLPT">
                    <Select
                      value={selectedJLPT}
                      disabled={isInitializing}
                      onValueChange={(value) => {
                        updateCatalogQuery({ jlpt: value === "all" ? null : value, page: null })
                      }}
                    >
                      <SelectTrigger id="grammar-jlpt" className="bg-secondary/40">
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

                  <CatalogField id="grammar-difficulty" label="Dificuldade">
                    <Select
                      value={selectedDifficulty}
                      disabled={isInitializing}
                      onValueChange={(value) => {
                        updateCatalogQuery({ difficulty: value === "all" ? null : value, page: null })
                      }}
                    >
                      <SelectTrigger id="grammar-difficulty" className="bg-secondary/40">
                        <Layers className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="1">Básico (1)</SelectItem>
                        <SelectItem value="2">Intermediário (2)</SelectItem>
                        <SelectItem value="3">Avançado (3)</SelectItem>
                        <SelectItem value="4">Muito avançado (4)</SelectItem>
                        <SelectItem value="5">Especialista (5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </CatalogField>

                  <CatalogField id="grammar-sort" label="Ordenar por">
                    <Select
                      value={sortBy}
                      disabled={isInitializing}
                      onValueChange={(value) => {
                        updateCatalogQuery({ sort: value === "position" ? null : value, page: null })
                      }}
                    >
                      <SelectTrigger id="grammar-sort" className="bg-secondary/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CatalogField>

                  <CatalogField id="grammar-order" label="Ordem">
                    <Select
                      value={order}
                      disabled={isInitializing}
                      onValueChange={(value) => {
                        updateCatalogQuery({ order: value === "asc" ? null : value, page: null })
                      }}
                    >
                      <SelectTrigger id="grammar-order" className="bg-secondary/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascendente</SelectItem>
                        <SelectItem value="desc">Descendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </CatalogField>
                </div>
                {canResetQuery && (
                  <Button type="button" variant="outline" className="self-end" onClick={resetQuery}>
                    Limpar filtros
                  </Button>
                )}
              </div>

              {filterTags.length > 0 && (
                <div role="group" aria-label="Filtro por tag" className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
                  <span className="text-xs font-medium text-muted-foreground">Tags</span>
                  {filterTags.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      size="sm"
                      variant={selectedTag === tag ? "secondary" : "outline"}
                      aria-label={`Filtrar por tag ${tag}`}
                      aria-pressed={selectedTag === tag}
                      className="h-auto min-h-8 max-w-full whitespace-normal [overflow-wrap:anywhere]"
                      onClick={() => {
                        updateCatalogQuery({ tag: selectedTag === tag ? null : tag, page: null })
                      }}
                    >
                      {selectedTag === tag && <span aria-hidden="true">×</span>}
                      {tag}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {errorMessage ? (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha ao carregar gramática</AlertTitle>
              <AlertDescription>
                {errorMessage}
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/40 hover:bg-red-500/10"
                    onClick={reloadCatalog}
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                    Tentar novamente
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : null}

        {isLoading ? <LoadingGrid /> : visibleItems.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((grammar) => {
              const progress = isAuthenticated ? grammar.userProgress : undefined

              return (
                <Card key={grammar.id} id={`catalog-item-${grammar.id}`} className={cn(catalogItemSurface, "relative h-full")}>
                  <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {grammar.jlpt && <Badge variant="outline">{grammar.jlpt}</Badge>}
                      {grammar.formalityLevel && <span className="[overflow-wrap:anywhere]">{grammar.formalityLevel}</span>}
                      {!!grammar.difficulty && <span>Dificuldade {grammar.difficulty}/5</span>}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h2 lang="ja" className={cn(catalogTerm, "text-xl font-semibold leading-snug sm:text-2xl")}>{grammar.pattern}</h2>
                      {grammar.title && <p className="text-sm font-medium [overflow-wrap:anywhere]">{grammar.title}</p>}
                      {grammar.shortExplanation && (
                        <p className="line-clamp-3 text-sm text-muted-foreground [overflow-wrap:anywhere]">{grammar.shortExplanation}</p>
                      )}
                    </div>
                    <div className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      {progress
                        ? `Confiança ${progress.confidenceLevel}/5 · ${progress.reviewCount} ${progress.reviewCount === 1 ? "revisão" : "revisões"}`
                        : missingProgress}
                    </div>
                    <CatalogDetailLink catalogPath={grammarCatalogPath} query={params.toString()} id={grammar.id} name={grammar.pattern} />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {hasResults && visibleItems.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="space-y-3 py-12 text-center"
          >
            {pagination.total > 0 ? (
              <>
                <h2 className="font-semibold">Esta página não tem resultados</h2>
                <Button size="sm" variant="outline" onClick={() => updateCatalogQuery({ page: null })}>
                  Voltar à primeira página
                </Button>
              </>
            ) : hasFilters ? (
              <>
                <h2 className="font-semibold">Nenhum ponto gramatical corresponde aos filtros</h2>
                <p className="text-sm text-muted-foreground">Altere a busca ou limpe os filtros para ampliar a consulta.</p>
              </>
            ) : (
              <>
                <h2 className="font-semibold">Nenhum ponto gramatical publicado</h2>
                <p className="text-sm text-muted-foreground">Os pontos aparecerão aqui quando forem publicados.</p>
              </>
            )}
          </motion.div>
        )}

        {pagination.pages > 1 && !isLoading && !errorMessage ? (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  Exibindo{" "}
                  <span className="font-medium text-foreground">
                    {(pagination.page - 1) * pagination.perPage + 1}
                    –{" "}
                    {Math.min(
                      pagination.page * pagination.perPage,
                      pagination.total,
                    )}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {pagination.total.toLocaleString("pt-BR")}
                  </span>{" "}
                  registros
                </p>
                <Pagination aria-label="Paginação de gramática" className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        aria-label="Página anterior"
                        disabled={page <= 1}
                        onClick={() => updateCatalogQuery({ page: page > 2 ? String(page - 1) : null })}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:block">Anterior</span>
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <span className="h-9 px-3 text-xs text-muted-foreground">
                        Página {pagination.page} / {pagination.pages || 1}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        aria-label="Próxima página"
                        disabled={page >= pagination.pages}
                        onClick={() => updateCatalogQuery({ page: String(page + 1) })}
                      >
                        <span className="hidden sm:block">Próxima</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </motion.div>
    </DashboardShell>
  )
}
