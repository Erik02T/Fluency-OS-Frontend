"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { JLPTLevel, ReadingType } from "@/lib/kanji-api"

const jlptOptions: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"]
const readingTypeOptions: ReadingType[] = ["ONYOMI", "KUNYOMI", "NANORI"]

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export type FormErrors = Record<string, string>

export interface MeaningFormItem {
  id: string
  meaning: string
  language: string
  isPrimary: boolean
}

export interface ReadingFormItem {
  id: string
  reading: string
  type: ReadingType
  romanji: string
  isPrimary: boolean
}

export interface ExampleFormItem {
  id: string
  word: string
  reading: string
  meaning: string
  jlptLevel: "" | JLPTLevel
}

export interface RadicalFormItem {
  id: string
  character: string
  name: string
  meaning: string
  strokeCount: string
  position: string
  isPrimary: boolean
}

export interface KanjiStructuredFormState {
  character: string
  unicodeCodepoint: string
  jlptLevel: JLPTLevel
  grade: string
  strokeCount: string
  frequency: string
  notes: string
  romanization: string
  meanings: MeaningFormItem[]
  readings: ReadingFormItem[]
  examples: ExampleFormItem[]
  radicals: RadicalFormItem[]
}

export function createEmptyMeaningItem(): MeaningFormItem {
  return {
    id: createId(),
    meaning: "",
    language: "pt-BR",
    isPrimary: false,
  }
}

export function createEmptyReadingItem(): ReadingFormItem {
  return {
    id: createId(),
    reading: "",
    type: "ONYOMI",
    romanji: "",
    isPrimary: false,
  }
}

export function createEmptyExampleItem(): ExampleFormItem {
  return {
    id: createId(),
    word: "",
    reading: "",
    meaning: "",
    jlptLevel: "",
  }
}

export function createEmptyRadicalItem(): RadicalFormItem {
  return {
    id: createId(),
    character: "",
    name: "",
    meaning: "",
    strokeCount: "",
    position: "",
    isPrimary: false,
  }
}

function ErrorLine({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs text-destructive">{message}</p>
}

function RowHeader({
  title,
  onRemove,
}: {
  title: string
  onRemove: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="h-4 w-4 mr-1" />
        Remover
      </Button>
    </div>
  )
}

export function MeaningsSection({
  items,
  errors,
  onChange,
}: {
  items: MeaningFormItem[]
  errors: FormErrors
  onChange: (next: MeaningFormItem[]) => void
}) {
  return (
    <Card className="bg-background/40 border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Significados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-xl border border-border/50 p-3 space-y-3">
            <RowHeader
              title={`Meaning ${index + 1}`}
              onRemove={() => onChange(items.filter((value) => value.id !== item.id))}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Meaning</Label>
                <Input
                  value={item.meaning}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, meaning: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`meanings.${index}.meaning`]} />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Input
                  value={item.language}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, language: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`meanings.${index}.language`]} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={item.isPrimary}
                onCheckedChange={(checked) => {
                  onChange(items.map((value) => (
                    value.id === item.id ? { ...value, isPrimary: checked === true } : value
                  )))
                }}
              />
              <Label>Principal</Label>
            </div>
          </div>
        ))}

        <ErrorLine message={errors.meanings} />

        <Button type="button" variant="outline" onClick={() => onChange([...items, createEmptyMeaningItem()])}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar significado
        </Button>
      </CardContent>
    </Card>
  )
}

export function ReadingsSection({
  items,
  errors,
  onChange,
}: {
  items: ReadingFormItem[]
  errors: FormErrors
  onChange: (next: ReadingFormItem[]) => void
}) {
  return (
    <Card className="bg-background/40 border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Leituras</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-xl border border-border/50 p-3 space-y-3">
            <RowHeader
              title={`Reading ${index + 1}`}
              onRemove={() => onChange(items.filter((value) => value.id !== item.id))}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Leitura</Label>
                <Input
                  value={item.reading}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, reading: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`readings.${index}.reading`]} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={item.type}
                  onValueChange={(value) => {
                    onChange(items.map((currentItem) => (
                      currentItem.id === item.id
                        ? { ...currentItem, type: value as ReadingType }
                        : currentItem
                    )))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {readingTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorLine message={errors[`readings.${index}.type`]} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Romanji</Label>
                <Input
                  value={item.romanji}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, romanji: event.target.value } : value
                    )))
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={item.isPrimary}
                onCheckedChange={(checked) => {
                  onChange(items.map((value) => (
                    value.id === item.id ? { ...value, isPrimary: checked === true } : value
                  )))
                }}
              />
              <Label>Principal</Label>
            </div>
          </div>
        ))}

        <ErrorLine message={errors.readings} />

        <Button type="button" variant="outline" onClick={() => onChange([...items, createEmptyReadingItem()])}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar leitura
        </Button>
      </CardContent>
    </Card>
  )
}

export function ExamplesSection({
  items,
  errors,
  onChange,
}: {
  items: ExampleFormItem[]
  errors: FormErrors
  onChange: (next: ExampleFormItem[]) => void
}) {
  return (
    <Card className="bg-background/40 border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Exemplos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem exemplos. Adicione se quiser complementar o kanji.</p>
        )}

        {items.map((item, index) => (
          <div key={item.id} className="rounded-xl border border-border/50 p-3 space-y-3">
            <RowHeader
              title={`Example ${index + 1}`}
              onRemove={() => onChange(items.filter((value) => value.id !== item.id))}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Palavra</Label>
                <Input
                  value={item.word}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, word: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`examples.${index}.word`]} />
              </div>
              <div className="space-y-2">
                <Label>Leitura</Label>
                <Input
                  value={item.reading}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, reading: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`examples.${index}.reading`]} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Significado</Label>
                <Input
                  value={item.meaning}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, meaning: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`examples.${index}.meaning`]} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>JLPT (opcional)</Label>
                <Select
                  value={item.jlptLevel || "none"}
                  onValueChange={(value) => {
                    onChange(items.map((currentItem) => (
                      currentItem.id === item.id
                        ? { ...currentItem, jlptLevel: value === "none" ? "" : value as JLPTLevel }
                        : currentItem
                    )))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem nível</SelectItem>
                    {jlptOptions.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorLine message={errors[`examples.${index}.jlptLevel`]} />
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={() => onChange([...items, createEmptyExampleItem()])}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar exemplo
        </Button>
      </CardContent>
    </Card>
  )
}

export function RadicalsSection({
  items,
  errors,
  onChange,
}: {
  items: RadicalFormItem[]
  errors: FormErrors
  onChange: (next: RadicalFormItem[]) => void
}) {
  return (
    <Card className="bg-background/40 border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Radicais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Radicais são opcionais. Ao editar, só envie novos radicais se quiser substituir os atuais.
          </p>
        )}

        {items.map((item, index) => (
          <div key={item.id} className="rounded-xl border border-border/50 p-3 space-y-3">
            <RowHeader
              title={`Radical ${index + 1}`}
              onRemove={() => onChange(items.filter((value) => value.id !== item.id))}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Caractere</Label>
                <Input
                  value={item.character}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, character: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`radicals.${index}.character`]} />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={item.name}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, name: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`radicals.${index}.name`]} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Significado</Label>
                <Input
                  value={item.meaning}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, meaning: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`radicals.${index}.meaning`]} />
              </div>
              <div className="space-y-2">
                <Label>Traços</Label>
                <Input
                  value={item.strokeCount}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, strokeCount: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`radicals.${index}.strokeCount`]} />
              </div>
              <div className="space-y-2">
                <Label>Posição (opcional)</Label>
                <Input
                  value={item.position}
                  onChange={(event) => {
                    onChange(items.map((value) => (
                      value.id === item.id ? { ...value, position: event.target.value } : value
                    )))
                  }}
                />
                <ErrorLine message={errors[`radicals.${index}.position`]} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={item.isPrimary}
                onCheckedChange={(checked) => {
                  onChange(items.map((value) => (
                    value.id === item.id ? { ...value, isPrimary: checked === true } : value
                  )))
                }}
              />
              <Label>Principal</Label>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={() => onChange([...items, createEmptyRadicalItem()])}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar radical
        </Button>
      </CardContent>
    </Card>
  )
}
