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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus } from "lucide-react"
import {
  createPlannerTask,
  type CreatePlannerTaskDto,
  type PlannerCategory,
  type PlannerTaskItemResponseDto,
  type PlannerTaskPriorityEnum,
} from "@/lib/planner-api"

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: string
  onTaskCreated: (task: PlannerTaskItemResponseDto) => void
}

const CATEGORY_OPTIONS: {
  value: PlannerCategory
  label: string
  glyph: string
}[] = [
  { value: "KANJI", label: "Kanji", glyph: "字" },
  { value: "VOCABULARY", label: "Vocabulário", glyph: "語" },
  { value: "GRAMMAR", label: "Gramática", glyph: "文" },
  { value: "CHUNK", label: "Chunks & Expressões", glyph: "塊" },
  { value: "READING", label: "Leitura", glyph: "読" },
  { value: "IMMERSION", label: "Imersão", glyph: "映" },
  { value: "ACTIVE_STUDY", label: "Estudo Ativo", glyph: "学" },
  { value: "PASSIVE_STUDY", label: "Estudo Passivo", glyph: "聴" },
  { value: "REVIEW", label: "Revisão Geral", glyph: "復" },
  { value: "GENERAL", label: "Geral", glyph: "全" },
  { value: "OTHER", label: "Outro", glyph: "他" },
]

export function AddTaskModal({
  open,
  onOpenChange,
  defaultDate,
  onTaskCreated,
}: AddTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [category, setCategory] = React.useState<PlannerCategory>("KANJI")
  const [date, setDate] = React.useState(
    defaultDate || new Date().toISOString().split("T")[0],
  )
  const [scheduledTime, setScheduledTime] = React.useState("")
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(20)
  const [priority, setPriority] = React.useState<PlannerTaskPriorityEnum>("MEDIUM")

  React.useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate)
    }
  }, [defaultDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira o título da tarefa.",
        variant: "destructive",
      })
      return
    }

    if (!date) {
      toast({
        title: "Data obrigatória",
        description: "Selecione a data de execução.",
        variant: "destructive",
      })
      return
    }

    if (Number(estimatedMinutes) < 1) {
      toast({
        title: "Duração inválida",
        description: "A duração mínima é de 1 minuto.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const payload: CreatePlannerTaskDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        date,
        scheduledTime: scheduledTime || undefined,
        estimatedMinutes: Number(estimatedMinutes) || 15,
        priority,
      }

      const created = await createPlannerTask(payload)

      toast({
        title: "Tarefa adicionada!",
        description: `"${created.title}" foi agendada para ${created.date}.`,
      })

      // Reset form
      setTitle("")
      setDescription("")
      setScheduledTime("")
      setEstimatedMinutes(20)
      setCategory("KANJI")
      setPriority("MEDIUM")

      onTaskCreated(created)
      onOpenChange(false)
    } catch (error) {
      console.error("[add-task-modal] Error creating task:", error)
      toast({
        title: "Erro ao criar tarefa",
        description:
          error instanceof Error ? error.message : "Não foi possível criar a tarefa.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border/80 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <span className="font-japanese text-[var(--torii-red)] text-xl">
              務
            </span>
            Nova Tarefa de Estudo
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Defina sua meta diária de estudo ou revisão.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-medium">
              Título da Tarefa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="Ex: Revisar 20 kanjis N4, assistir anime sem legenda..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-medium">
              Anotações / Descrição (opcional)
            </Label>
            <Textarea
              id="task-desc"
              placeholder="Ex: Focar nas leituras Onyomi e nas frases mineradas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Categoria</Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as PlannerCategory)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <span className="font-japanese text-xs text-muted-foreground">
                          {opt.glyph}
                        </span>
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Prioridade</Label>
              <Select
                value={priority}
                onValueChange={(val) =>
                  setPriority(val as PlannerTaskPriorityEnum)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Prioridade..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-date" className="text-xs font-medium">
                Data
              </Label>
              <Input
                id="task-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-time" className="text-xs font-medium">
                Horário
              </Label>
              <Input
                id="task-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-duration" className="text-xs font-medium">
                Duração (min)
              </Label>
              <Input
                id="task-duration"
                type="number"
                min={1}
                max={720}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                disabled={isSubmitting}
              />
            </div>
          </div>

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
                <Plus className="h-4 w-4 mr-1" />
              )}
              Criar Tarefa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
