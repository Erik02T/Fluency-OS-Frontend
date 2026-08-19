import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  ReviewQueueItemDto,
  ReviewQueueResponseDto,
  ReviewSessionResponseDto,
  ReviewAnswerResponseDto,
  ReviewSessionStatsResponseDto,
} from "@/lib/review-api"

// Types
export interface KanjiItem {
  id: string
  kanji: string
  readings: {
    onyomi: string[]
    kunyomi: string[]
  }
  meanings: string[]
  jlpt: "N5" | "N4" | "N3" | "N2" | "N1"
  strokes: number
  frequency: number
  examples: {
    word: string
    reading: string
    meaning: string
  }[]
  srsLevel: number
  nextReview: Date | null
  lastReviewed: Date | null
}

export interface VocabItem {
  id: string
  word: string
  reading: string
  meanings: string[]
  jlpt: "N5" | "N4" | "N3" | "N2" | "N1"
  frequency: number
  partOfSpeech: string
  examples: {
    japanese: string
    reading: string
    english: string
  }[]
  srsLevel: number
  nextReview: Date | null
  lastReviewed: Date | null
  tags: string[]
}

export interface GrammarItem {
  id: string
  pattern: string
  meaning: string
  jlpt: "N5" | "N4" | "N3" | "N2" | "N1"
  formation: string
  examples: {
    japanese: string
    reading: string
    english: string
  }[]
  notes: string
  relatedPatterns: string[]
}

export interface ImmersionLog {
  id: string
  type: "anime" | "podcast" | "youtube" | "reading" | "conversation" | "other"
  title: string
  duration: number // minutes
  date: Date
  notes: string
  comprehension: 1 | 2 | 3 | 4 | 5
  newWords: string[]
}

export interface StudySession {
  id: string
  date: Date
  type: "kanji" | "vocab" | "grammar" | "immersion" | "review"
  duration: number // minutes
  itemsStudied: number
  accuracy?: number
}

export interface UserProgress {
  currentStreak: number
  longestStreak: number
  lastStudyDate: Date | null
  totalStudyTime: number // minutes
  totalReviews: number
  kanjiLearned: number
  vocabLearned: number
  grammarLearned: number
  jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1"
  weeklyGoal: number // minutes
  dailyGoal: number // minutes
}

interface UserState {
  progress: UserProgress
  todayStats: {
    studyTime: number
    reviews: number
    newItems: number
    accuracy: number
  }
  updateProgress: (updates: Partial<UserProgress>) => void
  updateTodayStats: (updates: Partial<UserState["todayStats"]>) => void
  incrementStreak: () => void
  resetTodayStats: () => void
}

interface UIState {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  activeView: string
  searchQuery: string
  toggleSidebar: () => void
  toggleCommandPalette: () => void
  setActiveView: (view: string) => void
  setSearchQuery: (query: string) => void
}

interface ReviewState {
  /** Fila de itens vencidos vinda da API real */
  queue: ReviewQueueItemDto[]
  /** Sessão ativa no momento (null = nenhuma sessão iniciada) */
  currentSession: ReviewSessionResponseDto | null
  /** Posição atual na fila */
  currentIndex: number
  /** Progresso da sessão vindo do backend */
  progress: {
    reviewed: number
    total: number
    correct: number
    incorrect: number
  }
  /** Estatísticas finais da última sessão concluída */
  lastStats: ReviewSessionStatsResponseDto | null
  /** Estado de carregamento/erro */
  isLoading: boolean
  error: string | null
  /** Ações */
  setQueue: (queue: ReviewQueueItemDto[]) => void
  setQueueFromResponse: (response: ReviewQueueResponseDto) => void
  setCurrentSession: (session: ReviewSessionResponseDto | null) => void
  syncSessionProgress: (response: ReviewAnswerResponseDto) => void
  syncSessionState: (session: ReviewSessionResponseDto) => void
  setLastStats: (stats: ReviewSessionStatsResponseDto | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setCurrentIndex: (index: number) => void
  nextCard: () => void
  resetSession: () => void
}

// User Store
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      progress: {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        totalStudyTime: 0,
        totalReviews: 0,
        kanjiLearned: 0,
        vocabLearned: 0,
        grammarLearned: 0,
        jlptLevel: "N5",
        weeklyGoal: 420, // 7 hours
        dailyGoal: 60, // 1 hour
      },
      todayStats: {
        studyTime: 0,
        reviews: 0,
        newItems: 0,
        accuracy: 0,
      },
      updateProgress: (updates) =>
        set((state) => ({
          progress: { ...state.progress, ...updates },
        })),
      updateTodayStats: (updates) =>
        set((state) => ({
          todayStats: { ...state.todayStats, ...updates },
        })),
      incrementStreak: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            currentStreak: state.progress.currentStreak + 1,
            longestStreak: Math.max(
              state.progress.longestStreak,
              state.progress.currentStreak + 1
            ),
            lastStudyDate: new Date(),
          },
        })),
      resetTodayStats: () =>
        set({
          todayStats: {
            studyTime: 0,
            reviews: 0,
            newItems: 0,
            accuracy: 0,
          },
        }),
    }),
    {
      name: "nihongo-user-storage",
    }
  )
)

// UI Store
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  activeView: "dashboard",
  searchQuery: "",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setActiveView: (view) => set({ activeView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))

// Review Store
export const useReviewStore = create<ReviewState>((set) => ({
  queue: [],
  currentSession: null,
  currentIndex: 0,
  progress: {
    reviewed: 0,
    total: 0,
    correct: 0,
    incorrect: 0,
  },
  lastStats: null,
  isLoading: false,
  error: null,
  setQueue: (queue) => set({ queue }),
  setQueueFromResponse: (response) =>
    set({
      queue: response.items,
      progress: {
        reviewed: 0,
        total: response.total_due,
        correct: 0,
        incorrect: 0,
      },
    }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  syncSessionProgress: (response) =>
    set({
      progress: {
        reviewed: response.session_progress.reviewed,
        total: response.session_progress.total,
        correct: response.session_progress.correct,
        incorrect: response.session_progress.incorrect,
      },
    }),
  syncSessionState: (session) =>
    set({
      currentSession: session,
      progress: {
        reviewed: session.reviewed_items,
        total: session.total_items,
        correct: session.correct_items,
        incorrect: session.incorrect_items,
      },
    }),
  setLastStats: (lastStats) => set({ lastStats }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  nextCard: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
    })),
  resetSession: () =>
    set({
      queue: [],
      currentSession: null,
      currentIndex: 0,
      progress: {
        reviewed: 0,
        total: 0,
        correct: 0,
        incorrect: 0,
      },
      lastStats: null,
      error: null,
    }),
}))