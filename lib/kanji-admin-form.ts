import type { AdminKanjiReadingDto, ReadingType } from "@/lib/kanji-api"

const primaryReadingPriority: ReadingType[] = ["ONYOMI", "KUNYOMI", "NANORI"]

export function getPrimaryRomaji(
  readings: readonly Pick<AdminKanjiReadingDto, "type" | "romanji" | "isPrimary">[],
): string | undefined {
  for (const type of primaryReadingPriority) {
    // Pick alphabetically when multiple readings of the same type are primary.
    const romaji = readings
      .filter((reading) => reading.type === type && reading.isPrimary)
      .map((reading) => reading.romanji?.trim())
      .filter(Boolean)
      .sort()[0]

    if (romaji) return romaji
  }
}
