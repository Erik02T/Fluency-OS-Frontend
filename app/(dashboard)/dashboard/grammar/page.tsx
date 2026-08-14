"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Search,
  BookOpen,
  ChevronRight,
  Lightbulb,
  MessageCircle,
  Volume2,
  Star,
  Brain,
  Layers,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DashboardShell } from "@/components/layout"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  getGrammarDetail,
  getGrammarList,
  updateGrammarProgress,
  type GrammarDetailResponseDto,
  type GrammarListItemDto,
  type GrammarProgressResponseDto,
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Erro inesperado ao carregar gramática."
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

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: number
  color: string
}) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
          <span className={cn("font-japanese text-xl", color)}>{icon}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {value.toLocaleString("pt-BR")}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-3">
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

function LoadingDetail() {
  return (
    <div className="space-y-3 py-2">
      <div className="h-10 w-full rounded-lg bg-muted/40 animate-pulse" />
      <div className="h-16 w-full rounded-lg bg-muted/40 animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 w-full rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export default function GrammarPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedJLPT, setSelectedJLPT] = React.useState<"all" | JLPTLevel>("all")
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState<(typeof sortOptions)[number]["value"]>("position")
  const [order, setOrder] = React.useState<"asc" | "desc">("asc")
  const [page, setPage] = React.useState(1)
  const [accordionValue, setAccordionValue] = React.useState<string | undefined>(undefined)
  const [response, setResponse] = React.useState<PaginatedGrammarResponseDto>({
    data: [],
    pagination: { page: 1, perPage: PAGE_SIZE, total: 0, pages: 0 },
  })
  const [details, setDetails] = React.useState<Record<string, GrammarDetailResponseDto>>({})
  const [loadingDetailId, setLoadingDetailId] = React.useState<string | null>(null)
  const [progressLoadingId, setProgressLoadingId] = React.useState<string | null>(null)

  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const deferredSearch = React.useDeferredValue(searchQuery.trim())

  React.useEffect(() => {
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

    void loadGrammar()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [page, deferredSearch, selectedJLPT, sortBy, order])

  const visibleItems = React.useMemo(() => {
    if (selectedDifficulty === "all") {
      return response.data
    }

    return response.data.filter(
      (item) => item.difficulty === Number.parseInt(selectedDifficulty, 10),
    )
  }, [response.data, selectedDifficulty])

  const pagination = response.pagination
  const studiedCount = visibleItems.filter((item) => item.userProgress?.isStudied).length
  const masteredCount = visibleItems.filter(
    (item) => (item.userProgress?.confidenceLevel ?? 0) >= 4,
  ).length
  const n5Count = response.data.filter((item) => item.jlpt === "N5").length
  const n4Count = response.data.filter((item) => item.jlpt === "N4").length

  const handleAccordionChange = React.useCallback(
    async (nextValue: string | undefined) => {
      setAccordionValue(nextValue)

      if (!nextValue || details[nextValue]) {
        return
      }

      const item = response.data.find((g) => g.id === nextValue)
      if (!item) {
        return
      }

      try {
        setLoadingDetailId(nextValue)
        const detail = await getGrammarDetail(nextValue)
        setDetails((current) => ({ ...current, [nextValue]: detail }))
      } catch (error) {
        toast({
          title: "Falha ao carregar detalhe",
          description: parseApiMessage(getErrorMessage(error)),
          variant: "destructive",
        })
      } finally {
        setLoadingDetailId((current) => (current === nextValue ? null : current))
      }
    },
    [details, response.data],
  )

  const applyProgressResponse = React.useCallback(
    (id: string, progress: GrammarProgressResponseDto) => {
      setResponse((current) => ({
        ...current,
        data: current.data.map((item) =>
          item.id === id
            ? {
                ...item,
                userProgress: {
                  isStudied: progress.isStudied,
                  isFavorited: progress.isFavorited,
                  confidenceLevel: progress.confidenceLevel,
                  reviewCount: progress.reviewCount,
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
              isStudied: progress.isStudied,
              studiedAt: progress.studiedAt,
              isFavorited: progress.isFavorited,
              confidenceLevel: progress.confidenceLevel,
              notes: progress.notes,
              reviewCount: progress.reviewCount,
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
        const payload = await updateGrammarProgress(id, {
          action,
          understood: action === "review" ? true : undefined,
        })

        applyProgressResponse(id, payload)

        toast({
          title:
            action === "study"
              ? "Gramática marcada como estudada"
              : "Revisão registrada",
          description:
            action === "study"
              ? "O ponto gramatical entrou no seu progresso."
              : `Nível de confiança atualizado para ${payload.confidenceLevel}/5.`,
        })
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
    [applyProgressResponse],
  )

  const allTags = React.useMemo(
    () => Array.from(new Set(response.data.flatMap((item) => item.tags))).sort(),
    [response.data],
  )

  return (
    <DashboardShell
      title="Gramática"
      subtitle="Domine os padrões gramaticais do JLPT com dados reais do backend"
      kanji="文"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Dados ao vivo
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground mt-2">
                    {pagination.total.toLocaleString("pt-BR")} pontos gramaticais
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Listagem, detalhes e progresso conectados à API real de Grammar. O
                    progresso de estudo e revisão é persistido no banco.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(1)}
                  disabled={isLoading}
                >
                  <RefreshCcw
                    className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
                  />
                  Atualizar
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                <SummaryCard
                  label="Total"
                  value={pagination.total}
                  icon="全"
                  color="text-foreground"
                />
                <SummaryCard
                  label="Estudados"
                  value={studiedCount}
                  icon="習"
                  color="text-emerald-500"
                />
                <SummaryCard
                  label="N5"
                  value={n5Count}
                  icon="五"
                  color="text-[var(--teal)]"
                />
                <SummaryCard
                  label="N4"
                  value={n4Count}
                  icon="四"
                  color="text-[var(--neon-blue)]"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar padrão, título, explicação ou exemplo..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(1)
                    }}
                    className="pl-9 bg-secondary/50 border-border"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={selectedJLPT}
                    onValueChange={(value) => {
                      setSelectedJLPT(value as "all" | JLPTLevel)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[100px] bg-secondary/50 border-border">
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
                    value={selectedDifficulty}
                    onValueChange={(value) => {
                      setSelectedDifficulty(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[130px] bg-secondary/50 border-border">
                      <Layers className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Dificuldade" />
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

                  <Select
                    value={sortBy}
                    onValueChange={(value) => {
                      setSortBy(value as (typeof sortOptions)[number]["value"])
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[160px] bg-secondary/50 border-border">
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

                  <Select
                    value={order}
                    onValueChange={(value) => {
                      setOrder(value as "asc" | "desc")
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[130px] bg-secondary/50 border-border">
                      <SelectValue placeholder="Ordem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascendente</SelectItem>
                      <SelectItem value="desc">Descendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 mt-4 border-t border-border/50">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1 self-center">
                    Tags:
                  </span>
                  {allTags.slice(0, 12).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[11px]">
                      {tag}
                    </Badge>
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
                    onClick={() => setPage(1)}
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                    Tentar novamente
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : null}

        <motion.div variants={itemVariants}>
          {isLoading ? (
            <LoadingRows />
          ) : (
            <Accordion
              type="single"
              collapsible
              className="space-y-3"
              value={accordionValue}
              onValueChange={(v) => void handleAccordionChange(v)}
            >
              {visibleItems.map((grammar, index) => {
                const detail = details[grammar.id]
                const isConfidenceHigh = (grammar.userProgress?.confidenceLevel ?? 0) >= 4

                return (
                  <motion.div
                    key={grammar.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AccordionItem
                      value={grammar.id}
                      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden [&[data-state=open]]:bg-secondary/20"
                    >
                      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-secondary/30 [&[data-state=open]]:bg-transparent">
                        <div className="flex items-center gap-4 flex-1 text-left">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--gold)]/10 to-transparent border border-[var(--gold)]/20 flex items-center justify-center shrink-0">
                            <span className="font-japanese text-xl text-[var(--gold)]">
                              文
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-japanese text-lg text-foreground">
                                {grammar.pattern}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {grammar.jlpt}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[10px] normal-case"
                              >
                                {grammar.formalityLevel}
                              </Badge>
                              {isConfidenceHigh && (
                                <Star className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {grammar.title}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                                {grammar.shortExplanation.length > 80
                                  ? `${grammar.shortExplanation.slice(0, 80)}…`
                                  : grammar.shortExplanation}
                              </span>
                            </div>
                          </div>
                          <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    level <= grammar.difficulty
                                      ? "bg-[var(--torii-red)]"
                                      : "bg-secondary",
                                  )}
                                />
                              ))}
                            </div>
                            {grammar.userProgress ? (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span className="text-[11px] text-muted-foreground">
                                  Confiança {grammar.userProgress.confidenceLevel}/5
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2 transition-transform group-data-[state=open]:rotate-90" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        {loadingDetailId === grammar.id && !detail ? (
                          <LoadingDetail />
                        ) : detail ? (
                          <div className="space-y-4 pt-2">
                            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Explicação completa
                              </p>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                {detail.detailedExplanation ??
                                  grammar.shortExplanation}
                              </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                    Exemplos ({detail.examples.length})
                                  </p>
                                  <div className="space-y-2">
                                    {detail.examples.length > 0 ? (
                                      detail.examples.map((example, i) => (
                                        <div
                                          key={i}
                                          className="p-3 rounded-lg bg-background/50 border border-border/50"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                              <p className="font-japanese text-foreground mb-1">
                                                {example.japanese}
                                              </p>
                                              {example.reading ? (
                                                <p className="text-xs font-mono text-muted-foreground mb-1">
                                                  {example.reading}
                                                </p>
                                              ) : null}
                                              <p className="text-sm text-muted-foreground">
                                                {example.translation}
                                              </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 h-8 w-8"
                                              >
                                                <Volume2 className="h-4 w-4" />
                                              </Button>
                                              {!example.isNatural ? (
                                                <Badge
                                                  variant="outline"
                                                  className="text-[9px] normal-case"
                                                >
                                                  Didático
                                                </Badge>
                                              ) : null}
                                            </div>
                                          </div>
                                          {example.notes ? (
                                            <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-border/40">
                                              <Lightbulb className="h-3 w-3 text-[var(--neon-blue)] shrink-0 mt-0.5" />
                                              <p className="text-xs text-muted-foreground">
                                                {example.notes}
                                              </p>
                                            </div>
                                          ) : null}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-muted-foreground">
                                        Sem exemplos cadastrados para este ponto.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {detail.tags.length > 0 ? (
                                  <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                      Tags
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {detail.tags.map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="secondary"
                                          className="font-japanese text-[11px]"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                <Card className="bg-background/50 border-border/50">
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      <BookOpen className="h-4 w-4 text-[var(--torii-red)]" />
                                      Progresso
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">
                                        Estudado
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {detail.userProgress?.isStudied ? (
                                          <span className="text-emerald-500">
                                            Sim
                                          </span>
                                        ) : (
                                          "Não"
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">
                                        Confiança
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {detail.userProgress?.confidenceLevel ?? 0}
                                        /5
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-muted-foreground">
                                        Revisões
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {detail.userProgress?.reviewCount ?? 0}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>

                                <div className="flex flex-col gap-2">
                                  <Button
                                    className="w-full bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
                                    disabled={progressLoadingId === grammar.id}
                                    onClick={() =>
                                      void handleProgressUpdate(grammar.id, "study")
                                    }
                                  >
                                    {progressLoadingId === grammar.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processando...
                                      </>
                                    ) : (
                                      <>
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Marcar como estudado
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled={progressLoadingId === grammar.id}
                                    onClick={() =>
                                      void handleProgressUpdate(grammar.id, "review")
                                    }
                                  >
                                    {progressLoadingId === grammar.id ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                    )}
                                    Registrar revisão (entendi)
                                  </Button>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                  <Button variant="outline" size="sm" className="flex-1">
                                    <Brain className="h-4 w-4 mr-2" />
                                    AI Tutor
                                  </Button>
                                  <Button variant="outline" size="sm" className="flex-1">
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Discussão
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground py-4">
                            Detalhe indisponível no momento.
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                )
              })}
            </Accordion>
          )}
        </motion.div>

        {!isLoading && visibleItems.length === 0 && !errorMessage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <span className="font-japanese text-6xl text-muted-foreground/30 block mb-4">
              空
            </span>
            <p className="text-muted-foreground">
              Nenhuma gramática encontrada para os filtros atuais.
            </p>
          </motion.div>
        ) : null}
      </motion.div>
    </DashboardShell>
  )
}
