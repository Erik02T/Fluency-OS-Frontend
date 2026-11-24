"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { CatalogField } from "@/components/catalog/catalog-field"
import { CatalogOverview, catalogItemSurface, catalogSurface, catalogTerm } from "@/components/catalog/catalog-presentation"
import { CatalogDetailLink, readCatalogPage, updateCatalogQuery, useRestoreCatalogItem, vocabularyCatalogPath } from "@/components/catalog/catalog-navigation"
import { ContentStudyActions } from "@/components/content-study-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCatalogErrorMessage } from "@/lib/catalog-api-error"
import { useVocabularyStudy } from "@/hooks/use-vocabulary-study"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { cn } from "@/lib/utils"
import {
  getVocabularyList,
  type JLPTLevel,
  type PaginatedVocabularyResponseDto,
  type VocabularyListItemDto,
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
  query,
  isStudying,
  onStudy,
}: {
  item: VocabularyListItemDto
  query: string
  isStudying: boolean
  onStudy: () => void
}) {
  const { isAuthenticated } = useAdminAuth()
  const progress = isAuthenticated ? item.userProgress : undefined

  return (
    <Card id={`catalog-item-${item.id}`} className={cn(catalogItemSurface, "relative h-full")}>
      <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.jlpt && <Badge variant="outline">{item.jlpt}</Badge>}
          {item.partOfSpeech && <span className="[overflow-wrap:anywhere]">{item.partOfSpeech}</span>}
          {item.frequency != null && <span>Frequência #{item.frequency}</span>}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 lang="ja" className={cn(catalogTerm, "text-2xl font-semibold leading-snug sm:text-3xl")}>{item.word}</h2>
          {item.reading && (
            <p lang="ja" className="font-japanese text-sm text-muted-foreground [overflow-wrap:anywhere]">{item.reading}</p>
          )}
          <p className="text-sm [overflow-wrap:anywhere]">{item.primaryMeaning || "Significado indisponível"}</p>
        </div>

        <div className="space-y-3 border-t border-border/60 pt-3">
          {progress ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>SRS</span>
                <span>{progress.srsLevel}/5{progress.isMastered ? " · dominado" : ""}</span>
              </div>
              <Progress aria-label="Nível SRS" value={progress.srsLevel} max={5} />
            </div>
          ) : <p className="text-xs text-muted-foreground">{isAuthenticated ? "Sem progresso registrado" : "Entre para ver seu progresso"}</p>}
          <div className="relative z-10 w-fit">
            <ContentStudyActions itemType="vocabulary" itemId={item.id} isStudying={isStudying} onStudy={onStudy} />
          </div>
        </div>

        <CatalogDetailLink catalogPath={vocabularyCatalogPath} query={query} id={item.id} name={item.word} />
      </CardContent>
    </Card>
  )
}

export default function VocabPage() {
  const { user, isInitializing } = useAdminAuth()
  return (
    <React.Suspense fallback={<DashboardShell title="Vocabulário" kanji="語"><LoadingGrid /></DashboardShell>}>
      <VocabularyCatalog key={user?.id ?? "visitor"} isInitializing={isInitializing} />
    </React.Suspense>
  )
}

function VocabularyCatalog({ isInitializing }: { isInitializing: boolean }) {
  const params = useSearchParams()
  const { studyingId, study } = useVocabularyStudy()
  const { isAuthenticated } = useAdminAuth()
  const [searchQuery, setSearchQuery] = React.useState(params.get("search") ?? "")
  const selectedJlpt = jlptOptions.find((option) => option.value === params.get("jlpt"))?.value ?? "all"
  const sortBy = sortOptions.find((option) => option.value === params.get("sort"))?.value ?? "frequency"
  const order = params.get("order") === "desc" ? "desc" : "asc"
  const page = readCatalogPage(params.get("page"))
  const [requestVersion, reloadCatalog] = React.useReducer((version: number) => version + 1, 0)
  const [response, setResponse] = React.useState<PaginatedVocabularyResponseDto>({
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
        }
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          setErrorMessage(getCatalogErrorMessage(error, "Não foi possível carregar o vocabulário."))
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
  }, [isInitializing, requestVersion, page, deferredSearch, selectedJlpt, sortBy, order])

  const allTags = React.useMemo(
    () => Array.from(new Set(response.data.flatMap((item) => item.tags))).sort(),
    [response.data],
  )

  const requestedTag = params.get("tag")
  const pageTag = requestedTag && allTags.includes(requestedTag) ? requestedTag : null
  const visibleItems = pageTag === null ? response.data : response.data.filter((item) => item.tags.includes(pageTag))

  const pagination = response.pagination
  const hasResults = !isLoading && !errorMessage
  const itemToRestore = params.get("item")
  useRestoreCatalogItem(itemToRestore ? `catalog-item-${itemToRestore}` : null, hasResults && pagination.page === page)
  const studiedCount = visibleItems.filter((item) => item.userProgress).length
  const masteredCount = visibleItems.filter((item) => item.userProgress?.isMastered).length
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.perPage + 1
  const endItem = Math.min(pagination.page * pagination.perPage, pagination.total)

  return (
    <DashboardShell
      title="Vocabulário"
      subtitle="Consulte palavras, leituras e exemplos de uso"
      kanji="語"
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <CatalogOverview
          isLoading={isLoading}
          onRefresh={reloadCatalog}
          metrics={[
            { label: "Total da consulta", value: hasResults ? pagination.total : null },
            { label: "Visíveis nesta página", value: hasResults ? visibleItems.length : null },
            { label: "Visíveis com progresso", value: hasResults && isAuthenticated ? studiedCount : null },
            { label: "Visíveis dominados", value: hasResults && isAuthenticated ? masteredCount : null },
          ]}
        />

        <Card className={catalogSurface}>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1.8fr)_repeat(4,minmax(0,1fr))]">
              <CatalogField id="vocab-search" label="Busca" className="col-span-full lg:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="vocab-search"
                    placeholder="Buscar palavra, leitura, significado..."
                    disabled={isInitializing}
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value)
                      updateCatalogQuery({ search: event.target.value, tag: null, page: null })
                    }}
                    className="pl-9 bg-secondary/40 border-border"
                  />
                </div>
              </CatalogField>

              <CatalogField id="vocab-jlpt" label="JLPT">
                <Select
                  value={selectedJlpt}
                  disabled={isInitializing}
                  onValueChange={(value) => {
                    updateCatalogQuery({ jlpt: value === "all" ? null : value, tag: null, page: null })
                  }}
                >
                  <SelectTrigger id="vocab-jlpt" className="bg-secondary/40">
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

              <CatalogField id="vocab-tag" label="Tag nesta página">
                <Select
                  value={pageTag === null ? "all" : `tag:${pageTag}`}
                  disabled={isLoading || Boolean(errorMessage) || allTags.length === 0}
                  onValueChange={(value) => updateCatalogQuery({ tag: value === "all" ? null : value.slice(4) })}
                >
                  <SelectTrigger id="vocab-tag" className="bg-secondary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={`tag:${tag}`}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CatalogField>

              <CatalogField id="vocab-sort" label="Ordenar por">
                <Select
                  value={sortBy}
                  disabled={isInitializing}
                  onValueChange={(value) => {
                    updateCatalogQuery({ sort: value === "frequency" ? null : value, tag: null, page: null })
                  }}
                >
                  <SelectTrigger id="vocab-sort" className="bg-secondary/40">
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

              <CatalogField id="vocab-order" label="Ordem">
                <Select
                  value={order}
                  disabled={isInitializing}
                  onValueChange={(value) => {
                    updateCatalogQuery({ order: value === "asc" ? null : value, tag: null, page: null })
                  }}
                >
                  <SelectTrigger id="vocab-order" className="bg-secondary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascendente</SelectItem>
                    <SelectItem value="desc">Descendente</SelectItem>
                  </SelectContent>
                </Select>
              </CatalogField>
            </div>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Falha ao carregar vocabulário</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
            <Button variant="outline" size="sm" className="mt-2" onClick={reloadCatalog}>
              Tentar novamente
            </Button>
          </Alert>
        ) : null}

        {errorMessage ? null : isLoading ? (
          <LoadingGrid />
        ) : visibleItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <VocabularyResultCard
                key={item.id}
                item={item}
                query={params.toString()}
                isStudying={studyingId === item.id}
                onStudy={() => void study(item.id)}
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

        {hasResults && <Card className={catalogSurface}>
          <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-muted-foreground">
              {visibleItems.length} de {response.data.length} itens visíveis nesta página.{" "}
              Faixa da consulta: {startItem}–{endItem} de {pagination.total.toLocaleString("pt-BR")}.
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 lg:shrink-0">
              <Button
                variant="outline"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => updateCatalogQuery({ page: page > 2 ? String(page - 1) : null, tag: null })}
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
                onClick={() => updateCatalogQuery({ page: String(page + 1), tag: null })}
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
