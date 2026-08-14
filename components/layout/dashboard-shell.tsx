"use client"

import * as React from "react"
import { motion } from "framer-motion"
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
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <div className="fixed inset-0 kanji-pattern pointer-events-none" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="min-h-screen relative"
      >
        <TopBar title={title} subtitle={subtitle} kanji={kanji} />
        <div className="p-6">{children}</div>
      </motion.main>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  )
}
