# Progress — EventFlow

## Status Legend
- [x] Done
- [~] In progress / partial
- [ ] Not started
- [!] Blocked / needs decision

---

## Project Scaffold

- [x] `package.json` with React 19.2.6, Vite 8.0.12, Firebase 12.14.0, Tailwind 3.4.19, framer-motion 12.40.0, lucide-react 1.17.0
- [x] `vite.config.js` (VitePWA plugin + manualChunks for firebase/react-vendor/motion/vendor)
- [x] `eslint.config.js` (flat config; React Hooks + React Refresh; selective rule disable)
- [x] `tailwind.config.js` (theme tokens for app-bg/text/border/accent/danger; fonts Playfair/DM Sans/JetBrains Mono)
- [x] `postcss.config.js` (tailwindcss + autoprefixer)
- [x] `index.html` (Vite entry)
- [x] `.gitignore` (covers `.env`, `.env.*`, `dist`, `node_modules`, `.planning`)
- [x] `.env.example` (documents 7 `VITE_FIREBASE_*` vars; committed)
- [x] `src/main.jsx` (createRoot + StrictMode + registerSW from virtual:pwa-register)
- [x] `src/App.jsx` (BrowserRouter + ThemeProvider + AuthProvider + 22 routes + React.lazy + Suspense)
- [x] `src/index.css` (Tailwind directives + CSS custom properties for light/dark)

---

## Auth & Multi-Tenancy

- [x] `src/firebase/config.js` — initializeApp + env-var guard + persistent Firestore cache
- [x] `src/firebase/collections.js` — 10-collection name registry (used as string constants)
- [x] `src/firebase/db.js` — Firestore query/mutation helpers (orgQuery, fetch*, create*, update*, delete*, subscribe*, getNextNumber)
- [x] `src/context/AuthContext.jsx` — Firebase Auth (onAuthStateChanged, getIdToken, getDocFromServer, ensureUserProfile self-heal)
- [x] `src/context/ThemeContext.jsx` — localStorage `ef_theme` + `<html>` `dark` class (unchanged)
- [x] `src/pages/auth/LandingPage.jsx` — public hero + theme toggle (unchanged)
- [x] `src/pages/auth/RegisterPage.jsx` — uses Firebase `createUserWithEmailAndPassword` + `createUserProfile`
- [x] `src/pages/auth/LoginPage.jsx` — uses Firebase `signInWithEmailAndPassword` + `ensureUserProfile`
- [x] `src/pages/auth/VerifyEmailPage.jsx` — shows email verification status + refresh button
- [x] `src/components/guards/ProtectedRoute.jsx` — requires firebaseUser + isEmailVerified + profile; Profile-missing recovery screen
- [x] `src/components/guards/AdminRoute.jsx` — requires isAdmin + Firestore diagnostic profile-recovery UI
- [x] Google sign-in **fully removed** (no `googleProvider` exported, no Google buttons anywhere)
- [x] `src/utils/userProfile.js` — `createUserProfile`, `ensureUserProfile` (idempotent org+user creation)

---

## UI Components (`src/components/ui/`)

- [x] `Button` (variants, sizes, `loading`/`isLoading`, default `type="button"`)
- [x] `Input` (label, error, hint, left/right icon, `useId`)
- [x] `Select` (label, error, options or children)
- [x] `Textarea` (label, error, hint)
- [x] `Badge` (status-to-color map for ~30 statuses)
- [x] `Card` (default + clickable)
- [x] `StatCard` (KPI tile with trend + color)
- [x] `PageHeader` (title, subtitle, actions)
- [x] `EmptyState` (icon, title, description, action)
- [x] `Modal` (portal, AnimatePresence, backdrop+Escape close)
- [x] `ConfirmDialog` (Modal wrapper with variant)
- [x] `Table` (columns, data, loading, error, mobile card fallback)
- [x] `NotificationPanel` (portal-mounted slide-in; live `onSnapshot`; mark-all-read via `writeBatch`)
- [x] `Skeleton` (animate-pulse placeholder)
- [x] `index.js` barrel export

---

## Layout (`src/components/layout/`)

- [x] `AppShell` (flex column; main `pb-20 md:pb-6`; wired OfflineBanner + NotificationPermission + foreground push handler)
- [x] `Sidebar` (desktop; org logo/initials + nav + user chip + logout; adminOnly filter)
- [x] `Topbar` (page title via `titleMap` + theme toggle + notification bell + sign-out)
- [x] `MobileNav` (bottom tab bar + More drawer; uses `user`/`signOut` from current `AuthContext`)
- [x] `PageTransition` (Framer Motion enter/exit) + `StaggerList` helper

---

## Pages

### Dashboard
- [x] `src/pages/dashboard/DashboardPage.jsx` — KPI tiles (this-month events, upcoming 30 days, pending invoices, open quotations) + upcoming events list + recent activity + quick actions

### Organization
- [x] `src/pages/organization/OrganizationPage.jsx` — name + logo upload (1 MB limit) + remove logo; `writeAuditLog` on save

### Event Types (with tiered pricing)
- [x] `src/pages/event-types/EventTypesPage.jsx` — grid of cards, min/max price range, in-use delete guard
- [x] `src/pages/event-types/EventTypeFormPage.jsx` — suggestions, icon picker, color picker, pricing tiers (`uuid`-keyed)
- [x] `src/pages/event-types/EventTypeDetailPage.jsx` — overview + pricing tiers table + events-using-this-type + audit history

### Inventory (with variants)
- [x] `src/pages/inventory/InventoryPage.jsx` — table (desktop) + card list (mobile), search + category filter
- [x] `src/pages/inventory/InventoryFormPage.jsx` — details + variants array (size/pricePerUnit/quantityInStock)
- [x] `src/pages/inventory/InventoryDetailPage.jsx` — overview + variants table + total stock/value + used-in-events + audit history

### Events (list + calendar)
- [x] `src/pages/events/EventsPage.jsx` — list view (5 filters + sort) + calendar view (month grid + day popover)
- [x] `src/pages/events/EventFormPage.jsx` — full event details + tier-vs-custom pricing + initial deposit + attached inventory items
- [x] `src/pages/events/EventDetailPage.jsx` — overview + inventory breakdown + payment card (Record Payment modal) + audit history

### Quotations
- [x] `src/pages/quotations/QuotationsPage.jsx` — list + search + status filter + convert-to-invoice + delete
- [x] `src/pages/quotations/QuotationFormPage.jsx` — client + linked event + inventory line items + discount% + tax% + `getNextNumber('QUO', orgId)` auto-numbering
- [x] `markExpiredQuotations` runs on page mount (DRAFT/SENT → EXPIRED via `writeBatch`)

### Invoices
- [x] `src/pages/invoices/InvoicesPage.jsx` — list + search + status filter + mark-as-paid (via `markInvoiceAsPaid`) + delete (rolls back linked quotation to ACCEPTED)
- [x] `src/pages/invoices/InvoiceFormPage.jsx` — supports `?fromQuotation=<id>` deep link to auto-populate from a quotation; converts source quotation's `lineItems` into invoice lines; sets source quotation to `CONVERTED`
- [x] `checkAndUpdateOverdueInvoices` runs on page mount (currently a no-op due to wrong status filter; see Known Issues)

### Team Management
- [x] `src/pages/users/UsersPage.jsx` — table + promote/demote (with last-admin guard) + audit log
- [x] `src/pages/users/UserDetailPage.jsx` — profile + activity stats + audit history scoped to user

### Audit Log
- [x] `src/pages/audit/AuditLogPage.jsx` — date range + entity-type pill filter + action pill filter + user filter + expand-on-click details

### Notifications
- [x] NotificationPanel renders live; nothing currently WRITES to it (see Known Issues)

---

## PWA & Offline

- [x] `vite-plugin-pwa` installed (devDependency, `^1.3.0`)
- [x] `vite.config.js` — VitePWA plugin with `registerType: 'autoUpdate'`, full manifest, Workbox runtime caching (Google Fonts, Firebase Storage), `navigateFallbackDenylist`
- [x] `public/` icons — `pwa-192x192.png`, `pwa-512x512.png`, `pwa-512x512-maskable.png`, `apple-touch-icon.png`, `masked-icon.svg`, `favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png`, `icons.svg`
- [x] `index.html` — PWA meta tags (`theme-color: #C17F24`, `apple-mobile-web-app-capable`, etc.) + icon links
- [x] `src/firebase/config.js` — `initializeFirestore` with `persistentLocalCache({tabManager: persistentMultipleTabManager()})`
- [x] `src/main.jsx` — `registerSW` from `virtual:pwa-register` with update/offline toast notifications
- [x] `src/hooks/useInstallPrompt.js` — captures `beforeinstallprompt` event, handles iOS detection
- [x] `src/hooks/useOnlineStatus.js` — tracks `navigator.onLine` via `online`/`offline` events
- [x] `src/components/InstallPrompt.jsx` — floating install card (Android + iOS instructions with localStorage dismiss)
- [x] `src/components/InstallButton.jsx` — inline install icon button for Sidebar/MobileNav (fallback if floating card doesn't appear)
- [x] `src/components/OfflineBanner.jsx` — animated offline warning banner (`WifiOff` + "Changes will sync when reconnected")
- [x] `src/components/NotificationPermission.jsx` — opt-in push notification banner, saves FCM token to Firestore
- [x] `src/components/layout/AppShell.jsx` — wires OfflineBanner, NotificationPermission, foreground push toast handler
- [x] `src/firebase/messaging.js` — `getFcmToken()` and `onForegroundMessage()` FCM utilities
- [x] `public/firebase-messaging-sw.js` — FCM background SW with hardcoded config + notification click handler
- [x] `.env.example` — documents `VITE_FIREBASE_VAPID_KEY`
- [x] `npm run build` generates `sw.js` + `workbox-*.js` + `manifest.webmanifest` (52 precached entries)

---

## Utilities

- [x] `src/utils/audit.js` — `writeAuditLog({ organizationId, userId, userName, action, entityType, entityId, entityName, details, diff })`
- [x] `src/utils/business.js` — `computeQuotationTotals` (rounded 2dp), status enums, `EVENT_TYPE_SUGGESTIONS`/`ICONS`/`COLORS`, `INVENTORY_UNITS`
- [x] `src/utils/dateHelpers.js` — `formatDate`, `formatDateTime`, `formatTime`, `daysUntil`, `isToday`/`Tomorrow`/`Past`, `formatRelative`, `formatCurrency`, `getCountdownLabel`
- [x] `src/utils/paymentHelpers.js` — `buildPaymentSummary`, `buildNewPayment`, `getChargedPrice`, `getTotalPaid`, `getBalance`, `computePaymentStatus`
- [x] `src/utils/quotationHelpers.js` — `markExpiredQuotations` (batch)
- [x] `src/utils/invoiceHelpers.js` — `checkAndUpdateOverdueInvoices` (no-op bug, see Known Issues), `markInvoiceAsPaid`
- [x] `src/utils/notifications.js` — `writeNotification`; `generateEventNotifications` is empty stub
- [ ] `src/utils/numbering.js` — **DEAD CODE** (imports deleted `./storage`); safe to delete
- [ ] `src/utils/idGenerator.js` — **DEAD CODE** (uuid wrapper; never imported); safe to delete

---

## Hooks

- [x] `src/hooks/useOrgCollection.js` — real-time `onSnapshot` of org-scoped collection; + `useDoc` (single doc subscription)
- [x] `src/hooks/useAuditLogs.js` — filtered `onSnapshot` for `auditLogs` with options
- [x] `src/hooks/useCountUp.js` — `useCountUp(end, duration=800)` with rAF + cubic-ease-out (unchanged)
- [x] `src/hooks/useInstallPrompt.js` — captures `beforeinstallprompt` event
- [x] `src/hooks/useOnlineStatus.js` — tracks online/offline status

---

## Documentation

- [x] `AGENTS.md` (skill-driven agent workflow; 24 skills auto-invoke; reference path stale — real is `skills/`)
- [x] `README.md` (comprehensive 579-line business+technical doc; `**` bold markers removed; Vercel promoted to Option 1 in deployment)
- [x] `memory-bank/projectbrief.md` (accurate Firebase-only description)
- [x] `memory-bank/techContext.md` (accurate stack description)
- [x] `memory-bank/systemPatterns.md` (15 sections covering Firebase architecture)
- [x] `memory-bank/activeContext.md` (this rewrite, corrected)
- [x] `memory-bank/progress.md` (this file)
- [ ] `docs/instructions.md` — STALE (pre-Firebase localStorage build prompt); user aborted rewrite
- [ ] `docs/documentation.md` — STALE (pre-Firebase localStorage system doc); user aborted rewrite

---

## Skills (`skills/`, 24 SKILL.md files)

All present; descriptions load on demand per `AGENTS.md`. The ones the agent auto-applies to this project:

| Skill | When |
|---|---|
| `using-agent-skills` | Session start (meta) |
| `context-engineering` | Session start, AGENTS.md compliance |
| `source-driven-development` | Verify React/Vite/Firebase patterns against official docs |
| `spec-driven-development` | New features |
| `planning-and-task-breakdown` | Multi-step features |
| `incremental-implementation` | Anything touching >1 file |
| `test-driven-development` | NOT ACTIVE — no tests this iteration |
| `debugging-and-error-recovery` | Build/lint/runtime errors |
| `code-review-and-quality` | Before any commit |
| `code-simplification` | When refactoring |
| `security-and-hardening` | Auth, user input, data storage (every endpoint) |
| `frontend-ui-engineering` | All page builds |
| `ui-ux-pro-max` | Visual quality of all pages |
| `api-and-interface-design` | Any new endpoint or contract change |
| `documentation-and-adrs` | Recording decisions |
| `doubt-driven-development` | High-stakes decisions |
| `git-workflow-and-versioning` | NOT ACTIVE — not a git repo |
| `ci-cd-and-automation` | NOT ACTIVE — no CI/CD |
| `shipping-and-launch` | ACTIVE — Vercel deployment done |
| `performance-optimization` | Relevant — bundle is 1.6 MB |
| `browser-testing-with-devtools` | NOT ACTIVE — no chrome-devtools MCP |
| `deprecation-and-migration` | COMPLETED — localStorage→Firebase done |
| `idea-refine` | NOT ACTIVE — no vague ideas in flight |
| `interview-me` | NOT ACTIVE — specs clear from code |

---

## Known Issues (priority order)

1. [!] **`checkAndUpdateOverdueInvoices` filter is wrong** (`src/utils/invoiceHelpers.js:11`). Filter uses `['UNPAID','PARTIAL']` but invoice statuses are `DRAFT|SENT|PAID|OVERDUE|CANCELLED`. Function is a no-op in practice. **Fix: change to `['SENT']`.** Trivial 1-line change.
2. [ ] **No `firestore.rules` in the repo.** Deployed rules are permissive. Drafted org-scoped rules exist in earlier sessions but were never committed. **TODO: commit `firestore.rules` + `firebase.json` and deploy.**
3. [ ] **No composite index declarations** for queries like `where('organizationId','==',X) + orderBy('createdAt','desc')`. May surface as runtime errors. **TODO: declare indexes + deploy.**
4. [ ] **Dead code in `src/utils/`** — `numbering.js` (imports deleted `./storage`), `idGenerator.js` (never imported). **Safe to delete; should be removed in cleanup pass.**
5. [ ] **Empty stub** — `src/utils/notifications.js`'s `generateEventNotifications` is empty. Not called anywhere. Either implement (event status change, payment recorded) or delete.
6. [ ] **`docs/instructions.md` and `docs/documentation.md` are stale.** Pre-Firebase localStorage content. **TODO: rewrite for current Firebase architecture.**
7. [ ] **Last-admin demotion guard is UI-only.** Direct Firestore writes could bypass it. **TODO: Cloud Function for server-side enforcement (v2).**
8. [ ] **4 pre-existing lint warnings** (not blocking): `EventTypeFormPage.jsx:82`, `EventFormPage.jsx:121`, `EventDetailPage.jsx:466` (exhaustive-deps), `InvoiceFormPage.jsx` (incompatible-library), plus `EventFormPage.jsx:101` and `DashboardPage.jsx:101` (unnecessary dependency). 0 errors.
9. [ ] **No automated tests.** No Vitest, no Jest, no RTL, no Playwright. User's choice for this iteration.
10. [ ] **FCM VAPID key not set on Vercel.** Push notifications won't work in production until `VITE_FIREBASE_VAPID_KEY` is added to Vercel env vars. Local `.env` has it.

## Resolved Issues (history)

- [x] **"Profile missing" on cold start** — fixed in `AuthContext.jsx` via `getIdToken(true) + getDocFromServer + ensureUserProfile` self-heal. User also fixed at their end.
- [x] **`auth/invalid-api-key` on Vercel** — fixed by `config.js` env-var guard + `.env.example` + README Vercel setup instructions.
- [x] **Mobile bottom nav invisible** — fixed in `MobileNav.jsx` (migrated `currentUser`/`logout` → `user`/`signOut`).
- [x] **Dark-mode contrast** — fixed in theme tokens (Pass 2 of theme-perf).
- [x] **Google sign-in removal** — provider fully removed; email/password only.
- [x] **localStorage → Firebase migration** — completed; old data intentionally not preserved.
- [x] **README comprehensive rewrite** — 579 lines, `**` markers removed.
- [x] **Memory-bank rewrite** — all 5 files reflect current EventFlow (this session, corrected).
- [x] **PWA conversion** — full installable PWA with SW, manifest, icons, offline cache, install prompt, update notifications, FCM push infrastructure.
- [x] **Code splitting** — all 22 pages lazy-loaded; vendor chunks split into firebase (459 KB), react-vendor (182 KB), motion (133 KB), vendor (772 KB), shared app (53 KB).
- [x] **Build performance** — improved from ~12s to ~6s.

## Build & Deploy

- [x] `npm run dev` works
- [x] `npm run build` passes (multiple chunks; biggest vendor ~772 KB; build time ~6s)
- [x] `npm run build` generates PWA artifacts: `sw.js`, `workbox-*.js`, `manifest.webmanifest`, `firebase-messaging-sw.js` (52 precached entries)
- [x] `npm run lint` passes (4 warnings, 0 errors)
- [x] Deployed to Vercel (per user); env vars set in Vercel Dashboard; `VITE_FIREBASE_VAPID_KEY` still needs to be added to Vercel
- [x] Firebase project `eventflow-8da1b` configured; email/password provider enabled; Google provider disabled
- [ ] Firebase Hosting fallback documented but not yet tested
- [ ] Netlify fallback documented but not yet tested
