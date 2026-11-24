"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Languages, Loader2, RefreshCcw, Star } from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { getCatalogErrorMessage } from "@/lib/catalog-api-error"
import { getKanjiList, type KanjiListItemDto } from "@/lib/kanji-api"
import { getVocabularyList, type VocabularyListItemDto } from "@/lib/vocabulary-api"

const PAGE_SIZE = 50

async function loadStudyPages<T>(
  load: (page: number) => Promise<{ data: T[]; pagination: { pages: number } }>,
): Promise<T[]> {
  const first = await load(1)
  const items = [...first.data]
  for (let page = 2; page <= first.pagination.pages; page++) {
    items.push(...(await load(page)).data)
  }
  return items
}

export default function StudyPage() {
  const { isInitializing, user } = useAdminAuth()
  return (
    <DashboardShell title="Estudar" subtitle="Itens que você marcou para estudar" kanji="習">
      {isInitializing ? (
        <p role="status" className="text-sm text-muted-foreground">Restaurando sua sessão...</p>
      ) : user ? (
        <React.Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Carregando lista de estudo…</p>}>
          <StudyLibrary key={user.id} />
        </React.Suspense>
      ) : (
        <p className="text-sm text-muted-foreground">Entre para consultar sua lista de estudo.</p>
      )}
    </DashboardShell>
  )
}

function StudyLibrary() {
  const params = useSearchParams()
  const tab = params.get("tab") === "vocab" ? "vocab" : "kanji"
  const [kanjis, setKanjis] = React.useState<KanjiListItemDto[]>([])
  const [vocab, setVocab] = React.useState<VocabularyListItemDto[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [reload, setReload] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    async function loadStudiedItems() {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const [kanji, vocabulary] = await Promise.all([
          loadStudyPages((page) => getKanjiList(
            { page, perPage: PAGE_SIZE, sort: "srsLevel", order: "desc", studied: true }, { signal },
          )),
          loadStudyPages((page) => getVocabularyList(
            { page, perPage: PAGE_SIZE, sort: "frequency", order: "desc", studied: true }, { signal },
          )),
        ])
        if (!signal.aborted) {
          setKanjis(kanji)
          setVocab(vocabulary)
        }
      } catch (error) {
        if (!signal.aborted) setErrorMessage(getCatalogErrorMessage(error, "Não foi possível carregar os itens estudados."))
      } finally {
        if (!signal.aborted) setIsLoading(false)
      }
    }
    void loadStudiedItems()
    return () => controller.abort()
  }, [reload])

  const totalStudied = kanjis.length + vocab.length

  function selectTab(value: string) {
    const url = new URL(window.location.href)
    if (value === "vocab") url.searchParams.set("tab", value)
    else url.searchParams.delete("tab")
    window.history.replaceState(null, "", url)
  }

  return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card className="bg-gradient-to-br from-[var(--gold)]/15 to-[var(--gold)]/5 border-[var(--gold)]/20">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--gold)]/20 flex items-center justify-center">
                  <span className="font-japanese text-3xl text-[var(--gold)]">習</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Sua lista de estudo</h2>
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "Carregando..." : errorMessage ? "Lista indisponível" : `${totalStudied} ${totalStudied === 1 ? "item marcado" : "itens marcados"} para estudar`}
                  </p>
                </div>
              </div>
              <Button variant="outline" disabled={isLoading} onClick={() => setReload((value) => value + 1)}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {errorMessage && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent role="alert" className="py-3 text-sm text-red-400">{errorMessage}</CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : errorMessage ? null : totalStudied === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-[var(--gold)]">
                <BookOpen className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium text-foreground">Nenhum item estudado ainda</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Vá até a página de Kanji ou Vocabulário e clique em "Estudar" para adicionar itens à sua lista de estudo.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button asChild className="bg-[var(--gold)] hover:bg-[var(--gold)]/90 text-white">
                  <Link href="/dashboard/kanji">
                    <Languages className="h-4 w-4 mr-2" />
                    Explorar Kanji
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/vocab">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Explorar Vocabulário
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={tab} onValueChange={selectTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="kanji" className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Kanji ({kanjis.length})
              </TabsTrigger>
              <TabsTrigger value="vocab" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Vocabulário ({vocab.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kanji" className="space-y-3">
              {kanjis.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum kanji estudado ainda.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {kanjis.map((kanji) => (
                    <Link key={kanji.id} href={`/dashboard/kanji/${kanji.id}`} prefetch={false} className="group block">
                      <Card className="h-full bg-card/60 border-border/50 transition-all duration-200 group-hover:border-[var(--gold)]/40 group-hover:-translate-y-0.5">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px]">{kanji.jlpt}</Badge>
                            <span className="text-xs text-muted-foreground">#{kanji.frequency}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[var(--gold)]/10 to-transparent border border-[var(--gold)]/15 flex items-center justify-center shrink-0">
                              <span lang="ja" className="font-japanese text-3xl text-[var(--gold)]">{kanji.character}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground line-clamp-2">{kanji.meanings.join(", ")}</p>
                              <p lang="ja" className="mt-1 font-japanese text-xs text-muted-foreground">
                                {kanji.onyomi.join("、") || kanji.kunyomi.join("、") || "—"}
                              </p>
                            </div>
                          </div>
                          {kanji.userProgress ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>SRS</span>
                                <span className="flex items-center gap-1">
                                  {kanji.userProgress.srsLevel}/5
                                  {kanji.userProgress.isMastered && (
                                    <Star className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                                  )}
                                </span>
                              </div>
                              <Progress aria-label="Nível SRS" value={kanji.userProgress.srsLevel} max={5} className="h-1.5" />
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Sem progresso registrado</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Ver detalhes</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="vocab" className="space-y-3">
              {vocab.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">Nenhum vocabulário estudado ainda.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {vocab.map((item) => (
                    <Link
                      key={item.id}
                      href={`/dashboard/vocab/${encodeURIComponent(item.id)}?source=study`}
                      prefetch={false}
                      aria-label={`Ver detalhes de ${item.word}`}
                      className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Card className="h-full bg-card/60 border-border/50 transition-all duration-200 group-hover:border-[var(--gold)]/40 group-hover:-translate-y-0.5">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px]">{item.jlpt}</Badge>
                            <span className="text-xs text-muted-foreground">{item.partOfSpeech || "—"}</span>
                          </div>
                          <div>
                            <p lang="ja" className="font-japanese text-xl text-foreground">{item.word}</p>
                            <p lang="ja" className="font-japanese text-xs text-muted-foreground">{item.reading}</p>
                          </div>
                          <p className="text-sm text-foreground line-clamp-2">{item.primaryMeaning || "—"}</p>
                          {item.userProgress ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>SRS</span>
                                <span className="flex items-center gap-1">
                                  {item.userProgress.srsLevel}/5
                                  {item.userProgress.isMastered && (
                                    <Star className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                                  )}
                                </span>
                              </div>
                              <Progress aria-label="Nível SRS" value={item.userProgress.srsLevel} max={5} className="h-1.5" />
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Sem progresso registrado</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Ver detalhes</span>
                            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
  )
}
