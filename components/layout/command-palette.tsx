"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Home,
  BookOpen,
  Languages,
  FileText,
  Headphones,
  Calendar,
  BarChart3,
  Settings,
  Zap,
  Brain,
  ArrowRight,
} from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useUIStore } from "@/store"

const navigationCommands = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    kanji: "家",
  },
  {
    name: "Revisão SRS",
    href: "/dashboard/review",
    icon: Zap,
    kanji: "復",
  },
  {
    name: "Estudo",
    href: "/dashboard/study",
    icon: BookOpen,
    kanji: "習",
  },
  {
    name: "AI Tutor",
    href: "/dashboard/ai",
    icon: Brain,
    kanji: "智",
  },
  {
    name: "Kanji Database",
    href: "/dashboard/kanji",
    icon: Languages,
    kanji: "字",
  },
  {
    name: "Vocabulário",
    href: "/dashboard/vocab",
    icon: BookOpen,
    kanji: "語",
  },
  {
    name: "Gramática",
    href: "/dashboard/grammar",
    icon: FileText,
    kanji: "文",
  },
  {
    name: "Imersão",
    href: "/dashboard/immersion",
    icon: Headphones,
    kanji: "聴",
  },
  {
    name: "Planner",
    href: "/dashboard/planner",
    icon: Calendar,
    kanji: "計",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    kanji: "析",
  },
  {
    name: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
    kanji: "設",
  },
]

const quickActions = [
  {
    name: "Iniciar Review",
    action: "review",
    icon: Zap,
    kanji: "復",
    description: "Revisar cards pendentes",
    href: "/dashboard/review",
  },
  {
    name: "AI Tutor",
    action: "ai",
    icon: Brain,
    kanji: "智",
    description: "Tire suas dúvidas",
    href: "/dashboard/ai",
  },
]

const recentKanji = [
  { kanji: "日", reading: "にち/ひ", meaning: "sol, dia" },
  { kanji: "本", reading: "ほん/もと", meaning: "livro, origem" },
  { kanji: "語", reading: "ご/かた", meaning: "língua, idioma" },
  { kanji: "学", reading: "がく/まな", meaning: "estudar, aprender" },
]

export function CommandPalette() {
  const router = useRouter()
  const { commandPaletteOpen, toggleCommandPalette } = useUIStore()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleCommandPalette()
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [toggleCommandPalette])

  const handleSelect = (href: string) => {
    toggleCommandPalette()
    router.push(href)
  }

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={toggleCommandPalette}>
      <Command className="rounded-xl border-border bg-popover">
        <CommandInput
          placeholder="Buscar comandos, kanji, vocabulário..."
          className="border-b border-border"
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            <div className="py-6 text-center">
              <span className="font-japanese text-4xl text-muted-foreground/30 block mb-2">
                空
              </span>
              <p className="text-sm text-muted-foreground">
                Nenhum resultado encontrado.
              </p>
            </div>
          </CommandEmpty>

          <CommandGroup heading="Ações Rápidas">
            {quickActions.map((action) => (
              <CommandItem
                key={action.name}
                onSelect={() => handleSelect(action.href)}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--torii-red)]/10 flex items-center justify-center">
                  <span className="font-japanese text-lg text-[var(--torii-red)]">
                    {action.kanji}
                  </span>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium">{action.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navegação">
            {navigationCommands.map((item) => (
              <CommandItem
                key={item.name}
                onSelect={() => handleSelect(item.href)}
                className="flex items-center gap-3 py-2 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <span className="font-japanese text-sm text-muted-foreground">
                    {item.kanji}
                  </span>
                </div>
                <span className="text-sm">{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Kanji Recentes">
            {recentKanji.map((item) => (
              <CommandItem
                key={item.kanji}
                onSelect={() => handleSelect("/dashboard/kanji")}
                className="flex items-center gap-3 py-2 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--gold)]/10 to-transparent border border-[var(--gold)]/20 flex items-center justify-center">
                  <span className="font-japanese text-xl text-[var(--gold)]">
                    {item.kanji}
                  </span>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium text-muted-foreground font-mono">
                    {item.reading}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.meaning}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">
                ↵
              </kbd>
              <span>selecionar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">
                ↑↓
              </kbd>
              <span>navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">
                esc
              </kbd>
              <span>fechar</span>
            </span>
          </div>
          <span className="font-japanese text-muted-foreground/50">検索</span>
        </div>
      </Command>
    </CommandDialog>
  )
}
