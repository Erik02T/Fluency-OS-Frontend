import { comprehensionToStars, starsToComprehension } from "@/lib/immersion-api"

describe("immersion ratings", () => {
  it("round-trips all five star selections through the API scale", () => {
    for (const stars of [1, 2, 3, 4, 5]) {
      const comprehension = starsToComprehension(stars)
      expect(comprehension).toBe(stars * 20)
      expect(comprehensionToStars(comprehension)).toBe(stars)
    }
  })

  it("rounds API values to the nearest star", () => {
    expect(comprehensionToStars(9)).toBe(0)
    expect(comprehensionToStars(10)).toBe(1)
    expect(comprehensionToStars(76)).toBe(4)
    expect(comprehensionToStars(89)).toBe(4)
    expect(comprehensionToStars(90)).toBe(5)
  })

  it("distinguishes zero from an absent evaluation", () => {
    expect(comprehensionToStars(0)).toBe(0)
    expect(comprehensionToStars(null)).toBeNull()
  })
})
