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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  createKanji,
  deleteKanji,
  getKanjiDetail,
  getKanjiList,
  updateKanji,
  type CreateKanjiDto,
  type JLPTLevel,
  type ReadingType,
  type KanjiDetailResponseDto,
  type KanjiListItemDto,
} from "@/lib/kanji-api"
import { useRequireAdmin } from "@/hooks/use-require-admin"
import {
  createEmptyExampleItem,
  createEmptyMeaningItem,
  createEmptyRadicalItem,
  createEmptyReadingItem,
  ExamplesSection,
  MeaningsSection,
  RadicalsSection,
  ReadingsSection,
  type FormErrors,
  type KanjiStructuredFormState,
  type ReadingFormItem,
} from "@/components/kanji-admin/form-sections"

const PAGE_SIZE = 12

const jlptOptions: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"]
const readingTypeOptions: ReadingType[] = ["ONYOMI", "KUNYOMI", "NANORI"]

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Falha inesperada no admin de kanji."
}

function emptyFormState(): KanjiStructuredFormState {
  return {
    character: "",
    unicodeCodepoint: "",
    jlptLevel: "N5",
    grade: "",
    strokeCount: "",
    frequency: "",
    notes: "",
    romanization: "",
    meanings: [{ ...createEmptyMeaningItem(), isPrimary: true }],
    readings: [{ ...createEmptyReadingItem(), isPrimary: true }],
    examples: [],
    radicals: [],
  }
}

function detailToForm(detail: KanjiDetailResponseDto): KanjiStructuredFormState {
  const onyomiReadings: ReadingFormItem[] = detail.readings.onyomi.map((item) => ({
    ...createEmptyReadingItem(),
    reading: item.reading,
    type: "ONYOMI",
    romanji: item.romanization,
    isPrimary: item.isCommon,
  }))

  const kunyomiReadings: ReadingFormItem[] = detail.readings.kunyomi.map((item) => ({
    ...createEmptyReadingItem(),
    reading: item.reading,
    type: "KUNYOMI",
    romanji: item.romanization,
    isPrimary: item.isCommon,
  }))

  const nanoriReadings: ReadingFormItem[] = (detail.readings.nanori ?? []).map((item) => ({
    ...createEmptyReadingItem(),
    reading: item.reading,
    type: "NANORI",
    romanji: item.romanization,
    isPrimary: false,
  }))

  const readings: ReadingFormItem[] = [
    ...onyomiReadings,
    ...kunyomiReadings,
    ...nanoriReadings,
  ]

  return {
    character: detail.character,
    unicodeCodepoint: detail.unicodeCodepoint,
    jlptLevel: detail.jlpt,
    grade: detail.grade ? String(detail.grade) : "",
    strokeCount: detail.strokes ? String(detail.strokes) : "",
    frequency: detail.frequency ? String(detail.frequency) : "",
    notes: "",
    romanization: onyomiReadings[0]?.romanji || kunyomiReadings[0]?.romanji || "",
    meanings: detail.meanings.length > 0
      ? detail.meanings.map((item) => ({
          ...createEmptyMeaningItem(),
          meaning: item.meaning,
          language: item.language,
          isPrimary: item.isPrimary,
        }))
      : [{ ...createEmptyMeaningItem(), isPrimary: true }],
    readings,
    examples: detail.examples.map((item) => ({
      ...createEmptyExampleItem(),
      word: item.word,
      reading: item.reading,
      meaning: item.meaning,
      jlptLevel: item.jlpt,
    })),
    radicals: [],
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

function buildPayload(form: KanjiStructuredFormState): {
  payload: CreateKanjiDto | null
  errors: FormErrors
} {
  const errors: FormErrors = {}

  if (!form.character.trim()) {
    errors.character = "Character é obrigatório."
  }

  const gradeError = getValidationMessageForInteger("Grade", form.grade, 1, 9)
  if (gradeError) {
    errors.grade = gradeError
  }

  const strokesError = getValidationMessageForInteger("Traços", form.strokeCount, 1)
  if (strokesError) {
    errors.strokeCount = strokesError
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
      errors[`meanings.${index}.meaning`] = "Meaning é obrigatório."
    }

    if (item.language.trim().length === 0) {
      errors[`meanings.${index}.language`] = "Idioma é obrigatório."
    }
  })

  if (form.readings.length === 0) {
    errors.readings = "Ao menos uma leitura é obrigatória."
  }

  form.readings.forEach((item, index) => {
    if (!item.reading.trim()) {
      errors[`readings.${index}.reading`] = "Leitura é obrigatória."
    }

    if (!readingTypeOptions.includes(item.type)) {
      errors[`readings.${index}.type`] = "Tipo de leitura inválido."
    }
  })

  form.examples.forEach((item, index) => {
    if (!item.word.trim()) {
      errors[`examples.${index}.word`] = "Palavra é obrigatória."
    }
    if (!item.reading.trim()) {
      errors[`examples.${index}.reading`] = "Leitura é obrigatória."
    }
    if (!item.meaning.trim()) {
      errors[`examples.${index}.meaning`] = "Significado é obrigatório."
    }
    if (item.jlptLevel && !jlptOptions.includes(item.jlptLevel)) {
      errors[`examples.${index}.jlptLevel`] = "Nível JLPT inválido."
    }
  })

  form.radicals.forEach((item, index) => {
    if (!item.character.trim()) {
      errors[`radicals.${index}.character`] = "Caractere é obrigatório."
    }
    if (!item.name.trim()) {
      errors[`radicals.${index}.name`] = "Nome é obrigatório."
    }
    if (!item.meaning.trim()) {
      errors[`radicals.${index}.meaning`] = "Significado é obrigatório."
    }

    const strokeError = getValidationMessageForInteger(
      "Traços do radical",
      item.strokeCount,
      1,
    )
    if (strokeError) {
      errors[`radicals.${index}.strokeCount`] = strokeError
    }

    if (item.position.trim()) {
      const parsedPosition = parseInteger(item.position)
      if (parsedPosition === undefined) {
        errors[`radicals.${index}.position`] = "Posição deve ser um número inteiro."
      }
    }
  })

  if (Object.keys(errors).length > 0) {
    return {
      payload: null,
      errors,
    }
  }

  const payload: CreateKanjiDto = {
    character: form.character.trim(),
    unicodeCodepoint: form.unicodeCodepoint.trim() || undefined,
    jlptLevel: form.jlptLevel,
    grade: parseInteger(form.grade),
    strokeCount: parseInteger(form.strokeCount),
    frequency: parseInteger(form.frequency),
    notes: form.notes.trim() || undefined,
    romanization: form.romanization.trim() || undefined,
    meanings: form.meanings.map((item) => ({
      meaning: item.meaning.trim(),
      language: item.language.trim() || "pt-BR",
      isPrimary: item.isPrimary,
    })),
    readings: form.readings.map((item) => ({
      reading: item.reading.trim(),
      type: item.type,
      romanji: item.romanji.trim() || undefined,
      isPrimary: item.isPrimary,
    })),
    examples: form.examples.length > 0
      ? form.examples.map((item) => ({
          word: item.word.trim(),
          reading: item.reading.trim(),
          meaning: item.meaning.trim(),
          jlptLevel: item.jlptLevel || undefined,
        }))
      : undefined,
    radicals: form.radicals.length > 0
      ? form.radicals.map((item) => ({
          character: item.character.trim(),
          name: item.name.trim(),
          meaning: item.meaning.trim(),
          strokeCount: Number(item.strokeCount),
          position: item.position.trim() ? Number(item.position) : undefined,
          isPrimary: item.isPrimary,
        }))
      : undefined,
  }

  return {
    payload,
    errors: {},
  }
}

export default function KanjiAdminPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isInitializing } = useRequireAdmin()

  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [kanjis, setKanjis] = React.useState<KanjiListItemDto[]>([])
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalItems, setTotalItems] = React.useState(0)
  const [isLoadingList, setIsLoadingList] = React.useState(true)
  const [listError, setListError] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingDetail, setEditingDetail] = React.useState<KanjiDetailResponseDto | null>(null)
  const [form, setForm] = React.useState<KanjiStructuredFormState>(emptyFormState)
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

        const payload = await getKanjiList(
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
          setKanjis(payload.data)
          setTotalPages(payload.pagination.pages)
          setTotalItems(payload.pagination.total)
        }
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          setKanjis([])
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
        const detail = await getKanjiDetail(currentEditId, { signal: controller.signal })
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

      const detail = editingId ? await updateKanji(editingId, payload) : await createKanji(payload)
      setEditingId(detail.id)
      setEditingDetail(detail)
      setForm(detailToForm(detail))
      setFormMessage(editingId ? "Kanji atualizado com sucesso." : "Kanji criado com sucesso.")
      router.replace(`/dashboard/kanji/admin?id=${detail.id}`)
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

    if (!window.confirm("Remover este kanji permanentemente?")) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteKanji(editingId)
      setFormMessage("Kanji removido com sucesso.")
      setEditingId(null)
      setEditingDetail(null)
      setForm(emptyFormState())
      setFieldErrors({})
      router.replace("/dashboard/kanji/admin")
      setPage(1)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isInitializing) {
    return (
      <DashboardShell title="Admin Kanji" subtitle="Validando sessão administrativa" kanji="設">
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

  function startNewKanji() {
    setEditingId(null)
    setEditingDetail(null)
    setForm(emptyFormState())
    setFieldErrors({})
    setFormError(null)
    setFormMessage(null)
    router.replace("/dashboard/kanji/admin")
  }

  return (
    <DashboardShell
      title="Admin Kanji"
      subtitle="CRUD completo sobre /admin/kanjis"
      kanji="設"
    >
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/kanji">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <Button variant="outline" onClick={startNewKanji}>
            <Plus className="h-4 w-4 mr-2" />
            Novo kanji
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
                Kanjis cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar kanji para editar..."
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
              ) : kanjis.length > 0 ? (
                <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
                  {kanjis.map((kanji) => (
                    <button
                      key={kanji.id}
                      type="button"
                      onClick={() => {
                        setEditingId(kanji.id)
                        router.replace(`/dashboard/kanji/admin?id=${kanji.id}`)
                      }}
                      className={cn(
                        "w-full rounded-2xl border p-3 text-left transition-colors",
                        editingId === kanji.id
                          ? "border-[var(--torii-red)]/30 bg-[var(--torii-red)]/5"
                          : "border-border/50 bg-secondary/10 hover:bg-secondary/20",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shrink-0">
                            <span className="font-japanese text-xl text-foreground">{kanji.character}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{kanji.meanings.join(", ")}</p>
                            <p className="text-xs text-muted-foreground">{kanji.jlpt} · #{kanji.frequency}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{kanji.strokes} traços</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum kanji encontrado.</p>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
                <span>Total {totalItems.toLocaleString("pt-BR")}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}>
                    Anterior
                  </Button>
                  <Badge variant="outline">
                    {page}/{Math.max(totalPages, 1)}
                  </Badge>
                  <Button variant="outline" size="sm" disabled={page >= totalPages || totalPages === 0} onClick={() => setPage((currentPage) => currentPage + 1)}>
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
                {editingId ? `Editando ${editingDetail?.character ?? editingId}` : "Criar kanji"}
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

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Character" error={fieldErrors.character}>
                  <Input
                    value={form.character}
                    onChange={(event) => setForm((current) => ({ ...current, character: event.target.value }))}
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="Unicode codepoint" error={fieldErrors.unicodeCodepoint}>
                  <Input
                    value={form.unicodeCodepoint}
                    onChange={(event) => setForm((current) => ({ ...current, unicodeCodepoint: event.target.value }))}
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="JLPT" error={fieldErrors.jlptLevel}>
                  <Select
                    value={form.jlptLevel}
                    onValueChange={(value) => setForm((current) => ({ ...current, jlptLevel: value as JLPTLevel }))}
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
                <Field label="Romanization" error={fieldErrors.romanization}>
                  <Input
                    value={form.romanization}
                    onChange={(event) => setForm((current) => ({ ...current, romanization: event.target.value }))}
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="Grade" error={fieldErrors.grade}>
                  <Input
                    value={form.grade}
                    onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value }))}
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="Traços" error={fieldErrors.strokeCount}>
                  <Input
                    value={form.strokeCount}
                    onChange={(event) => setForm((current) => ({ ...current, strokeCount: event.target.value }))}
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="Frequência" error={fieldErrors.frequency}>
                  <Input
                    value={form.frequency}
                    onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value }))}
                    className="bg-secondary/40 border-border"
                  />
                </Field>
                <Field label="Notas" error={fieldErrors.notes}>
                  <Input
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className="bg-secondary/40 border-border"
                  />
                </Field>
              </div>

              <MeaningsSection
                items={form.meanings}
                errors={fieldErrors}
                onChange={(meanings) => setForm((current) => ({ ...current, meanings }))}
              />

              <ReadingsSection
                items={form.readings}
                errors={fieldErrors}
                onChange={(readings) => setForm((current) => ({ ...current, readings }))}
              />

              <ExamplesSection
                items={form.examples}
                errors={fieldErrors}
                onChange={(examples) => setForm((current) => ({ ...current, examples }))}
              />

              <RadicalsSection
                items={form.radicals}
                errors={fieldErrors}
                onChange={(radicals) => setForm((current) => ({ ...current, radicals }))}
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleSubmit} disabled={isSaving || isLoadingDetail}>
                    <Check className="h-4 w-4 mr-2" />
                  {editingId ? "Salvar alterações" : "Criar kanji"}
                </Button>
                {editingId && (
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
                <Button variant="outline" onClick={startNewKanji}>
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
