"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, CheckCircle2 } from "lucide-react"
import { CatalogDetailPage } from "@/components/catalog/catalog-detail-page"
import { grammarCatalogPath } from "@/components/catalog/catalog-navigation"
import { CatalogDetailSection, catalogDetailColumns, catalogSurface, catalogTerm } from "@/components/catalog/catalog-presentation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { getCatalogErrorMessage } from "@/lib/catalog-api-error"
import { cn } from "@/lib/utils"
import {
  getGrammarDetail,
  updateGrammarProgress,
  type GrammarDetailResponseDto,
  type GrammarProgressResponseDto,
  type UpdateGrammarProgressDto,
} from "@/lib/grammar-api"

export default function GrammarDetailPage() {
  return (
    <CatalogDetailPage
      catalogPath={grammarCatalogPath}
      title="Detalhe da gramática"
      subtitle="Formação, explicação e exemplos"
      kanji="文"
      missingTitle="Ponto gramatical indisponível"
      load={getGrammarDetail}
    >
      {(item) => <GrammarDetail item={item} />}
    </CatalogDetailPage>
  )
}

function GrammarDetail({ item }: { item: GrammarDetailResponseDto }) {
  const { isAuthenticated } = useAdminAuth()
  const [savedProgress, setSavedProgress] = React.useState<GrammarProgressResponseDto | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const pending = React.useRef(false)
  const lifetime = React.useRef<AbortController | null>(null)
  const progress = isAuthenticated ? savedProgress ?? item.userProgress : undefined

  React.useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    return () => controller.abort()
  }, [])

  async function saveProgress(payload: UpdateGrammarProgressDto) {
    const signal = lifetime.current?.signal
    if (!isAuthenticated || !signal || signal.aborted || pending.current) return
    pending.current = true
    setIsSaving(true)
    try {
      const updated = await updateGrammarProgress(item.id, payload, { signal })
      if (signal.aborted) return
      setSavedProgress(updated)
      toast({
        title: payload.action === "study" ? "Gramática marcada como estudada" : "Revisão registrada",
        description: payload.action === "review" ? `Nível de confiança atualizado para ${updated.confidenceLevel}/5.` : undefined,
      })
    } catch (error) {
      if (!signal.aborted) {
        toast({
          title: "Falha ao atualizar progresso",
          description: getCatalogErrorMessage(error, "Não foi possível salvar o progresso. Tente novamente."),
          variant: "destructive",
        })
      }
    } finally {
      pending.current = false
      if (!signal.aborted) setIsSaving(false)
    }
  }

  return (
    <div className={catalogDetailColumns}>
      <Card className={catalogSurface}>
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="space-y-3">
            <h2 lang="ja" className={cn(catalogTerm, "text-3xl font-semibold sm:text-4xl")}>{item.pattern}</h2>
            {item.title && <p className="text-muted-foreground [overflow-wrap:anywhere]">{item.title}</p>}
            <div className="flex flex-wrap gap-2">
              {item.jlpt && <Badge>{item.jlpt}</Badge>}
              {item.formalityLevel && <Badge variant="outline" className="max-w-full whitespace-normal [overflow-wrap:anywhere]">{item.formalityLevel}</Badge>}
              {!!item.difficulty && <Badge variant="outline">Dificuldade {item.difficulty}/5</Badge>}
            </div>
          </div>

          <CatalogDetailSection title="Formação e uso">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {item.detailedExplanation || item.shortExplanation || "Explicação indisponível."}
            </p>
          </CatalogDetailSection>
          <CatalogDetailSection title="Progresso">
            {progress ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Estudado</dt><dd>{progress.isStudied ? "Sim" : "Não"}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Confiança</dt><dd>{progress.confidenceLevel}/5</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Revisões</dt><dd>{progress.reviewCount}</dd></div>
              </dl>
            ) : <p className="text-sm text-muted-foreground">{isAuthenticated ? "Sem progresso registrado" : "Entre para ver seu progresso"}</p>}
            <GrammarProgressActions isSaving={isSaving} onSubmit={(payload) => void saveProgress(payload)} />
          </CatalogDetailSection>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-4">
        <CatalogDetailSection title="Exemplos">
          {item.examples.length > 0 ? (
            <ul className="space-y-3">
              {item.examples.map((example, index) => (
                <li key={`${example.japanese}-${index}`} className="space-y-1.5 rounded-xl border border-border/60 p-4">
                  <p lang="ja" className="font-japanese text-lg">{example.japanese}</p>
                  {example.reading && <p lang="ja" className="font-japanese text-sm text-muted-foreground">{example.reading}</p>}
                  <p className="text-sm">{example.translation}</p>
                  {example.notes && <p className="text-sm text-muted-foreground">{example.notes}</p>}
                  {!example.isNatural && <Badge variant="outline">Didático</Badge>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Sem exemplos cadastrados.</p>}
        </CatalogDetailSection>
        {item.tags.length > 0 && (
          <CatalogDetailSection title="Tags">
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => <Badge key={tag} variant="secondary" className="max-w-full whitespace-normal [overflow-wrap:anywhere]">{tag}</Badge>)}
            </div>
          </CatalogDetailSection>
        )}
      </div>
    </div>
  )
}

function GrammarProgressActions({
  isSaving,
  onSubmit,
}: {
  isSaving: boolean
  onSubmit: (progress: UpdateGrammarProgressDto) => void
}) {
  const { isInitializing, isAuthenticated } = useAdminAuth()
  const [confidence, setConfidence] = React.useState("")
  const confidenceId = React.useId()

  if (isInitializing) {
    return <p role="status" className="text-sm text-muted-foreground">Restaurando sessão…</p>
  }
  if (!isAuthenticated) {
    return (
      <Button variant="outline" asChild>
        <Link href="/dashboard/login">Entrar para estudar e revisar</Link>
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <Button
        className="w-full bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
        disabled={isSaving}
        onClick={() => onSubmit({ action: "study" })}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Marcar como estudado
      </Button>
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (confidence === "" || isSaving) return
          onSubmit({ action: "review", understood: true, confidenceLevel: Number(confidence) })
        }}
      >
        <label htmlFor={confidenceId} className="text-sm font-medium">Nível de confiança (0 a 5)</label>
        <select
          id={confidenceId}
          value={confidence}
          onChange={(event) => setConfidence(event.target.value)}
          disabled={isSaving}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <option value="" disabled>Selecione um nível</option>
          {[0, 1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}</option>)}
        </select>
        <Button type="submit" variant="outline" className="w-full" disabled={isSaving || confidence === ""}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Entendi · registrar revisão
        </Button>
      </form>
      {isSaving && <p role="status" className="text-sm text-muted-foreground">Salvando progresso…</p>}
    </div>
  )
}
