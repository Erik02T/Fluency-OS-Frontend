import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function CatalogField({
  id,
  label,
  children,
  className,
}: {
  id: string
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5 [&_[data-slot=select-trigger]]:w-full [&_:focus-visible]:ring-ring", className)}>
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
