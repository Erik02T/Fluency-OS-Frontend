"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { enqueueReviewItem, getReviewErrorMessage, ReviewApiError, type ReviewQueueItemType } from "@/lib/review-api"
import { invalidateReviewQueue } from "@/store"

export function ContentStudyActions({
  itemType,
  itemId,
  isStudying,
  onStudy,
}: {
  itemType: ReviewQueueItemType
  itemId: string
  isStudying: boolean
  onStudy: () => void
}) {
  const { isInitializing, isAuthenticated } = useAdminAuth()
  const router = useRouter()
  const [isEnqueueing, setIsEnqueueing] = useState(false)
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])

  async function addToQueue() {
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller
    setIsEnqueueing(true)
    try {
      await enqueueReviewItem(itemType, itemId, { signal: controller.signal })
      if (controller.signal.aborted) return
      invalidateReviewQueue()
      toast({ title: "Item adicionado à fila de revisão" })
      router.push("/dashboard/review")
    } catch (error) {
      if (controller.signal.aborted) return
      const fallback = error instanceof ReviewApiError && error.status === 409
        ? "Este item está suspenso para revisão."
        : "Não foi possível adicionar o item. Tente novamente."
      toast({ title: "Fila de revisão", description: getReviewErrorMessage(error, fallback), variant: "destructive" })
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setIsEnqueueing(false)
    }
  }

  if (isInitializing) {
    return <span role="status" className="text-xs text-muted-foreground">Restaurando sessão…</span>
  }

  if (!isAuthenticated) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/login">Entrar para estudar e revisar</Link>
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={isStudying || isEnqueueing} onClick={onStudy}>
        {isStudying ? "Registrando estudo…" : "Estudar"}
      </Button>
      <Button variant="outline" size="sm" disabled={isStudying || isEnqueueing} onClick={() => void addToQueue()}>
        {isEnqueueing ? "Adicionando à fila…" : "Adicionar à fila de revisão"}
      </Button>
    </div>
  )
}
