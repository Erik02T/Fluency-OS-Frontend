"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PlusIcon, Trash2Icon } from "lucide-react"

export interface AdminMeaningItem {
  meaning: string
  context?: string | null
  isPrimary?: boolean
}

export interface MeaningsSectionProps {
  values: AdminMeaningItem[]
  onChange: (next: AdminMeaningItem[]) => void
  prefix?: string
  errorsMap?: Record<string, string>
}

export function MeaningsSection({
  values,
  onChange,
  prefix = "meanings",
  errorsMap = {},
}: MeaningsSectionProps) {
  function handleFieldChange(index: number, patch: Partial<AdminMeaningItem>) {
    const next = values.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange(next)
  }

  function handleRemove(index: number) {
    const next = values.filter((_, i) => i !== index)
    onChange(next)
  }

  function handleAdd() {
    onChange([
      ...values,
      {
        meaning: "",
        context: "",
        isPrimary: values.length === 0,
      },
    ])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Meanings</Label>
          <p className="text-xs text-muted-foreground">
            Adicione pelo menos um significado. O primeiro marcado como primário será exibido no
            destaque.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Adicionar meaning
        </Button>
      </div>

      {values.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum meaning cadastrado. Clique em &quot;Adicionar meaning&quot; para começar.
        </div>
      )}

      {values.map((item, index) => {
        const base = `${prefix}[${index}]`
        return (
          <div
            key={`meaning-${index}`}
            className="rounded-md border p-4 space-y-3 bg-muted/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Meaning #{index + 1}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Boolean(item.isPrimary)}
                    onCheckedChange={(checked) => handleFieldChange(index, { isPrimary: checked })}
                  />
                  <span className="text-xs text-muted-foreground">Primário</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2Icon className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`${base}.meaning`} className="text-xs">
                  Meaning *
                </Label>
                <Input
                  id={`${base}.meaning`}
                  value={item.meaning}
                  onChange={(evt) => handleFieldChange(index, { meaning: evt.target.value })}
                  placeholder="Ex: To eat"
                  className={errorsMap[`${base}.meaning`] ? "border-destructive" : undefined}
                />
                {errorsMap[`${base}.meaning`] && (
                  <p className="text-xs text-destructive">{errorsMap[`${base}.meaning`]}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`${base}.context`} className="text-xs">
                  Context
                </Label>
                <Input
                  id={`${base}.context`}
                  value={item.context ?? ""}
                  onChange={(evt) => handleFieldChange(index, { context: evt.target.value })}
                  placeholder="Ex: Casual, Food"
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface AdminExampleItem {
  japanese: string
  reading?: string | null
  translation: string
  source?: string | null
  notes?: string | null
  isNatural?: boolean
}

export interface ExamplesSectionProps {
  values: AdminExampleItem[]
  onChange: (next: AdminExampleItem[]) => void
  prefix?: string
  errorsMap?: Record<string, string>
  showSource?: boolean
  showNotes?: boolean
  showIsNatural?: boolean
}

export function ExamplesSection({
  values,
  onChange,
  prefix = "examples",
  errorsMap = {},
  showSource = true,
  showNotes = false,
  showIsNatural = false,
}: ExamplesSectionProps) {
  function handleFieldChange(index: number, patch: Partial<AdminExampleItem>) {
    const next = values.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange(next)
  }

  function handleRemove(index: number) {
    const next = values.filter((_, i) => i !== index)
    onChange(next)
  }

  function handleAdd() {
    onChange([
      ...values,
      {
        japanese: "",
        reading: "",
        translation: "",
        source: showSource ? "" : undefined,
        notes: showNotes ? "" : undefined,
        isNatural: showIsNatural ? true : undefined,
      },
    ])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Examples</Label>
          <p className="text-xs text-muted-foreground">
            Adicione frases de exemplo. A leitura (reading) é opcional mas melhora a UX do aluno.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Adicionar example
        </Button>
      </div>

      {values.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum example cadastrado. Clique em &quot;Adicionar example&quot; para começar.
        </div>
      )}

      {values.map((item, index) => {
        const base = `${prefix}[${index}]`
        return (
          <div
            key={`example-${index}`}
            className="rounded-md border p-4 space-y-3 bg-muted/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Example #{index + 1}</span>
              <div className="flex items-center gap-3">
                {showIsNatural && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(item.isNatural)}
                      onCheckedChange={(checked) =>
                        handleFieldChange(index, { isNatural: checked })
                      }
                    />
                    <span className="text-xs text-muted-foreground">Natural</span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2Icon className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`${base}.japanese`} className="text-xs">
                  Japanese *
                </Label>
                <Input
                  id={`${base}.japanese`}
                  value={item.japanese}
                  onChange={(evt) => handleFieldChange(index, { japanese: evt.target.value })}
                  placeholder="Ex: 朝ご飯を食べます。"
                  className={errorsMap[`${base}.japanese`] ? "border-destructive" : undefined}
                />
                {errorsMap[`${base}.japanese`] && (
                  <p className="text-xs text-destructive">{errorsMap[`${base}.japanese`]}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`${base}.reading`} className="text-xs">
                  Reading
                </Label>
                <Input
                  id={`${base}.reading`}
                  value={item.reading ?? ""}
                  onChange={(evt) => handleFieldChange(index, { reading: evt.target.value })}
                  placeholder="Ex: あさごはんをたべます。"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label htmlFor={`${base}.translation`} className="text-xs">
                  Translation *
                </Label>
                <Input
                  id={`${base}.translation`}
                  value={item.translation}
                  onChange={(evt) => handleFieldChange(index, { translation: evt.target.value })}
                  placeholder="Ex: I eat breakfast."
                  className={errorsMap[`${base}.translation`] ? "border-destructive" : undefined}
                />
                {errorsMap[`${base}.translation`] && (
                  <p className="text-xs text-destructive">{errorsMap[`${base}.translation`]}</p>
                )}
              </div>

              {showSource && (
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor={`${base}.source`} className="text-xs">
                    Source
                  </Label>
                  <Input
                    id={`${base}.source`}
                    value={item.source ?? ""}
                    onChange={(evt) => handleFieldChange(index, { source: evt.target.value })}
                    placeholder="Ex: Genki I, Tatoeba"
                  />
                </div>
              )}

              {showNotes && (
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor={`${base}.notes`} className="text-xs">
                    Notes
                  </Label>
                  <Input
                    id={`${base}.notes`}
                    value={item.notes ?? ""}
                    onChange={(evt) => handleFieldChange(index, { notes: evt.target.value })}
                    placeholder="Observações sobre este exemplo."
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
