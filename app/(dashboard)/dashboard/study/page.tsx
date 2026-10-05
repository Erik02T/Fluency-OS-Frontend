"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Languages, Loader2, RefreshCcw, Star } from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getKanjiList, type KanjiListItemDto } from "@/lib/kanji-api"
import { getVocabularyList, type VocabularyListItemDto } from "@/lib/vocabulary-api"

const PAGE_SIZE = 50

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Erro inesperado ao carregar itens estudados."
}

export default function StudyPage() {
  const [kanjis, setKanjis] = React.useState<KanjiListItemDto[]>([])
  const [vocab, setVocab] = React.useState<VocabularyListItemDto[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const loadStudiedItems = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [kanjiPayload, vocabPayload] = await Promise.all([
        getKanjiList({ page: 1, perPage: PAGE_SIZE, sort: "srsLevel", order: "desc" }),
        getVocabularyList({ page: 1, perPage: PAGE_SIZE, sort: "frequency", order: "desc" }),
      ])
      setKanjis(kanjiPayload.data.filter((item) => item.userProgress))
      setVocab(vocabPayload.data.filter((item) => item.userProgress))
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadStudiedItems()
  }, [loadStudiedItems])

  const totalStudied = kanjis.length + vocab.length

  return (
    <DashboardShell title="Estudar" subtitle="Itens que você marcou para estudar" kanji="習">
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
                    {isLoading ? "Carregando..." : `${totalStudied} ${totalStudied === 1 ? "item marcado" : "itens marcados"} para estudar`}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => void loadStudiedItems()}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {errorMessage && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="py-3 text-sm text-red-400">{errorMessage}</CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : totalStudied === 0 ? (
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
          <Tabs defaultValue="kanji" className="space-y-4">
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
                    <Link key={kanji.id} href={`/dashboard/kanji/${kanji.id}`} className="group block">
                      <Card className="h-full bg-card/60 border-border/50 transition-all duration-200 group-hover:border-[var(--gold)]/40 group-hover:-translate-y-0.5">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px]">{kanji.jlpt}</Badge>
                            <span className="text-xs text-muted-foreground">#{kanji.frequency}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[var(--gold)]/10 to-transparent border border-[var(--gold)]/15 flex items-center justify-center shrink-0">
                              <span className="font-japanese text-3xl text-[var(--gold)]">{kanji.character}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground line-clamp-2">{kanji.meanings.join(", ")}</p>
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                {kanji.onyomi.join("、") || kanji.kunyomi.join("、") || "—"}
                              </p>
                            </div>
                          </div>
                          {kanji.userProgress && (
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
                              <Progress value={kanji.userProgress.srsLevel * 20} className="h-1.5" />
                            </div>
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
                    <Card key={item.id} className="bg-card/60 border-border/50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px]">{item.jlpt}</Badge>
                          <span className="text-xs text-muted-foreground">{item.partOfSpeech || "—"}</span>
                        </div>
                        <div>
                          <p className="font-japanese text-xl text-foreground">{item.word}</p>
                          <p className="text-xs font-mono text-muted-foreground">{item.reading}</p>
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">{item.primaryMeaning || "—"}</p>
                        {item.userProgress && (
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
                            <Progress value={item.userProgress.srsLevel * 20} className="h-1.5" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </DashboardShell>
  )
}