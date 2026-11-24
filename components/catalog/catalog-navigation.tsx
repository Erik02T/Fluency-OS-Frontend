"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const vocabularyCatalogPath = "/dashboard/vocab"
export const grammarCatalogPath = "/dashboard/grammar"

export function readCatalogPage(value: string | null) {
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export function updateCatalogQuery(values: Record<string, string | null>) {
  const url = new URL(window.location.href)
  url.searchParams.delete("item")
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  window.history.replaceState(null, "", url)
}

export function useRestoreCatalogItem(cardId: string | null, ready: boolean) {
  useEffect(() => {
    if (!cardId || !ready || document.activeElement !== document.body) return

    const card = document.getElementById(cardId)
    if (!card) {
      window.scrollTo({ top: 0 })
      return
    }

    card.scrollIntoView({ block: "center" })
    card.querySelector<HTMLAnchorElement>("a[data-catalog-detail-link]")?.focus()
  }, [cardId, ready])
}

export function CatalogDetailLink({
  catalogPath,
  query,
  id,
  name,
}: {
  catalogPath: string
  query: string
  id: string
  name: string
}) {
  const from = new URLSearchParams(query)
  from.set("item", id)
  const detailQuery = new URLSearchParams({ from: from.toString() })

  return (
    <Link
      href={`${catalogPath}/${encodeURIComponent(id)}?${detailQuery}`}
      onNavigate={() => {
        window.history.replaceState(window.history.state, "", `${catalogPath}?${from}`)
      }}
      aria-label={`Ver detalhes de ${name}`}
      data-catalog-detail-link=""
      className="flex items-center justify-between gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
    >
      Ver detalhes
      <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
    </Link>
  )
}
