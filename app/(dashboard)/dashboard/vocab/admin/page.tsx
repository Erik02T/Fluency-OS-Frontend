"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  Trash2,
} from "lucide-react"
import { DashboardShell } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  createVocabulary,
  deleteVocabulary,
  getVocabularyDetail,
  getVocabularyList,
  updateVocabulary,
  type CreateVocabularyDto,
  type VocabularyDetailResponseDto,
  type VocabularyListItemDto,
} from "@/lib/vocabulary-api"
import type { JLPTLevel } from "@/lib/kanji-api"
import { useRequireAdmin } from "@/hooks/use-require-admin"
import {
  ExamplesSection,
  MeaningsSection,
  type AdminExampleItem,
  type AdminMeaningItem,
} from "@/components/content-admin/shared-form-sections"

const PAGE_SIZE = 12

const jlptOptions: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"]

type FormErrors = Record<string, string>

interface VocabularyStructuredFormState {
  word: string
  reading: string
  jlptLevel: JLPTLevel
  frequency: string
  partOfSpeech: string
  tags: string
  notes: string
  audioUrl: string
  meanings: AdminMeaningItem[]
  examples: AdminExampleItem[]
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Falha inesperada no admin de vocabulário."
}

function emptyFormState(): VocabularyStructuredFormState {
  return {
    word: "",
    reading: "",
    jlptLevel: "N5",
    frequency: "",
    partOfSpeech: "",
    tags: "",
    notes: "",
    audioUrl: "",
    meanings: [{ meaning: "", context: "", isPrimary: true }],
    examples: [],
  }
}

function detailToForm(detail: VocabularyDetailResponseDto): VocabularyStructuredFormState {
  return {
    word: detail.word,
    reading: detail.reading,
    jlptLevel: detail.jlpt,
    frequency: detail.frequency !== null ? String(detail.frequency) : "",
    partOfSpeech: detail.partOfSpeech ?? "",
    tags: (detail.tags ?? []).join(", "),
    notes: detail.notes ?? "",
    audioUrl: detail.audioUrl ?? "",
    meanings:
      detail.meanings.length > 0
        ? detail.meanings.map((item) => ({
            meaning: item.meaning,
            context: item.context,
            isPrimary: item.isPrimary,
          }))
        : [{ meaning: "", context: "", isPrimary: true }],
    examples: detail.examples.map((item) => ({
      japanese: item.japanese,
      reading: item.reading,
      translation: item.translation,
      source: item.source,
    })),
  }
}

function parseInteger(value: string): number | undefined {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed)) {
    return undefined
  }

  return parsed
}

function getValidationMessageForInteger(
  fieldName: string,
  value: string,
  minimum: number,
  maximum?: number,
): string | null {
  if (!value.trim()) {
    return null
  }

  const parsed = parseInteger(value)
  if (parsed === undefined) {
    return `${fieldName} deve ser um número inteiro.`
  }

  if (parsed < minimum) {
    return `${fieldName} deve ser maior ou igual a ${minimum}.`
  }

  if (maximum !== undefined && parsed > maximum) {
    return `${fieldName} deve ser menor ou igual a ${maximum}.`
  }

  return null
}

function parseTagsField(raw: string): string[] | undefined {
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  return items.length > 0 ? items : undefined
}

function buildPayload(form: VocabularyStructuredFormState): {
  payload: CreateVocabularyDto | null
  errors: FormErrors
} {
  const errors: FormErrors = {}

  if (!form.word.trim()) {
    errors.word = "Word é obrigatório."
  }

  if (!form.reading.trim()) {
    errors.reading = "Reading é obrigatória."
  }

  const frequencyError = getValidationMessageForInteger("Frequência", form.frequency, 1)
  if (frequencyError) {
    errors.frequency = frequencyError
  }

  if (form.meanings.length === 0) {
    errors.meanings = "Ao menos um significado é obrigatório."
  }

  form.meanings.forEach((item, index) => {
    if (!item.meaning.trim()) {
      errors[`meanings[${index}].meaning`] = "Meaning é obrigatório."
    }
  })

  form.examples.forEach((item, index) => {
    if (!item.japanese.trim()) {
      errors[`examples[${index}].japanese`] = "Japanese é obrigatório."
    }
    if (!item.translation.trim()) {
      errors[`examples[${index}].translation`] = "Translation é obrigatória."
    }
  })

  if (Object.keys(errors).length > 0) {
    return {
      payload: null,
      errors,
    }
  }

  const payload: CreateVocabularyDto = {
    word: form.word.trim(),
    reading: form.reading.trim(),
    jlptLevel: form.jlptLevel,
    frequency: parseInteger(form.frequency),
    partOfSpeech: form.partOfSpeech.trim() || undefined,
    tags: parseTagsField(form.tags),
    notes: form.notes.trim() || undefined,
    audioUrl: form.audioUrl.trim() || undefined,
    meanings: form.meanings.map((item) => ({
      meaning: item.meaning.trim(),
      context: item.context?.trim() || null,
      isPrimary: item.isPrimary,
    })),
    examples:
      form.examples.length > 0
        ? form.examples.map((item) => ({
            japanese: item.japanese.trim(),
            reading: item.reading?.trim() || null,
            translation: item.translation.trim(),
            source: item.source?.trim() || null,
          }))
        : undefined,
  }

  return {
    payload,
    errors: {},
  }
}

export default function VocabularyAdminPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isInitializing } = useRequireAdmin()

  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [items, setItems] = React.useState<VocabularyListItemDto[]>([])
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalItems, setTotalItems] = React.useState(0)
  const [isLoadingList, setIsLoadingList] = React.useState(true)
  const [listError, setListError] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingDetail, setEditingDetail] = React.useState<VocabularyDetailResponseDto | null>(null)
  const [form, setForm] = React.useState<VocabularyStructuredFormState>(emptyFormState)
  const [fieldErrors, setFieldErrors] = React.useState<FormErrors>({})
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [formMessage, setFormMessage] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    const initialEditId = new URLSearchParams(window.location.search).get("id")
    setEditingId(initialEditId)
  }, [])

  React.useEffect(() => {
    if (isInitializing || !isAuthenticated || !isAdmin) {
      return
    }

    const controller = new AbortController()
    let isActive = true

    async function loadList() {
      try {
        setIsLoadingList(true)
        setListError(null)

        const payload = await getVocabularyList(
          {
            page,
            perPage: PAGE_SIZE,
            search: search.trim() || undefined,
            sort: "frequency",
            order: "asc",
          },
          { signal: controller.signal },
        )

        if (isActive) {
          setItems(payload.data)
          setTotalPages(payload.pagination.pages)
          setTotalItems(payload.pagination.total)
        }
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          setItems([])
          setTotalPages(0)
          setTotalItems(0)
          setListError(getErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setIsLoadingList(false)
        }
      }
    }

    loadList()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [page, search, isInitializing, isAuthenticated, isAdmin])

  React.useEffect(() => {
    if (isInitializing || !isAuthenticated || !isAdmin) {
      return
    }

    if (editingId === null) {
      setEditingDetail(null)
      setForm(emptyFormState())
      return
    }

    const currentEditId = editingId

    const controller = new AbortController()
    let isActive = true

    async function loadDetail() {
      try {
        setIsLoadingDetail(true)
        setFormError(null)
        setFieldErrors({})
        const detail = await getVocabularyDetail(currentEditId, { signal: controller.signal })
        if (isActive) {
          setEditingDetail(detail)
          setForm(detailToForm(detail))
        }
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          setEditingDetail(null)
          setFormError(getErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setIsLoadingDetail(false)
        }
      }
    }

    loadDetail()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [editingId, isInitializing, isAuthenticated, isAdmin])

  async function handleSubmit() {
    try {
      setIsSaving(true)
      setFormError(null)
      setFormMessage(null)
      setFieldErrors({})

      const { payload, errors } = buildPayload(form)
      if (!payload) {
        setFieldErrors(errors)
        setFormError("Existem campos inválidos. Revise os destaques e tente novamente.")
        return
      }

      const detail = editingId
        ? await updateVocabulary(editingId, payload)
        : await createVocabulary(payload)
      setEditingId(detail.id)
      setEditingDetail(detail)
      setForm(detailToForm(detail))
      setFormMessage(
        editingId ? "Vocabulário atualizado com sucesso." : "Vocabulário criado com sucesso.",
      )
      router.replace(`/dashboard/vocab/admin?id=${detail.id}`)
      setPage(1)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingId) {
      return
    }

    if (!window.confirm("Remover este vocabulário permanentemente?")) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteVocabulary(editingId)
      setFormMessage("Vocabulário removido com sucesso.")
      setEditingId(null)
      setEditingDetail(null)
      setForm(emptyFormState())
      setFieldErrors({})
      router.replace("/dashboard/vocab/admin")
      setPage(1)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isInitializing) {
    return (
      <DashboardShell
        title="Admin Vocabulary"
        subtitle="Validando sessão administrativa"
        kanji="語"
      >
        <Card className="bg-card/60 border-border/50 max-w-xl mx-auto">
          <CardContent className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Validando autenticação...
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  function startNew() {
    setEditingId(null)
    setEditingDetail(null)
    setForm(emptyFormState())
    setFieldErrors({})
    setFormError(null)
    setFormMessage(null)
    router.replace("/dashboard/vocab/admin")
  }

  return (
    <DashboardShell
      title="Admin Vocabulary"
      subtitle="CRUD completo sobre /admin/vocabularies"
      kanji="語"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/vocab">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <Button variant="outline" onClick={startNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo vocabulário
          </Button>
          <Button variant="outline" onClick={() => router.refresh()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4 text-[var(--torii-red)]" />
                Vocabulários cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar palavra para editar..."
                className="bg-secondary/40 border-border"
              />

              {listError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground">
                  {listError}
                </div>
              )}

              {isLoadingList ? (
                <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-2xl bg-muted/50" />
                  ))}
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setEditingId(item.id)
                        router.replace(`/dashboard/vocab/admin?id=${item.id}`)
                      }}
                      className={cn(
                        "w-full rounded-2xl border p-3 text-left transition-colors",
                        editingId === item.id
                          ? "border-[var(--torii-red)]/30 bg-[var(--torii-red)]/5"
                          : "border-border/50 bg-secondary/10 hover:bg-secondary/20",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shrink-0">
                            <span className="font-japanese text-lg text-foreground">
                              {item.word.slice(0, 2)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {item.primaryMeaning}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.jlpt} · {item.reading}
                              {item.partOfSpeech ? ` · ${item.partOfSpeech}` : ""}
                            </p>
                          </div>
                        </div>
                        {item.frequency !== null && (
                          <Badge variant="outline">#{item.frequency}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum vocabulário encontrado.</p>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
                <span>Total {totalItems.toLocaleString("pt-BR")}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((currentPage) => Math.max(1, currentPage - 1))
                    }
                  >
                    Anterior
                  </Button>
                  <Badge variant="outline">
                    {page}/{Math.max(totalPages, 1)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || totalPages === 0}
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-[var(--torii-red)]" />
                {editingId
                  ? `Editando ${editingDetail?.word ?? editingId}`
                  : "Criar vocabulário"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground">
                  {formError}
                </div>
              )}
              {formMessage && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-muted-foreground">
                  {formMessage}
                </div>
              )}

              {isLoadingDetail && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando detalhe...
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Word" error={fieldErrors.word}>
                  <Input
                    value={form.word}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, word: event.target.value }))
                    }
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="Reading" error={fieldErrors.reading}>
                  <Input
                    value={form.reading}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, reading: event.target.value }))
                    }
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="JLPT" error={fieldErrors.jlptLevel}>
                  <Select
                    value={form.jlptLevel}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, jlptLevel: value as JLPTLevel }))
                    }
                  >
                    <SelectTrigger className="bg-secondary/40 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jlptOptions.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Frequency" error={fieldErrors.frequency}>
                  <Input
                    value={form.frequency}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, frequency: event.target.value }))
                    }
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="Part of speech" error={fieldErrors.partOfSpeech}>
                  <Input
                    value={form.partOfSpeech}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, partOfSpeech: event.target.value }))
                    }
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="Tags (separadas por vírgula)" error={fieldErrors.tags}>
                  <Input
                    value={form.tags}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, tags: event.target.value }))
                    }
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="Audio URL" error={fieldErrors.audioUrl}>
                  <Input
                    value={form.audioUrl}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, audioUrl: event.target.value }))
                    }
                    className="bg-secondary/40 border-border"
                  />
                </Field>
              </div>

              <Field label="Notes" error={fieldErrors.notes}>
                <Textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={3}
                  className="bg-secondary/40 border-border resize-none"
                />
              </Field>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Validação de meanings (mensagens de erro inline abaixo dos campos)
                </Label>
                {fieldErrors.meanings && (
                  <p className="text-xs text-destructive">{fieldErrors.meanings}</p>
                )}
              </div>
              <MeaningsSection
                values={form.meanings}
                onChange={(meanings) => setForm((current) => ({ ...current, meanings }))}
                errorsMap={fieldErrors}
              />

              <ExamplesSection
                values={form.examples}
                onChange={(examples) => setForm((current) => ({ ...current, examples }))}
                errorsMap={fieldErrors}
                showSource
                showNotes={false}
                showIsNatural={false}
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleSubmit} disabled={isSaving || isLoadingDetail}>
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? "Salvar alterações" : "Criar vocabulário"}
                </Button>
                {editingId && (
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
                <Button variant="outline" onClick={startNew}>
                  Limpar formulário
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardShell>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  )
}
