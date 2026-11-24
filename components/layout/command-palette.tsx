"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Brain, Zap } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { getSidebarNavigationFeatures } from "@/lib/navigation-features"
import { useUIStore } from "@/store"

export function CommandPalette() {
  const router = useRouter()
  const { isAuthenticated, isAdmin } = useAdminAuth()
  const navigation = getSidebarNavigationFeatures({ isAuthenticated, isAdmin })
  const { commandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette } = useUIStore()

  React.useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || (!event.metaKey && !event.ctrlKey)) return
      event.preventDefault()
      if (!event.repeat) toggleCommandPalette()
    }

    document.addEventListener("keydown", handleShortcut)
    return () => document.removeEventListener("keydown", handleShortcut)
  }, [toggleCommandPalette])

  function goTo(href: string) {
    setCommandPaletteOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      title="Busca de navegação"
      description="Encontre uma página ou abra uma ação rápida do aplicativo."
    >
      <CommandInput placeholder="Buscar páginas e ações…" aria-label="Buscar páginas e ações" />
      <CommandList aria-label="Páginas e ações" className="max-h-[min(25rem,60vh)]">
        <CommandEmpty>Nenhuma página ou ação encontrada.</CommandEmpty>

        <CommandGroup heading="Ações rápidas">
          <CommandItem value="Abrir fila de revisão" keywords={["SRS", "Review"]} onSelect={() => goTo("/dashboard/review")}>
            <Zap aria-hidden="true" /> Abrir fila de revisão
          </CommandItem>
          <CommandItem value="AI Tutor (demonstração)" onSelect={() => goTo("/dashboard/ai")}>
            <Brain aria-hidden="true" /> AI Tutor (demonstração)
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Páginas">
          {navigation.map((item) => (
            <CommandItem key={item.id} value={item.name} keywords={[item.description]} onSelect={() => goTo(item.href)}>
              <span aria-hidden="true" lang="ja" className="w-6 shrink-0 font-japanese text-muted-foreground">{item.kanji}</span>
              {item.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span><kbd>Enter</kbd> selecionar</span>
        <span><kbd>↑↓</kbd> navegar</span>
        <span><kbd>Esc</kbd> fechar</span>
      </div>
    </CommandDialog>
  )
}
