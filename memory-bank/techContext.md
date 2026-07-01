# Tech Context — EventFlow

## Stack Overview

| Layer | Technology | Version |
|---|---|---|
| UI framework | React | 19.2.6 |
| Build tool | Vite | 8.0.12 |
| Styling | Tailwind CSS | 3.4.19 (with `tailwindcss` plugin only) |
| PostCSS | autoprefixer + tailwindcss | from Vite default |
| Routing | react-router-dom | (in Vite 8 baseline) |
| Animation | framer-motion | 12.40.0 |
| Forms | react-hook-form | (peer of `@hookform/resolvers`) |
| Validation | yup | (peer of `@hookform/resolvers`) |
| Form resolver | @hookform/resolvers | (RHF ↔ Yup bridge) |
| Icons | lucide-react | 1.17.0 (note: this is the maintained fork; `lucide@1.x`) |
| Notifications | react-hot-toast | (peer of framer-motion / Vite) |
| IDs (client) | uuid | (for variant, line-item, payment ids) |
| Date utils | date-fns | (for parse, format, day-grids, calendar) |
| Auth | firebase | 12.14.0 (`firebase/auth`) |
| Database | firebase/firestore | 12.14.0 |
| Linting | ESLint | 9 (flat config) |
| Language | JavaScript (no TypeScript) | `.js` / `.jsx` |

## Repository Layout

```
EventManagementSystem/
├── AGENTS.md                 (skill-driven agent workflow)
├── README.md                 (business + technical overview, deploy guide)
├── .env                      (gitignored; local dev Firebase config)
├── .env.example              (template documenting 7 VITE_FIREBASE_* vars)
├── .gitignore                (ignores .env, .env.*, dist, node_modules, .planning)
├── package.json
├── package-lock.json
├── vite.config.js            (just the `react()` plugin; no COOP/COEP)
├── eslint.config.js          (flat config; React Hooks + React Refresh)
├── tailwind.config.js        (theme tokens, font families, content globs)
├── postcss.config.js         (tailwindcss + autoprefixer)
├── index.html                (Vite entry)
├── dist/                     (build output; gitignored)
├── node_modules/             (gitignored)
├── memory-bank/              (← this directory)
├── skills/                   (24 SKILL.md files; agent auto-invokes)
├── docs/
│   ├── instructions.md       (STALE — pre-Firebase localStorage build prompt)
│   └── documentation.md      (STALE — pre-Firebase localStorage system doc)
├── src/
│   ├── main.jsx              (createRoot; mounts <App/> inside <StrictMode>)
│   ├── App.jsx               (BrowserRouter + ThemeProvider + AuthProvider + 22 routes)
│   ├── index.css             (Tailwind directives + CSS custom properties for theming)
│   ├── firebase/
│   │   ├── config.js         (initializeApp + env-var guard)
│   │   ├── collections.js    (COLLECTIONS constant; 10 names)
│   │   └── db.js             (helpers: coll, orgQuery, fetch*, create*, update*, delete*, subscribe*, getNextNumber)
│   ├── context/
│   │   ├── AuthContext.jsx   (firebaseUser + profile + org; signOut; refreshUser)
│   │   └── ThemeContext.jsx  (light/dark toggle; localStorage key `ef_theme`)
│   ├── hooks/
│   │   ├── useOrgCollection.js  (real-time `onSnapshot` of org-scoped collection; + useDoc)
│   │   ├── useAuditLogs.js      (filtered onSnapshot for auditLogs with options)
│   │   └── useCountUp.js        (rAF-based number-tween for KPI tiles)
│   ├── constants/
│   │   └── roles.js          (ROLES = { ADMIN, STAFF })
│   ├── utils/
│   │   ├── userProfile.js    (createUserProfile, ensureUserProfile)
│   │   ├── audit.js          (writeAuditLog)
│   │   ├── business.js       (computeQuotationTotals + status enums + EVENT_TYPE_SUGGESTIONS)
│   │   ├── dateHelpers.js    (formatDate, formatDateTime, formatCurrency, daysUntil, isToday/Tomorrow/Past, getCountdownLabel, formatRelative)
│   │   ├── paymentHelpers.js (buildPaymentSummary, buildNewPayment, getChargedPrice, getTotalPaid, getBalance, computePaymentStatus)
│   │   ├── quotationHelpers.js (markExpiredQuotations — batch update on page load)
│   │   ├── invoiceHelpers.js   (checkAndUpdateOverdueInvoices, markInvoiceAsPaid)
│   │   ├── notifications.js  (writeNotification; generateEventNotifications is empty stub)
│   │   ├── numbering.js      (DEAD CODE — imports deleted ./storage)
│   │   └── idGenerator.js    (DEAD CODE — single uuid wrapper, not imported anywhere)
│   ├── components/
│   │   ├── ui/               (15 components; barrel export via index.js)
│   │   ├── layout/           (AppShell, Sidebar, Topbar, MobileNav, PageTransition + StaggerList)
│   │   └── guards/           (ProtectedRoute, AdminRoute)
│   └── pages/
│       ├── auth/             (LandingPage, LoginPage, RegisterPage, VerifyEmailPage)
│       ├── dashboard/        (DashboardPage — KPIs + upcoming events + recent activity)
│       ├── organization/     (OrganizationPage — name + logo)
│       ├── event-types/      (EventTypesPage, EventTypeFormPage, EventTypeDetailPage)
│       ├── inventory/        (InventoryPage, InventoryFormPage, InventoryDetailPage)
│       ├── events/           (EventsPage list+calendar, EventFormPage, EventDetailPage + RecordPaymentModal)
│       ├── quotations/       (QuotationsPage, QuotationFormPage)
│       ├── invoices/         (InvoicesPage, InvoiceFormPage)
│       ├── users/            (UsersPage, UserDetailPage)
│       └── audit/            (AuditLogPage)
```

## Environment Variables (`.env`)

The app reads **7** `VITE_FIREBASE_*` variables at module load (`src/firebase/config.js`):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=     # optional; passed in config but not required
```

**`src/firebase/config.js` enforces this at import time:** if any of the first 6 are missing it `console.error`s a message listing the missing keys and `throw new Error(...)`s. The build / app refuses to start without them.

For local dev: copy `.env.example` → `.env` and fill in.
For Vercel / Netlify / Firebase Hosting: set the 7 vars in the platform's Environment Variables panel, NOT in a `.env` file (env files are gitignored and not delivered to build platforms).

## Firebase Project

- `projectId: 'eventflow-8da1b'`
- `apiKey: 'AIzaSyAK0wP3wqBvmfSpv4sfp5alIzKvU7_TdSc'` (the value baked into `config.js`'s guard error message at build time, but the real value comes from `VITE_FIREBASE_API_KEY` at runtime).
- Auth: Email/Password only. Google provider fully removed.
- Firestore: native mode (no Datastore). Indexes auto-managed; composite indexes are NOT yet declared — `where('organizationId','==',X) + orderBy('createdAt','desc')` may need a composite index in production.

## Firestore Collections

Defined in `src/firebase/collections.js` as:

| Constant | Collection name | Doc ID convention | Tenant key |
|---|---|---|---|
| `ORGANIZATIONS` | `organizations` | `orgRef.id` (auto) | n/a |
| `USERS` | `users` | `firebaseUser.uid` | `organizationId` |
| `EVENT_TYPES` | `eventTypes` | auto | `organizationId` |
| `INVENTORY` | `inventory` | auto | `organizationId` |
| `EVENTS` | `events` | auto | `organizationId` |
| `QUOTATIONS` | `quotations` | auto | `organizationId` |
| `INVOICES` | `invoices` | auto | `organizationId` |
| `AUDIT_LOGS` | `auditLogs` | auto | `organizationId` |
| `NOTIFICATIONS` | `notifications` | auto | `organizationId` |
| `COUNTERS` | `counters` | `${orgId}_${prefix}_${year}` | n/a (composite key) |

Counter doc shape: `{ value: number, prefix: string, organizationId: string, year: number, updatedAt: serverTimestamp }`.

## Routes (`App.jsx`)

| Path | Page | Guard |
|---|---|---|
| `/` | LandingPage | none |
| `/login` | LoginPage | none |
| `/register` | RegisterPage | none |
| `/verify-email` | VerifyEmailPage | requires `firebaseUser` (else redirect `/login`) |
| `/dashboard` | DashboardPage | `ProtectedRoute` + `AppShell` |
| `/organization` | OrganizationPage | `ProtectedRoute` |
| `/event-types` | EventTypesPage | `ProtectedRoute` |
| `/event-types/new` | EventTypeFormPage | `AdminRoute` |
| `/event-types/:id` | EventTypeDetailPage | `ProtectedRoute` |
| `/event-types/:id/edit` | EventTypeFormPage | `AdminRoute` |
| `/inventory` | InventoryPage | `ProtectedRoute` |
| `/inventory/new` | InventoryFormPage | `AdminRoute` |
| `/inventory/:id` | InventoryDetailPage | `ProtectedRoute` |
| `/inventory/:id/edit` | InventoryFormPage | `AdminRoute` |
| `/events` | EventsPage | `ProtectedRoute` |
| `/events/new` | EventFormPage | `ProtectedRoute` |
| `/events/:id` | EventDetailPage | `ProtectedRoute` |
| `/events/:id/edit` | EventFormPage | `ProtectedRoute` |
| `/quotations` | QuotationsPage | `ProtectedRoute` |
| `/quotations/new` | QuotationFormPage | `ProtectedRoute` |
| `/quotations/:id/edit` | QuotationFormPage | `ProtectedRoute` |
| `/invoices` | InvoicesPage | `ProtectedRoute` |
| `/invoices/new` | InvoiceFormPage | `ProtectedRoute` |
| `/invoices/:id/edit` | InvoiceFormPage | `ProtectedRoute` |
| `/users` | UsersPage | `AdminRoute` |
| `/users/:id` | UserDetailPage | `AdminRoute` |
| `/audit-log` | AuditLogPage | `AdminRoute` |
| `*` | redirect `/dashboard` | — |

## Tailwind v3 Setup

- `tailwind.config.js` extends theme with `app-bg-primary|secondary|tertiary`, `app-text-primary|secondary|muted`, `app-border`, `app-accent` (light/dark variants), `app-danger`, `app-success`, `app-info`. All resolve to CSS custom properties declared in `index.css` so the same class swaps between light and dark automatically when `<html class="dark">` is toggled.
- `fontFamily.display` → Playfair Display; `fontFamily.sans` → DM Sans; `fontFamily.mono` → JetBrains Mono.
- `content` glob: `['./index.html', './src/**/*.{js,jsx}']`.
- Custom utilities used heavily: `min-h-screen flex items-center justify-center bg-app-bg-primary` (page shells), `rounded-2xl border border-app-border bg-app-bg-secondary` (cards).

## Theme System

- `ThemeContext` reads localStorage key `ef_theme`; defaults to `light`.
- On mount and on toggle: writes the value to `localStorage` and adds/removes `dark` class on `<html>`.
- CSS variables in `index.css` define both `:root` and `.dark` blocks; components consume them via `bg-app-bg-secondary text-app-text-primary` etc. (no `dark:` prefix needed).
- Theme toggle button: `Sun` (in light mode) / `Moon` (in dark mode) icon, in Topbar and LandingPage.

## Vite Configuration

`vite.config.js` is minimal — only the `react()` plugin. No headers config, no proxy. (Previously had `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers for `window.crypto.subtle` isolation; removed when Google sign-in was dropped — the only consumer of those headers was the now-removed Google sign-in flow.)

## ESLint (flat config)

`eslint.config.js`:
- `@eslint/js` recommended.
- `eslint-plugin-react-hooks` (`exhaustive-deps: warn`).
- `eslint-plugin-react-refresh` (off — barrel `src/components/ui/index.js` exports many components from one file).
- `react-hooks/set-state-in-effect: off` (intentional; real-time `onSnapshot` callbacks trigger setState in effects).
- `react-hooks/purity: off` (intentional; sample/seed data and form-state resets are non-pure on purpose).
- Pre-existing 4 warnings (all in form pages): `EventTypeFormPage.jsx:82`, `EventFormPage.jsx:121`, `EventDetailPage.jsx:466` (exhaustive-deps), `InvoiceFormPage.jsx` (incompatible-library on date-fns), plus `EventFormPage.jsx:101` and `DashboardPage.jsx:101` "unnecessary dependency" warnings. 0 errors.

## Build / Run

```bash
npm install
npm run dev       # Vite dev server (default :5173)
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm run lint      # ESLint flat-config check
```

Build output: 1 chunk ≈ 1,619 kB (gzip ≈ 447 kB). Bundle is large because Firebase + framer-motion + react-router + react-hook-form are all single-imported; code splitting is a known future improvement.

## Testing

**No automated tests.** No Vitest, no Jest, no React Testing Library. The user has explicitly chosen not to write tests for this iteration. All verification is manual via the dev server.

## Dependency Notes (npm)

- `react` 19.2.6, `react-dom` 19.2.6.
- `firebase` 12.14.0.
- `vite` 8.0.12, `@vitejs/plugin-react` (peer).
- `tailwindcss` 3.4.19, `postcss`, `autoprefixer`.
- `eslint` 9.x, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.
- `framer-motion` 12.40.0, `lucide-react` 1.17.0, `react-hot-toast`, `date-fns`, `uuid`.

There is **no** `@tanstack/react-query`, **no** `axios`, **no** Redux/Zustand. All data is read via real-time `onSnapshot` and written via plain `createDoc`/`updateDocFields`. This is intentional (no server-state library keeps bundle small and the document model is well-bounded).

## Git / Deployment

- `AGENTS.md` documents: do NOT commit unless the user explicitly asks.
- Repo: not currently a git repo (no `.git` directory at the time of writing — verify before any commit work).
- User is on macOS + Safari 18.5; dev work happens in this Windows workspace.
- Vercel is the production host (per user's prior session); Firebase Hosting is documented as an alternative in the README.
