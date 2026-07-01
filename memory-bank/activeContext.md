# Active Context — EventFlow

## Current Focus

**Firebase-only SPA.** EventFlow is a client-side React application using Firebase Authentication and Cloud Firestore as its sole backend. There is no server-side application code.

## Session State (where we are right now)

1. **Memory-bank fully rewritten.** All 5 files now describe EventFlow accurately:
   - `projectbrief.md` — what the app is, business context, modules, roles, non-goals
   - `techContext.md` — stack, env vars, Firebase config, collections, routes, Tailwind, theme
   - `systemPatterns.md` — 15 numbered sections covering architecture, data layer, auth, routing, layout, UI, forms, audit, money, auto-status, numbering, org lifecycle, do-not-do list, security gap, failure-mode history
   - `activeContext.md` — this file
   - `progress.md` — what's done, what remains, blockers
2. **All 24 SKILL.md files in `skills/` are read** (and 24 confirmed in directory listing). Their descriptions auto-load on demand; the agent does not need to pre-load them.
3. **AGENTS.md** is followed. The skill-folder path in AGENTS.md is documented as `.opencode/skills/` but the actual location is `skills/`. The agent has confirmed with the user that the actual location is authoritative.
4. **The user fixed the "Profile missing" bug themselves** during a prior session. The defensive `getIdToken + getDocFromServer + ensureUserProfile` chain in `AuthContext` is still in place as a defense-in-depth layer, but the root cause was apparently on the user's side (not in the app's logic). The recovery button in `ProtectedRoute` / `AdminRoute` remains a useful escape hatch.
5. **Production deployment to Vercel is live** after the user added the 7 `VITE_FIREBASE_*` env vars to their Vercel project. `auth/invalid-api-key` errors are resolved.

## Recently Completed (across the whole project's history)

- Initial EventFlow app (CRUD for 7 entity types, role-based UI, multi-org isolation, audit trail) — built when the project was first scaffolded.
- Theme toggle (light/dark) with instant switching via CSS custom properties and Tailwind theme tokens.
- Dark-mode contrast fix (Pass 2 of theme-perf).
- **localStorage → Firebase migration** (all app data moved from localStorage to Firestore; old data intentionally NOT preserved per user decision).
- **Google sign-in removal** (user preference; email/password only).
- **AuthContext hardening** for the "Profile missing" issue (`getIdToken(true)` + `getDocFromServer` + `ensureUserProfile` self-heal + manual recovery button in `ProtectedRoute` / `AdminRoute`).
- **`MobileNav.jsx` fix** (migrated from `currentUser` / `logout` to `user` / `signOut` from current `AuthContext`; restored mobile bottom nav visibility).
- **Production env-var fix**:
  - Hardened `src/firebase/config.js` to throw at boot with a list of missing `VITE_FIREBASE_*` var names.
  - Created `.env.example` (committed, documents 7 vars).
  - Deleted `.env.production` (was useless; `.env.*` is gitignored).
  - Updated README's Vercel section with explicit env-var setup steps; demoted Firebase Hosting / Netlify to Options 2 and 3.
- **README rewrite** (comprehensive 579-line business+technical doc; `**` bold markers removed per user request via PowerShell `ForEach-Object { $_ -replace '\*\*', '' }` + temp-file rename).
- **Memory-bank full rewrite** (this session — all 5 files for EventFlow).
- **PWA conversion** (this session):
  - Confirmed `vite-plugin-pwa` + icons + meta tags + Firestore persistent cache already in place.
  - Replaced manual `navigator.serviceWorker.register()` with `registerSW` from `virtual:pwa-register` — shows toast on new version / offline ready.
  - Created `src/firebase/messaging.js` — `getFcmToken()` and `onForegroundMessage()` for FCM.
  - Created `public/firebase-messaging-sw.js` — FCM background SW for push notifications with hardcoded Firebase config.
  - Created `src/components/NotificationPermission.jsx` — opt-in banner for push notifications, saves token to Firestore `users/{uid}.fcmToken`.
  - Wired `NotificationPermission` + foreground message listener into `AppShell.jsx`.
  - Added `VITE_FIREBASE_VAPID_KEY` to `.env.example`; user supplied their VAPID key.
  - `useInstallPrompt`/`InstallPrompt.jsx` and `useOnlineStatus`/`OfflineBanner.jsx` were already implemented (0 changes needed).
- **Code splitting + chunk optimization** (this session):
  - Converted all 22 page imports in `App.jsx` from static to `React.lazy()` + `Suspense`.
  - Added `build.rollupOptions.output.manualChunks` in `vite.config.js` splitting Firebase (459 KB), React/Router (182 KB), framer-motion (133 KB), other vendors (772 KB), and shared app code (53 KB) into separate chunks.
  - Build time: 12s → 6s.
- **Lint cleanup** (this session):
  - Fixed unused imports in `InstallPrompt.jsx`, `OfflineBanner.jsx`, `NotificationPermission.jsx`.
  - Added `/* eslint-disable */` to `public/firebase-messaging-sw.js` (SW globals not in browser env).
- **PWA install prompt fix** (this session):
  - Moved `beforeinstallprompt` listener from `useEffect` to module level in `useInstallPrompt.js` (catches the event before React mounts).
  - Added `InstallButton` component (sidebar icon button + MobileNav drawer entry) as a visible fallback to trigger install even if the automatic prompt doesn't appear.

## Known Issues / Quick Wins (in priority order)

1. **`checkAndUpdateOverdueInvoices` is a no-op** (`src/utils/invoiceHelpers.js`). The helper runs on `InvoicesPage` mount but the filter uses `['UNPAID','PARTIAL']` which don't match actual invoice statuses (`DRAFT|SENT|PAID|OVERDUE|CANCELLED`). The function effectively does nothing. **Fix: change to `['SENT']`.** Trivial 1-line change.
2. **`src/utils/numbering.js` and `src/utils/idGenerator.js` are dead code.** `numbering.js` imports the deleted `./storage` module and will fail to resolve; `idGenerator.js` is never imported. Safe to delete.
3. **`src/utils/notifications.js`'s `generateEventNotifications` is an empty stub.** Not called anywhere; can be deleted or implemented.
4. **`docs/instructions.md` and `docs/documentation.md` are stale** (describe the pre-Firebase localStorage architecture). **TODO: rewrite for current Firebase architecture.**
5. **Last-admin demotion guard** is UI-only. Direct Firestore writes could bypass it. **TODO: Cloud Function for server-side enforcement (v2).**
6. **FCM token storage** in `NotificationPermission.jsx` writes to Firestore `users/{uid}` doc. This works because the app is Firebase-only.
7. **Lint warnings** (4 pre-existing, not blocking):
   - `EventTypeFormPage.jsx:82` — exhaustive-deps
   - `EventFormPage.jsx:121` — exhaustive-deps
   - `EventDetailPage.jsx:466` — exhaustive-deps
   - `InvoiceFormPage.jsx` — `incompatible-library` (date-fns)
   - `EventFormPage.jsx:101` and `DashboardPage.jsx:101` — "unnecessary dependency"
8. **No automated tests** (Vitest, React Testing Library, Playwright). User has chosen not to add them this iteration.
9. **No `firestore.rules` in the repo.** Deployed rules are permissive. Drafted org-scoped rules exist in earlier sessions but were never committed. **TODO: commit `firestore.rules` + `firebase.json` and deploy.**

## Active Decisions

- **Email/password only** for auth. No Google, no OAuth, no SSO.
- **Firebase only** for persistence. No localStorage for app data. (Theme is the one localStorage holdout.)
- **Don't migrate old data.** The pre-Firebase localStorage data was abandoned.
- **Per-org per-year counter** for quotation and invoice numbering (`QUO-2026-0001`). Implemented as a Firestore transactional counter doc at `counters/${orgId}_${prefix}_${year}`.
- **Vercel is the production host.** Firebase Hosting is documented as a fallback.
- **CI is `npm run lint` + `npm run build`** locally. No CI/CD pipeline configured.
- **No automated tests** in this iteration.
- **2-second regex pattern in `useAuditLogs`**: when filtering by `entityType` AND `entityId`, Firestore may need a composite index. This is a known production hazard.
- **Roles are stored as plain strings** (`'ADMIN' | 'STAFF'`), not Firestore-enum refs. `src/constants/roles.js` exports `ROLES = { ADMIN, STAFF }` for in-code use; `ROLES.ADMIN` and the string literal `'ADMIN'` are interchangeable (the UI checks `profile?.role === 'ADMIN'` directly in `AuthContext`).
- **`getNextNumber` returns padded 4-digit numbers** (e.g. `QUO-2026-0001`). If an org ever exceeds 9,999 / prefix / year, the format would need to expand — not a v1 concern.

## Next Concrete Steps (in recommended order)

1. **Fix the `checkAndUpdateOverdueInvoices` filter** to use `['SENT']` instead of `['UNPAID','PARTIAL']`. Trivial 1-line fix in `src/utils/invoiceHelpers.js`.
2. **Delete the dead files** `src/utils/numbering.js` and `src/utils/idGenerator.js`. They are never imported. (Run a grep first to confirm.)
3. **Commit `firestore.rules` + `firebase.json`** with org-scoped auth-based rules + composite index declarations for the audit log query. Run `firebase deploy --only firestore:rules` and `firebase deploy --only firestore:indexes`.
4. **Rewrite `docs/instructions.md` and `docs/documentation.md`** for the current Firebase-backed architecture (user aborted a prior pass; need to confirm with user what they want preserved).
5. **Implement `generateEventNotifications`** if the user wants real-time notifications (the panel exists; nothing ever writes to it). Suggested triggers: event status change, payment recorded, quotation/invoice sent.
6. **Add a Cloud Function** for the last-admin constraint (server-side enforcement of the demote-only-if-multiple-admins rule).
7. **(Optional) Add a `useDoc` cleanup**: `useDoc` currently calls `onSnapshot` directly. If a component re-mounts quickly the listener can briefly overlap. Not a real problem in practice.
8. **(Optional) Replace `Tailwind v3` config with `v4` `@theme` blocks** to match modern conventions. Not urgent; v3 is well-supported.
9. **(Optional) Add FCM VAPID key to Vercel env vars** so push notifications work in production.

## Files in Flight This Session

- `src/main.jsx` — DONE (registerSW instead of manual navigator.serviceWorker.register)
- `src/firebase/messaging.js` — DONE (new FCM utility)
- `public/firebase-messaging-sw.js` — DONE (new FCM background SW)
- `src/components/NotificationPermission.jsx` — DONE (new opt-in banner)
- `src/components/layout/AppShell.jsx` — DONE (wired NotificationPermission + foreground listener)
- `.env.example` — DONE (added VITE_FIREBASE_VAPID_KEY)
- `src/App.jsx` — DONE (React.lazy + Suspense for all 22 pages)
- `vite.config.js` — DONE (manualChunks splitting)
- `src/components/InstallPrompt.jsx` — DONE (removed unused AnimatePresence import)
- `src/components/OfflineBanner.jsx` — DONE (removed unused X import)
- `src/components/NotificationPermission.jsx` — DONE (removed unused imports, fixed empty catch)
- `public/firebase-messaging-sw.js` — DONE (added eslint-disable for SW globals)
- `src/hooks/useInstallPrompt.js` — DONE (module-level listener + custom events)
- `src/components/InstallButton.jsx` — DONE (new fallback install button)
- `src/components/layout/Sidebar.jsx` — DONE (added InstallButton next to logout)
- `src/components/layout/MobileNav.jsx` — DONE (added InstallButton in drawer footer)
- `memory-bank/activeContext.md` — DONE (this file, corrected)
- `memory-bank/progress.md` — PENDING (next)

## Environment Notes

- Platform: Windows (PowerShell 5.1); OpenCode running in the workspace.
- Working dir: `C:\Users\Tinashe Gomo\Desktop\EventFlow-Firebase\frontend`.
- User's dev platform: macOS + Safari 18.5 (per prior session's Network tab UA).
- Bash: use `;` not `&&`; use `Get-ChildItem` instead of `ls`; use `workdir` parameter for `cd` chains.
- Git: not currently a repo (no `.git` directory). All edits are direct file writes. **Do NOT commit without explicit user instruction.**
- `AGENTS.md` says `.opencode/skills/` but the real path is `skills/`. Trust the real path.

## Open Questions for the User (when relevant)

- Do you want lazy-loaded routes in v1, or is the 1.6 MB initial bundle acceptable?
- Do you want a Cloud Function for the last-admin demote guard, or is the UI-only check sufficient?
- Do you want me to write a `firestore.rules` deploy plan + the actual rules file, or do you want to handle that separately?
- For the dead `src/utils/numbering.js` and `src/utils/idGenerator.js`: safe to delete, or are you using them via a side path I haven't seen?
- Do you want notifications wired up (the panel exists, nothing writes to it), or is it dead?
