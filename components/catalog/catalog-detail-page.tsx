"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, RefreshCcw, Shield } from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { CatalogApiError, getCatalogErrorMessage } from "@/lib/catalog-api-error"

type DetailPageProps<T> = {
  catalogPath: string
  title: string
  subtitle: string
  kanji: string
  missingTitle: string
  studyBackHref?: string
  load: (id: string, options: RequestInit) => Promise<T>
  actions?: (item: T) => React.ReactNode
  children: (item: T) => React.ReactNode
}

export function CatalogDetailPage<T>(props: DetailPageProps<T>) {
  const { id } = useParams<{ id: string }>()
  const { user } = useAdminAuth()
  return <DetailContent key={JSON.stringify([id, user?.id])} id={id} {...props} />
}

function DetailContent<T>({ id, catalogPath, title, subtitle, kanji, missingTitle, studyBackHref, load, actions, children }: DetailPageProps<T> & { id: string }) {
  const { isInitializing, isAdmin } = useAdminAuth()
  const params = useSearchParams()
  const returnQuery = new URLSearchParams(params.get("from") ?? "").toString()
  const catalogBackHref = returnQuery ? `${catalogPath}?${returnQuery}` : catalogPath
  const backHref = params.get("source") === "study" && studyBackHref ? studyBackHref : catalogBackHref
  const [item, setItem] = React.useState<T | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isMissing, setIsMissing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [version, reload] = React.useReducer((value: number) => value + 1, 0)

  React.useEffect(() => {
    if (isInitializing) return
    const controller = new AbortController()
    const { signal } = controller
    async function loadItem() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await load(id, { signal })
        if (signal.aborted) return
        setItem(result)
        setIsMissing(!result)
      } catch (err) {
        if (signal.aborted) return
        setItem(null)
        setIsMissing(err instanceof CatalogApiError && err.status === 404)
        setError(getCatalogErrorMessage(err, "Não foi possível carregar o detalhe."))
      } finally {
        if (!signal.aborted) setIsLoading(false)
      }
    }
    void loadItem()
    return () => controller.abort()
  }, [id, isInitializing, load, version])

  return (
    <DashboardShell title={title} subtitle={subtitle} kanji={kanji}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={backHref} scroll={!returnQuery}><ArrowLeft aria-hidden="true" /> Voltar</Link>
          </Button>
          {!isInitializing && isAdmin && (
            <Button variant="outline" asChild>
              <Link href={`${catalogPath}/admin`}><Shield aria-hidden="true" /> Admin</Link>
            </Button>
          )}
          {!isMissing && (
            <Button variant="outline" disabled={isLoading} onClick={reload}>
              <RefreshCcw aria-hidden="true" /> Recarregar
            </Button>
          )}
          {!isLoading && item && actions?.(item)}
        </div>

        {isLoading ? (
          <p role="status" className="text-sm text-muted-foreground">Carregando detalhe…</p>
        ) : item ? children(item) : isMissing ? (
          <Alert><AlertTitle>{missingTitle}</AlertTitle><AlertDescription>Volte ao catálogo para escolher outro item.</AlertDescription></Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTitle>Falha ao carregar detalhe</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{error}</p>
              <Button size="sm" variant="outline" onClick={reload}>Tentar novamente</Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardShell>
  )
}
