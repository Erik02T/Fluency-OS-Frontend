export type NavigationFeatureStatus = "live" | "beta" | "coming-soon"

export interface NavigationFeature {
  id:
    | "dashboard"
    | "review"
    | "study"
    | "ai"
    | "kanji"
    | "admin-kanji"
    | "admin-vocabulary"
    | "admin-grammar"
    | "auth"
    | "login"
    | "register"
    | "vocabulary"
    | "grammar"
    | "immersion"
    | "planner"
    | "analytics"
  name: string
  href: string
  kanji: string
  description: string
  icon:
    | "home"
    | "review"
    | "study"
    | "ai"
    | "kanji"
    | "admin"
    | "auth"
    | "book"
    | "grammar"
    | "immersion"
    | "planner"
    | "analytics"
  status: NavigationFeatureStatus
  visibleInSidebar: boolean
  /** Quando true, item só aparece para usuários com role ADMIN. */
  requiresAdmin?: boolean
  /** Quando true, item some após autenticação (ex.: Login/Registro). */
  hideWhenAuthenticated?: boolean
}

// Fonte única de verdade para ativar/ocultar módulos no MVP.
export const NAVIGATION_FEATURES: NavigationFeature[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/dashboard",
    kanji: "家",
    description: "Centro de comando",
    icon: "home",
    status: "live",
    visibleInSidebar: true,
  },
  {
    id: "review",
    name: "Revisão",
    href: "/dashboard/review",
    kanji: "復",
    description: "Fila de SRS",
    icon: "review",
    status: "live",
    visibleInSidebar: true,
  },
  {
    id: "study",
    name: "Estudo",
    href: "/dashboard/study",
    kanji: "習",
    description: "Itens em estudo",
    icon: "study",
    status: "live",
    visibleInSidebar: true,
  },
  {
    id: "kanji",
    name: "Kanji",
    href: "/dashboard/kanji",
    kanji: "字",
    description: "Banco de kanjis",
    icon: "kanji",
    status: "live",
    visibleInSidebar: true,
  },
  {
    id: "admin-kanji",
    name: "Admin Kanji",
    href: "/dashboard/kanji/admin",
    kanji: "管",
    description: "CRUD administrativo",
    icon: "admin",
    status: "beta",
    visibleInSidebar: true,
    requiresAdmin: true,
  },
  {
    id: "admin-vocabulary",
    name: "Admin Vocabulary",
    href: "/dashboard/vocab/admin",
    kanji: "語",
    description: "CRUD administrativo",
    icon: "admin",
    status: "beta",
    visibleInSidebar: true,
    requiresAdmin: true,
  },
  {
    id: "admin-grammar",
    name: "Admin Grammar",
    href: "/dashboard/grammar/admin",
    kanji: "文",
    description: "CRUD administrativo",
    icon: "admin",
    status: "beta",
    visibleInSidebar: true,
    requiresAdmin: true,
  },
  {
    id: "login",
    name: "Login",
    href: "/dashboard/login",
    kanji: "入",
    description: "Entrar na conta",
    icon: "auth",
    status: "live",
    visibleInSidebar: true,
    hideWhenAuthenticated: true,
  },
  {
    id: "register",
    name: "Registro",
    href: "/dashboard/register",
    kanji: "記",
    description: "Criar nova conta",
    icon: "auth",
    status: "live",
    visibleInSidebar: true,
    hideWhenAuthenticated: true,
  },
  {
    id: "auth",
    name: "Admin Auth",
    href: "/dashboard/admin/login",
    kanji: "鍵",
    description: "Login administrativo",
    icon: "admin",
    status: "live",
    // Acessível via redirect das rotas Admin; não polui o menu.
    visibleInSidebar: false,
    requiresAdmin: true,
  },
  {
    id: "vocabulary",
    name: "Vocabulário",
    href: "/dashboard/vocab",
    kanji: "語",
    description: "Palavras e frases",
    icon: "book",
    status: "live",
    visibleInSidebar: true,
  },
  {
    id: "grammar",
    name: "Gramática",
    href: "/dashboard/grammar",
    kanji: "文",
    description: "Padrões gramaticais",
    icon: "grammar",
    status: "live",
    visibleInSidebar: true,
  },
  {
    id: "immersion",
    name: "Imersão",
    href: "/dashboard/immersion",
    kanji: "聴",
    description: "Tracking de imersão",
    icon: "immersion",
    status: "live",
    visibleInSidebar: true,
  },
  {
    id: "planner",
    name: "Planner",
    href: "/dashboard/planner",
    kanji: "計",
    description: "Planejamento semanal",
    icon: "planner",
    status: "live",
    visibleInSidebar: true,
  },
  {
    id: "analytics",
    name: "Analytics",
    href: "/dashboard/analytics",
    kanji: "析",
    description: "Estatísticas e insights",
    icon: "analytics",
    status: "beta",
    visibleInSidebar: true,
  },
]

export function getSidebarNavigationFeatures(options: {
  isAuthenticated: boolean
  isAdmin: boolean
}): NavigationFeature[] {
  return NAVIGATION_FEATURES.filter((feature) => {
    if (!feature.visibleInSidebar) {
      return false
    }

    if (feature.requiresAdmin && !options.isAdmin) {
      return false
    }

    if (feature.hideWhenAuthenticated && options.isAuthenticated) {
      return false
    }

    return true
  })
}
