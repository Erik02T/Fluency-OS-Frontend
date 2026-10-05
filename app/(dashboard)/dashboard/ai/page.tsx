"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Brain, Send, Sparkles } from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function AITutorPage() {
  const [question, setQuestion] = React.useState("")
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "ai"; text: string }>>([])

  function handleSend() {
    if (!question.trim()) return
    setMessages((current) => [
      ...current,
      { role: "user", text: question.trim() },
      { role: "ai", text: "Funcionalidade de IA em desenvolvimento. Em breve você poderá tirar dúvidas sobre kanji, vocabulário e gramática com o assistente." },
    ])
    setQuestion("")
  }

  return (
    <DashboardShell title="AI Tutor" subtitle="Tire suas dúvidas sobre japonês" kanji="智">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card className="bg-gradient-to-br from-[var(--neon-blue)]/15 to-[var(--neon-blue)]/5 border-[var(--neon-blue)]/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--neon-blue)]/20 flex items-center justify-center">
                <Brain className="h-7 w-7 text-[var(--neon-blue)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Assistente de Japonês</h2>
                <p className="text-sm text-muted-foreground">
                  Pergunte sobre kanji, vocabulário, gramática ou cultura japonesa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6 text-[var(--neon-blue)]" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Comece perguntando algo como "O que significa 勉強?"
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        message.role === "user"
                          ? "bg-[var(--neon-blue)] text-white"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Digite sua pergunta..."
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSend()
                }}
                className="bg-secondary/40 border-border"
              />
              <Button
                onClick={handleSend}
                disabled={!question.trim()}
                className="bg-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/90 text-white shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardShell>
  )
}