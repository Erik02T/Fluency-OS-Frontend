"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Target } from "lucide-react"
import {
  updateWeeklyGoals,
  type WeeklyGoalItemDto,
  type WeeklyPlanResponseDto,
} from "@/lib/planner-api"

interface EditGoalsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  currentGoals: WeeklyGoalItemDto[]
  onGoalsUpdated: (plan: WeeklyPlanResponseDto) => void
}

const GOAL_LABELS: Record<string, { label: string; unit: string; glyph: string }> = {
  IMMERSION: { label: "Tempo de Imersão", unit: "min", glyph: "時" },
  KANJI: { label: "Kanji Revisados", unit: "", glyph: "字" },
  VOCABULARY: { label: "Palavras Novas/Revisão", unit: "", glyph: "語" },
  GENERAL_REVIEW: { label: "Revisões Gerais", unit: "", glyph: "復" },
  GRAMMAR: { label: "Pontos Gramaticais", unit: "", glyph: "文" },
  READING: { label: "Leitura", unit: "min", glyph: "読" },
  ACTIVE_STUDY: { label: "Estudo Ativo", unit: "min", glyph: "学" },
  PASSIVE_STUDY: { label: "Estudo Passivo", unit: "min", glyph: "聴" },
}

export function EditGoalsModal({
  open,
  onOpenChange,
  planId,
  currentGoals,
  onGoalsUpdated,
}: EditGoalsModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [goals, setGoals] = React.useState<WeeklyGoalItemDto[]>(currentGoals)

  React.useEffect(() => {
    if (open) {
      setGoals(currentGoals)
    }
  }, [open, currentGoals])

  const handleGoalChange = (category: string, value: number) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.category === category ? { ...goal, targetValue: value } : goal,
      ),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que todos os valores são positivos
    const hasInvalidValue = goals.some(goal => goal.targetValue < 0)
    if (hasInvalidValue) {
      toast({
        title: "Valores inválidos",
        description: "Todos os valores devem ser positivos.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const updatedPlan = await updateWeeklyGoals(planId, goals)

      toast({
        title: "Metas atualizadas!",
        description: "Seus objetivos semanais foram salvos com sucesso.",
      })

      onGoalsUpdated(updatedPlan)
      onOpenChange(false)
    } catch (error) {
      console.error("[edit-goals-modal] Error updating goals:", error)
      toast({
        title: "Erro ao atualizar metas",
        description:
          error instanceof Error ? error.message : "Não foi possível atualizar as metas.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border/80 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <span className="font-japanese text-[var(--torii-red)] text-xl">
              目
            </span>
            Editar Metas Semanais
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ajuste seus objetivos de estudo para esta semana.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {goals.map((goal) => {
            const metadata = GOAL_LABELS[goal.category] || {
              label: goal.category,
              unit: "",
              glyph: "?",
            }
            return (
              <div key={goal.category} className="space-y-1.5">
                <Label
                  htmlFor={`goal-${goal.category}`}
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <span className="font-japanese text-sm text-muted-foreground">
                    {metadata.glyph}
                  </span>
                  {metadata.label}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`goal-${goal.category}`}
                    type="number"
                    min={0}
                    max={10000}
                    value={goal.targetValue}
                    onChange={(e) =>
                      handleGoalChange(goal.category, Number(e.target.value))
                    }
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {metadata.unit}
                  </span>
                </div>
              </div>
            )
          })}

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[var(--torii-red)] hover:bg-[var(--torii-red)]/90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Target className="h-4 w-4 mr-1" />
              )}
              Salvar Metas
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}