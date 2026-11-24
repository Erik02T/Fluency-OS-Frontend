import type { ReactNode } from "react"
import { RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const catalogSurface = "min-w-0 rounded-2xl border-border/60 bg-card/60 py-0 shadow-none"
export const catalogItemSurface = cn(
  catalogSurface,
  "motion-safe:transition-colors hover:border-[var(--torii-red)]/40 focus-within:border-ring/60",
)
export const catalogDetailColumns = "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
export const catalogTerm = "font-japanese text-[var(--sakura-pink)] [overflow-wrap:anywhere]"

export function CatalogOverview({
  metrics,
  isLoading,
  onRefresh,
  actions,
}: {
  metrics: ReadonlyArray<{ label: string; value: number | null }>
  isLoading: boolean
  onRefresh: () => void
  actions?: ReactNode
}) {
  return (
    <Card className={catalogSurface}>
      <section aria-label="Resumo da consulta" className="flex flex-wrap items-start gap-x-6 gap-y-4 p-4 sm:p-5">
        <dl
          aria-busy={isLoading}
          className="grid min-w-0 flex-[1_1_24rem] grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]"
        >
          {metrics.map(({ label, value }, index) => (
            <div key={label} className="flex min-w-0 flex-col-reverse gap-1 border-l border-border pl-3">
              <dt className="text-xs leading-snug text-muted-foreground">{label}</dt>
              <dd className={cn("text-xl font-semibold tabular-nums", index === 0 && "text-[var(--sakura-pink)]")}>
                {value?.toLocaleString("pt-BR") ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2">
          {actions}
          <Button type="button" variant="outline" disabled={isLoading} onClick={onRefresh}>
            <RefreshCcw aria-hidden="true" className={cn(isLoading && "motion-safe:animate-spin")} />
            Atualizar
          </Button>
        </div>
      </section>
    </Card>
  )
}

export function CatalogDetailSection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("min-w-0 space-y-3 rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4 [overflow-wrap:anywhere]", className)}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  )
}
