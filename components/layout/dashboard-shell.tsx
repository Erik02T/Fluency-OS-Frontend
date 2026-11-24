"use client"

import * as React from "react"
import { MotionConfig } from "framer-motion"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { CommandPalette } from "./command-palette"
import { useUIStore } from "@/store"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  kanji?: string
}

export function DashboardShell({
  children,
  title,
  subtitle,
  kanji,
}: DashboardShellProps) {
  const { sidebarOpen } = useUIStore()

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 gradient-mesh" />
          <div className="absolute inset-0 kanji-pattern" />
        </div>

        <div className="hidden md:contents">
          <Sidebar />
        </div>

        <main
          className={cn(
            "min-h-screen min-w-0 relative motion-safe:transition-[margin-left] duration-300",
            sidebarOpen ? "md:ml-[280px]" : "md:ml-20",
          )}
        >
          <TopBar title={title} subtitle={subtitle} kanji={kanji} />
          <div className="min-w-0 p-4 md:p-6">{children}</div>
        </main>

        <CommandPalette />
      </div>
    </MotionConfig>
  )
}
