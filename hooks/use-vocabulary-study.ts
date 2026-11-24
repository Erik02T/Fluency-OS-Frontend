"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { getCatalogErrorMessage } from "@/lib/catalog-api-error"
import { updateVocabularyProgress } from "@/lib/vocabulary-api"
import { invalidateReviewQueue } from "@/store"

export function useVocabularyStudy() {
  const router = useRouter()
  const [studyingId, setStudyingId] = React.useState<string | null>(null)
  const pending = React.useRef(false)
  const lifetime = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    return () => controller.abort()
  }, [])

  async function study(id: string) {
    const signal = lifetime.current?.signal
    if (!signal || signal.aborted || pending.current) return
    pending.current = true
    setStudyingId(id)
    try {
      await updateVocabularyProgress(id, { action: "study" }, { signal })
      if (signal.aborted) return
      invalidateReviewQueue()
      toast({ title: "Vocabulário marcado como estudado" })
      router.push("/dashboard/study")
    } catch (error) {
      if (!signal.aborted) {
        toast({
          title: "Falha ao atualizar progresso",
          description: getCatalogErrorMessage(error, "Não foi possível registrar o estudo. Tente novamente."),
          variant: "destructive",
        })
      }
    } finally {
      pending.current = false
      if (!signal.aborted) setStudyingId(null)
    }
  }

  return { studyingId, study }
}
