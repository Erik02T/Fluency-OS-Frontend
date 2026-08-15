# 日本語 Fluency OS — Frontend

Sistema operacional premium para fluência em japonês. O frontend é uma aplicação **Next.js 16** com **React 19**, **TypeScript**, **Tailwind CSS v4** e **shadcn/ui**, projetada para oferecer uma experiência unificada de aprendizado de japonês com Kanji, vocabulário, gramática, imersão, revisão SRS e analytics.

---

## 📋 Índice

- [Tech Stack](#-tech-stack)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Rotas e Páginas](#-rotas-e-páginas)
- [Arquitetura de Componentes](#-arquitetura-de-componentes)
- [Gerenciamento de Estado](#-gerenciamento-de-estado)
- [Autenticação e Autorização](#-autenticação-e-autorização)
- [Camada de API](#-camada-de-api)
- [Estilização e Tema](#-estilização-e-tema)
- [Scripts e Configuração](#-scripts-e-configuração)
- [Testes](#-testes)

---

## 🚀 Tech Stack

| Categoria            | Tecnologias                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| **Framework**        | Next.js 16.2.6, React 19, TypeScript 5.7                                   |
| **Estilização**      | Tailwind CSS v4, `tw-animate-css`, `tailwind-merge`, `clsx`                 |
| **Componentes UI**   | shadcn/ui (Radix UI primitives), `lucide-react` (ícones)                   |
| **Formulários**      | `react-hook-form` + `@hookform/resolvers` + `zod`                          |
| **Estado**           | Zustand 5.x com middleware persist                                          |
| **Animação**         | Framer Motion                                                              |
| **Gráficos**         | Recharts                                                                   |
| **Data**             | date-fns, react-day-picker                                                 |
| **Notificação**      | sonner, vaul (drawer), cmdk (command palette)                              |
| **Tema**             | next-themes                                                                |
| **Testes**           | Vitest + jsdom                                                             |
| **Lint**             | ESLint + typescript-eslint                                                 |
| **Analytics**        | @vercel/analytics                                                          |

---

## 📁 Estrutura do Projeto

```
frontend/
├── app/                          # Next.js App Router
│   ├── globals.css               # Estilos globais e variáveis CSS
│   ├── layout.tsx                # Layout raiz (fonts, theme provider, analytics)
│   ├── page.tsx                  # Página inicial (redirect → /dashboard)
│   └── (dashboard)/              # Route group do dashboard
│       ├── layout.tsx            # Layout do dashboard (AdminAuthProvider)
│       └── dashboard/
│           ├── page.tsx          # Dashboard principal com métricas
│           ├── admin/
│           │   └── login/        # Login administrativo
│           ├── analytics/        # Estatísticas e insights
│           ├── grammar/          # Banco de gramática
│           ├── immersion/        # Tracking de imersão
│           ├── kanji/            # Banco de kanjis + detalhe/[id] + admin
│           ├── login/            # Login de usuário
│           ├── planner/          # Planejamento semanal
│           ├── register/         # Registro de usuário
│           ├── review/           # Sistema de revisão SRS
│           └── vocab/            # Vocabulário + admin
│
├── components/                   # Componentes React
│   ├── theme-provider.tsx        # Provider de tema (next-themes)
│   ├── content-admin/            # Formulários compartilhados de admin
│   │   └── shared-form-sections.tsx
│   ├── kanji-admin/              # Formulários admin de kanji
│   │   └── form-sections.tsx
│   ├── layout/                   # Componentes de layout do dashboard
│   │   ├── command-palette.tsx   # Paleta de comandos (Cmd+K)
│   │   ├── dashboard-shell.tsx   # Shell principal do dashboard
│   │   ├── index.ts              # Barrel export
│   │   ├── sidebar.tsx           # Sidebar com navegação
│   │   └── top-bar.tsx           # Barra superior com ações
│   └── ui/                       # Componentes shadcn/ui
│       ├── accordion.tsx         # Radix Accordion
│       ├── alert-dialog.tsx      # Radix Alert Dialog
│       ├── alert.tsx             # Alert component
│       ├── aspect-ratio.tsx      # Radix Aspect Ratio
│       ├── avatar.tsx            # Radix Avatar
│       ├── badge.tsx             # Badge component
│       ├── breadcrumb.tsx        # Breadcrumb navigation
│       ├── button.tsx            # Button + variants
│       ├── button-group.tsx      # Grupo de botões
│       ├── calendar.tsx          # react-day-picker wrapper
│       ├── card.tsx              # Card component
│       ├── carousel.tsx          # Embla Carousel
│       ├── chart.tsx             # Recharts wrapper
│       ├── checkbox.tsx          # Radix Checkbox
│       ├── collapsible.tsx       # Radix Collapsible
│       ├── command.tsx           # cmdk wrapper (Command palette)
│       ├── context-menu.tsx      # Radix Context Menu
│       ├── dialog.tsx            # Radix Dialog
│       ├── drawer.tsx            # Vaul drawer
│       ├── dropdown-menu.tsx     # Radix Dropdown Menu
│       ├── empty.tsx             # Empty state component
│       ├── field.tsx             # Form field wrapper
│       ├── form.tsx              # react-hook-form wrapper
│       ├── hover-card.tsx        # Radix Hover Card
│       ├── input.tsx             # Input component
│       ├── input-group.tsx       # Grupo de input
│       ├── input-otp.tsx         # Input OTP
│       ├── item.tsx              # Item base component
│       ├── kbd.tsx               # Teclado (kbd) component
│       ├── label.tsx             # Radix Label
│       ├── menubar.tsx           # Radix Menubar
│       ├── navigation-menu.tsx   # Radix Navigation Menu
│       ├── pagination.tsx        # Pagination component
│       ├── popover.tsx           # Radix Popover
│       ├── progress.tsx          # Radix Progress
│       ├── radio-group.tsx       # Radix Radio Group
│       ├── resizable.tsx         # react-resizable-panels
│       ├── scroll-area.tsx       # Radix Scroll Area
│       ├── select.tsx            # Radix Select
│       ├── separator.tsx         # Radix Separator
│       ├── sheet.tsx             # Sheet (slide-over) component
│       ├── sidebar.tsx           # shadcn sidebar component
│       ├── skeleton.tsx          # Skeleton loading
│       ├── slider.tsx            # Radix Slider
│       ├── sonner.tsx            # Sonner toast wrapper
│       ├── spinner.tsx           # Spinner loading
│       ├── switch.tsx            # Radix Switch
│       ├── table.tsx             # Table component
│       ├── tabs.tsx              # Radix Tabs
│       ├── textarea.tsx          # Textarea component
│       ├── toast.tsx             # Toast component
│       ├── toaster.tsx           # Toast container
│       ├── toggle.tsx            # Radix Toggle
│       ├── toggle-group.tsx      # Radix Toggle Group
│       ├── tooltip.tsx           # Radix Tooltip
│       ├── use-mobile.tsx        # Mobile detection hook
│       └── use-toast.ts          # Toast hook
│
├── contexts/                     # React Contexts
│   └── admin-auth-context.tsx    # Contexto de autenticação admin
│
├── hooks/                        # Custom Hooks
│   ├── use-mobile.ts             # Detecção de mobile
│   ├── use-require-admin.ts      # Guard de rota admin
│   └── use-toast.ts              # Hook de toast
│
├── lib/                          # Utilitários e API clients
│   ├── admin-routes.ts           # Constantes de rota admin + validação HMAC
│   ├── analytics-api.ts          # API de analytics
│   ├── auth-api.ts               # API de autenticação (login, register, refresh, logout)
│   ├── auth-storage.ts           # Armazenamento local de sessão
│   ├── auth-validation.ts        # Validação de formulários de auth
│   ├── dashboard-api.ts          # API de sumário do dashboard
│   ├── grammar-api.ts            # API de gramática
│   ├── immersion-api.ts          # API de imersão
│   ├── kanji-api.ts              # API de kanji (CRUD + progresso)
│   ├── navigation-features.ts    # Configuração centralizada de navegação
│   ├── planner-api.ts            # API de planner
│   ├── review-api.ts             # API de revisão SRS
│   ├── utils.ts                  # Utilitários (cn, clsx, tailwind-merge)
│   └── vocabulary-api.ts         # API de vocabulário (CRUD + progresso)
│
├── store/                        # Zustand Stores
│   └── index.ts                  # Stores: UI, User, Review
│
├── styles/                       # Estilos adicionais
│   └── globals.css               # Estilos globais complementares
│
├── public/                       # Assets estáticos
│   ├── apple-icon.png
│   ├── icon-dark-32x32.png
│   ├── icon-light-32x32.png
│   ├── icon.svg
│   ├── placeholder-logo.png
│   ├── placeholder-logo.svg
│   ├── placeholder-user.jpg
│   ├── placeholder.jpg
│   └── placeholder.svg
│
├── tests/                        # Testes unitários
│   ├── admin-access.test.ts      # Testes de acesso admin
│   ├── auth-api.test.ts          # Testes de API de auth
│   ├── auth-register.test.ts     # Testes de registro
│   ├── auth-storage.test.ts      # Testes de storage de auth
│   ├── kanji-api.test.ts         # Testes de API de kanji
│   ├── review-api.test.ts        # Testes de API de review
│   └── vocabulary-api.test.ts    # Testes de API de vocabulário
│
├── .gitignore
├── components.json               # Configuração shadcn/ui
├── eslint.config.mjs             # Configuração ESLint
├── middleware.ts                  # Edge middleware (proteção de rotas admin)
├── next.config.mjs               # Configuração Next.js
├── next-env.d.ts                 # Tipos Next.js
├── package.json                  # Dependências e scripts
├── pnpm-lock.yaml                # Lockfile pnpm
├── pnpm-workspace.yaml           # Configuração workspace pnpm
├── postcss.config.mjs            # Configuração PostCSS
├── tsconfig.json                 # Configuração TypeScript
├── tsconfig.tsbuildinfo          # Build info TypeScript
└── vitest.config.ts              # Configuração Vitest
```

---

## 🧭 Rotas e Páginas

### Route Group `(dashboard)`

Todas as páginas protegidas pelo layout do dashboard, que provê o `AdminAuthProvider`.

| Rota                                  | Descrição                                      |
| ------------------------------------- | ---------------------------------------------- |
| `/dashboard`                          | Dashboard principal com métricas e ações       |
| `/dashboard/admin/login`              | Login administrativo (rota protegida)          |
| `/dashboard/analytics`                | Estatísticas e insights de aprendizado         |
| `/dashboard/grammar`                  | Banco de padrões gramaticais                   |
| `/dashboard/grammar/admin`            | CRUD administrativo de gramática               |
| `/dashboard/immersion`                | Tracking de sessões de imersão                 |
| `/dashboard/kanji`                    | Banco de kanjis com busca e filtros            |
| `/dashboard/kanji/[id]`               | Detalhe de um kanji específico                 |
| `/dashboard/kanji/admin`              | CRUD administrativo de kanji                   |
| `/dashboard/login`                    | Login de usuário                               |
| `/dashboard/planner`                  | Planejamento semanal de estudos                |
| `/dashboard/register`                 | Registro de novo usuário                       |
| `/dashboard/review`                   | Sistema de revisão SRS (Spaced Repetition)     |
| `/dashboard/vocab`                    | Banco de vocabulário                           |
| `/dashboard/vocab/admin`              | CRUD administrativo de vocabulário             |

### Página Inicial

`/` → Redireciona automaticamente para `/dashboard`.

---

## 🧩 Arquitetura de Componentes

### Layout

O layout do dashboard é composto por:

- **`DashboardShell`** — Container principal que organiza Sidebar + TopBar + conteúdo. Controla a margem do conteúdo baseada no estado `sidebarOpen` da store. Inclui fundo com gradiente mesh e padrão de kanji.
- **`Sidebar`** — Navegação lateral com:
  - Logo "Fluency OS" com kanji 日
  - Botão de busca (abre CommandPalette)
  - Ações rápidas (Review, AI Tutor)
  - Navegação por módulos com indicador de rota ativa (animado)
  - Badges de status: `live`, `beta`, `coming-soon`
  - Itens condicionais por role (admin) e autenticação
  - Footer com streak e meta diária
- **`TopBar`** — Barra superior com:
  - Título da página com kanji decorativo
  - Busca rápida (Cmd+K)
  - Botão "Revisar" com contagem de pendentes
  - Notificações com indicador
  - Toggle de tema
  - Menu do usuário com avatar, nome e role
- **`CommandPalette`** — Paleta de comandos (Ctrl+K / Cmd+K) com:
  - Ações rápidas (Review, AI Tutor)
  - Navegação para todas as páginas
  - Kanji recentes com leitura e significado

### UI Components (shadcn/ui)

Mais de 50 componentes UI rebuildados sobre primitivas Radix, incluindo:

- `Button`, `Card`, `Badge`, `Input`, `Select`, `Dialog`, `Sheet`, `DropdownMenu`, `Popover`, `Tooltip`, `Tabs`, `Accordion`, `Avatar`, `Calendar`, `Carousel`, `Chart`, `Checkbox`, `Form`, `Table`, `Toast`, `Command`, `Drawer`, etc.

### Formulários Administrativos

- **`content-admin/shared-form-sections.tsx`** — Seções de formulário reutilizáveis para CRUDs admin
- **`kanji-admin/form-sections.tsx`** — Seções específicas para formulário de kanji

---

## 💾 Gerenciamento de Estado

### Zustand Stores (`store/index.ts`)

| Store          | Descrição                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| **useUIStore** | Estado de UI: `sidebarOpen`, `commandPaletteOpen`, `activeView`, `searchQuery` |
| **useUserStore** | Progresso do usuário com persistência local: streak, stats, metas. Inclui `updateProgress`, `incrementStreak`, `resetTodayStats` |
| **useReviewStore** | Estado do sistema de revisão SRS: fila de itens, sessão ativa, progresso, estatísticas. Sincronizado com o backend. |

### Tipos de Dados

A store define interfaces TypeScript para:

- `KanjiItem`, `VocabItem`, `GrammarItem` — Itens de estudo
- `ImmersionLog` — Registro de imersão
- `StudySession` — Sessão de estudo
- `UserProgress` — Progresso geral do usuário
- `ReviewQueueItemDto`, `ReviewSessionResponseDto`, `ReviewAnswerResponseDto` — Tipos de resposta da API de review

---

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação

1. **AdminAuthProvider** (`contexts/admin-auth-context.tsx`) — Provider que envolve todo o dashboard. Gerencia:
   - Estado do usuário e access token
   - Inicialização com `hydrateSession` (tenta refresh token salvo)
   - Listeners de expiração de sessão
   - Métodos: `signIn`, `signUp`, `signOut`, `refreshSession`

2. **auth-api.ts** — Cliente HTTP para endpoints de auth:
   - `POST /auth/login` — Login
   - `POST /auth/register` — Registro
   - `GET /auth/me` — Perfil do usuário autenticado
   - `POST /auth/refresh` — Refresh do access token (cookie httpOnly)
   - `POST /auth/logout` — Logout

3. **auth-storage.ts** — Gerenciamento local da sessão (access token em memória/localStorage)

### Proteção de Rotas Admin

O **middleware.ts** protege rotas administrativas na edge:

- Rotas protegidas: `/dashboard/kanji/admin/*`, `/dashboard/vocab/admin/*`, `/dashboard/grammar/admin/*`
- Verifica cookie de sessão (`fluency-admin-refresh-token`)
- Valida cookie de role assinado com HMAC-SHA256 (`fluency-auth-role`)
- Redireciona para `/dashboard/admin/login` se não autenticado
- Redireciona para `/dashboard` se role não for ADMIN

### Configuração de Navegação

`lib/navigation-features.ts` — Fonte centralizada para todos os itens de navegação:

- 13 features mapeadas com id, nome, href, kanji, ícone, status e visibilidade
- Filtragem por autenticação e role (admin)
- Suporte a status: `live`, `beta`, `coming-soon`

---

## 🌐 Camada de API

Cada módulo de API segue o mesmo padrão:

1. **Requisição** com suporte a auto-refresh de token (retry em 401)
2. **Headers** padronizados (Accept, Content-Type, Authorization)
3. **Tratamento de erro** com parse de mensagens do backend
4. **Cache** desabilitado (`cache: "no-store"`)

| Módulo              | Arquivo                 | Endpoints principais                                                                 |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| **Auth**            | `lib/auth-api.ts`       | `POST /auth/login`, `/register`, `GET /auth/me`, `POST /auth/refresh`, `/logout`    |
| **Dashboard**       | `lib/dashboard-api.ts`  | `GET /dashboard/summary`                                                             |
| **Kanji**           | `lib/kanji-api.ts`      | `GET /kanji`, `/kanji/:id`, `POST /kanji/:id/progress`, CRUD admin em `/admin/kanjis` |
| **Vocabulary**      | `lib/vocabulary-api.ts` | `GET /vocabulary`, `/vocabulary/:id`, `POST /vocabulary/:id/progress`, CRUD admin     |
| **Grammar**         | `lib/grammar-api.ts`    | Endpoints de gramática                                                               |
| **Review**          | `lib/review-api.ts`     | `GET /review/queue`, `/review/queue/count`, `POST /review/sessions`, `/review/sessions/:id/answer`, `/end`, `/abandon`, `GET /history`, `/stats` |
| **Immersion**       | `lib/immersion-api.ts`  | Endpoints de imersão                                                                 |
| **Planner**         | `lib/planner-api.ts`    | Endpoints de planner                                                                 |
| **Analytics**       | `lib/analytics-api.ts`  | Endpoints de analytics                                                            |

### Sistema de Revisão SRS

O módulo de revião (`lib/review-api.ts`) implementa:

- Fila de intens vencidos (`GET /reviw/queue)
- Criação e gerenciamento de sessões de revisão
- Registro de respostas com controle de qualidade SRS (0-4)
- Atalho de intervalo baseado na qualidade da resposta
- Histórico paginado de sessões
- Estatísticas detalhadas por sessão

---

## 🎨 Estilização e Tema

### Tailwind CSS v4

Configuração via `postcss.config.mjs` com `@tailwindcss/postcss`.

### Tema Escuro (Padrão)

- Tema escuro forçado via `next-themes` com `defaultTheme="dark"` e `enableSystem={false}`
- Variáveis CSS personalizadas no `globals.css`
- Cores temáticas:
  - `--torii-red` — Vermelho torii (primary)
  - `--gold` — Dourado (destaques)
  - `--neon-blue` — Azul neon (AI, tecnologia)
  - `--teal` — Verde azulado (imersão, progresso)

### Efeitos Visuais

- **`gradient-mesh`** — Fundo com gradiente mesh animado
- **`kanji-pattern`** — Padrão decorativo de kanji ao fundo
- **Framer Motion** — Transições e animações em todos os componentes (sidebar, cards, comandos)

### Font

Configuradas no `layout.tsx`:
- **Inter** (variável) — Fonte principal (sans-serif)
- **Noto Serif JP** — Fonte para texto em japonês (pesos: 200, 400, 600, 700)
- **JetBrains Mono** — Fonte monoespaçada (código, leituras)

---

## 📜 Scripts e Configuração

### Scripts (`package.json`)

| Comando           | Descrição                     |
| ----------------- | ----------------------------- |
| `npm run dev`     | Iniciar servidor de desenvolvimento |
| `npm run build`   | Build de produção             |
| `npm run start`   | Iniciar servidor de produção  |
| `npm run lint`    | Executar ESLint               |
| `npm run test`   | Executar testes com Vitest    |

### Configuração Principal (`next.config.mjs`)

-Typescript: `ignoreBuildErrors: true`
- Images: `unotimized: true`

### Componentes.json (shadcn/ui)

```
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  }
}
```

---

##  Testes

### Viest

Configuração em `vitest.config.ts` com:
- Ambiente: `jsom`
- Globs: `tests/**/*.irst.{ts,tsx}`

### Testes Atuais

| Tste                    | Descrição                                       |
| ----------------------- | ------------------------------------------------ |
| `admin-acess.test.ts`   | Validação de acesso a rotas admin                 |
| `auth-a.pi.test.ts`     | Fluxo de autenticação (login, refresh, logout)    |
| `auth-register.test.ts` | Registro de novos usários                       |
| `auth-storage.test.ts`  | Persistência local da sessão                     |
| `kanji-api.test.ts`     | Endpoints de kanji (lista, detalhe, CRUD admin) |
| `review-api.test.ts`    | Endpoints de revisão SRS                          | `vocabulary-api.test.ts` | Endpoints de vocabulário (lista, detalhe, CRUD) |

---

## 🔌 Variáveis de Ambint

| Variável                    | Descrição                                  | Padrão               |
| --------------------------- | ------------------------------------------ | ------------------- |
| `NEXT_PUBLIC_API_URL`       | URL da API backend                        | `htp://localhost:3001` |
| `AUTH_ROLE_COOKIE_SECRET`   | Segredo para assinar cookie de role (HMAC)| `JWT_SECRET` fallback|
| `JWT_SECRET`                | Segredo JWT (fallback para role cookie)    | —                   |

---

## 📦 Dependências Principais

### Dependências de Produção

```
@hookform/resolvers, @radix-ui/* (30+ pacotes),
@vercel/analytics, autoprefixer, class-variance-authority,
clsx, cmdk, date-fns, embla-carousel-react, framer-motion,
input-otp, lucide-react, next, next-themes, react, 
react-day-picker, react-dom, react-hook-form,
react-resizable-panels, recharts, soner, tailwind-merge,
vaul, zod, zustand
```

### Dependências de Desenvolvimento

```
@eslint/js, @tailwindcss/postcss, @types/node, @types/react,
@types/react-dom, eslint, eslint-plugin-react-hooks,
globals, jsdom, postcss, tailwindcss, tw-animate-css,
typescript, typescript-eslint, vitest
```

---

## 🏗️ Considerações de Arquitetura

- **Auto-refresh de token**: APIs fazem retry automático com refresh token em caso de 401
- **Edge middleware**: Proteção de rotas admin na borda (edge) sem impacto no servidor
- **Role assinada**: Cookie de role usa HMAC-SHA256 para prevenir tampering
- **Persistência local**: Store do usuário persiste no localStorage (`nihongo-user-storage`)
- **Sistema de módulos**: Features podem ser ativadas/desativadas centralmente via `navigation-features.ts`
- **Tema fixo escuro**: Tema escuro forçado para experiência consistente (sem alternância)