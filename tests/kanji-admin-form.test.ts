import { getPrimaryRomaji } from "@/lib/kanji-admin-form"
import type { AdminKanjiReadingDto } from "@/lib/kanji-api"

describe("Admin Kanji general romanization", () => {
  const readings: AdminKanjiReadingDto[] = [
    { type: "ONYOMI", reading: "kou", romanji: "kou" },
    { type: "NANORI", reading: "aki", romanji: "aki", isPrimary: true },
    { type: "KUNYOMI", reading: "hikari", romanji: "hikari", isPrimary: true },
    { type: "ONYOMI", reading: "shou", romanji: "shou", isPrimary: true },
  ]

  it("uses the primary reading even when it comes later and types are mixed", () => {
    expect(getPrimaryRomaji(readings)).toBe("shou")
    expect(getPrimaryRomaji([...readings].reverse())).toBe("shou")
    expect(getPrimaryRomaji(readings.slice(0, 3))).toBe("hikari")
    expect(getPrimaryRomaji(readings.slice(0, 2))).toBe("aki")
  })

  it("chooses consistently when multiple readings of the same type are primary", () => {
    const tied = [{ ...readings[0], isPrimary: true }, readings[3]]
    expect(getPrimaryRomaji(tied)).toBe("kou")
    expect(getPrimaryRomaji([...tied].reverse())).toBe("kou")
  })

  it("uses the saved fallback when no primary reading has romaji", () => {
    const withoutPrimaryRomaji = [readings[0], { ...readings[1], romanji: " " }]
    expect(getPrimaryRomaji(withoutPrimaryRomaji) ?? "manual").toBe("manual")
  })
})
