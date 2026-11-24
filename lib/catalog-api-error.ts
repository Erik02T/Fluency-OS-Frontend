export class CatalogApiError extends Error {
  constructor(readonly status: number, details: string) {
    super(details || `Falha na requisição (HTTP ${status}).`)
  }
}

export function getCatalogErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof CatalogApiError && error.status === 429) {
    return "Muitas requisições. Aguarde alguns instantes e tente novamente."
  }
  if (!(error instanceof Error) || !error.message) return fallback
  try {
    const body = JSON.parse(error.message) as { message?: string | string[] } | null
    if (Array.isArray(body?.message)) return body.message.join(" ")
    if (typeof body?.message === "string") return body.message
  } catch {
    return error.message
  }
  return fallback
}
