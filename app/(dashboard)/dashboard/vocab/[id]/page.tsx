"use client"

import { CatalogDetailPage } from "@/components/catalog/catalog-detail-page"
import { CatalogAudio } from "@/components/catalog/catalog-audio"
import { vocabularyCatalogPath } from "@/components/catalog/catalog-navigation"
import {
  CatalogDetailSection,
  catalogDetailColumns,
  catalogSurface,
  catalogTerm,
} from "@/components/catalog/catalog-presentation"
import { ContentStudyActions } from "@/components/content-study-actions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { useVocabularyStudy } from "@/hooks/use-vocabulary-study"
import { cn } from "@/lib/utils"
import { getVocabularyDetail, type VocabularyDetailResponseDto } from "@/lib/vocabulary-api"

export default function VocabularyDetailPage() {
  return (
    <CatalogDetailPage
      catalogPath={vocabularyCatalogPath}
      title="Detalhe do vocabulário"
      subtitle="Leituras, significados e exemplos"
      kanji="語"
      missingTitle="Vocabulário indisponível"
      studyBackHref="/dashboard/study?tab=vocab"
      load={getVocabularyDetail}
      actions={(item) => <VocabularyActions id={item.id} />}
    >
      {(item) => <VocabularyDetail item={item} />}
    </CatalogDetailPage>
  )
}

function VocabularyActions({ id }: { id: string }) {
  const { studyingId, study } = useVocabularyStudy()
  return <ContentStudyActions itemType="vocabulary" itemId={id} isStudying={studyingId === id} onStudy={() => void study(id)} />
}

function VocabularyDetail({ item }: { item: VocabularyDetailResponseDto }) {
  const { isAuthenticated } = useAdminAuth()
  const progress = isAuthenticated ? item.userProgress : undefined

  return (
    <div className={catalogDetailColumns}>
      <Card className={catalogSurface}>
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="space-y-3">
            <h2 lang="ja" className={cn(catalogTerm, "text-3xl font-semibold sm:text-4xl")}>{item.word}</h2>
            {item.reading && <p lang="ja" className="font-japanese text-muted-foreground [overflow-wrap:anywhere]">{item.reading}</p>}
            <div className="flex flex-wrap gap-2">
              {item.jlpt && <Badge>{item.jlpt}</Badge>}
              {item.partOfSpeech && <Badge variant="outline" className="max-w-full whitespace-normal [overflow-wrap:anywhere]">{item.partOfSpeech}</Badge>}
              {item.frequency != null && <Badge variant="outline">Frequência #{item.frequency}</Badge>}
            </div>
            <CatalogAudio src={item.audioUrl} subject={item.word} />
          </div>

          <div className="grid gap-4 2xl:grid-cols-2">
            <CatalogDetailSection title="Significados e usos">
              {item.meanings.length > 0 ? (
                <ul className="divide-y divide-border/60">
                  {item.meanings.map((meaning, index) => (
                    <li key={`${meaning.meaning}-${index}`} className="space-y-1 py-2 first:pt-0 last:pb-0">
                      <p className="text-sm">{meaning.meaning}</p>
                      {meaning.context && <p className="text-sm text-muted-foreground">{meaning.context}</p>}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Sem significados cadastrados.</p>}
            </CatalogDetailSection>
            <CatalogDetailSection title="Progresso">
              {progress ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span>Nível SRS</span><span>{progress.srsLevel}/5</span></div>
                  <Progress aria-label="Nível SRS" value={progress.srsLevel} max={5} />
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Revisões corretas</dt><dd>{progress.correctReviews}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Total de revisões</dt><dd>{progress.totalReviews}</dd></div>
                  </dl>
                </div>
              ) : <p className="text-sm text-muted-foreground">{isAuthenticated ? "Sem progresso registrado" : "Entre para ver seu progresso"}</p>}
            </CatalogDetailSection>
          </div>
          {item.notes && (
            <CatalogDetailSection title="Notas de uso">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.notes}</p>
            </CatalogDetailSection>
          )}
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
                  {example.source && <p className="text-xs text-muted-foreground">{example.source}</p>}
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
