# System Patterns — EventFlow

## 1. Architecture

EventFlow is a **client-only SPA**. There is no server-side application code. The browser runs the React app, which talks directly to Firebase Authentication and Cloud Firestore.

```
Browser (React + Vite)
  ├── AuthContext         (Firebase Auth state)
  ├── ThemeContext        (light/dark)
  ├── Pages               (per-route components)
  │     ├── read          →  onSnapshot via useOrgCollection / useAuditLogs
  │     ├── write         →  createDoc / updateDocFields / deleteDocById
  │     └── log           →  writeAuditLog(...)   ← every mutation
  └── Firebase
        ├── Auth          (email/password)
        └── Firestore     (10 collections; org-scoped queries)
```

No HTTP client, no REST API, no service worker, no background sync. All state is "live" via `onSnapshot` subscriptions.

## 2. Data Layer (`src/firebase/`)

### `config.js` — env-var guard

At module load, `config.js` reads `import.meta.env.VITE_FIREBASE_*` and throws if any of the six required vars is missing. This means **a misconfigured deployment fails fast at boot** instead of failing later with a cryptic `auth/invalid-api-key`.

### `collections.js` — name registry

The `COLLECTIONS` constant is the single source of collection names. Every query and write goes through it. No string literals scattered through the code.

### `db.js` — query / mutation helpers

All reads and writes go through these helpers, never directly via `getDocs`/`setDoc` from page components. Notable helpers:

- `orgQuery(collectionName, orgId, ...constraints)` — `where('organizationId','==',orgId) + ?constraints`. Used by `useOrgCollection` and `useAuditLogs`.
- `fetchOrgCollection(name, orgId)` — one-shot fetch (rarely used; pages prefer real-time).
- `fetchDoc(name, id)` — one-shot single doc fetch.
- `createDoc(name, data)` — `addDoc` with auto `createdAt` + `updatedAt` `serverTimestamp`.
- `setDocWithId(name, id, data)` — for `createUserProfile`, `createUserProfile` (we know the uid).
- `updateDocFields(name, id, data)` — sets `updatedAt` serverTimestamp on every update.
- `deleteDocById(name, id)` — `deleteDoc`.
- `subscribeToOrgCollection(name, orgId, callback, errorCallback)` — wraps `onSnapshot` and returns the unsubscriber. Used by `useOrgCollection`.
- `subscribeToDoc(name, id, callback, errorCallback)` — same for single docs. Currently NOT used by any hook (we use `useDoc` which calls `onSnapshot` directly).
- `getNextNumber(prefix, orgId)` — **transactional** counter. The counter doc id is `${orgId}_${prefix}_${year}` (e.g. `Y1Pbr..._QUO_2026`). Inside `runTransaction` it reads the current `value` (or 0), writes `value+1`, and returns the formatted string `PREFIX-YYYY-####`. Used by `QuotationFormPage` and `InvoiceFormPage`.

### `getNextNumber` details

- Idempotent and contention-safe: `runTransaction` is atomic.
- Per-org + per-year: changing orgs or years gets a fresh counter (counter id is composite).
- Returns string: `QUO-2026-0001`. The 4-digit pad is sufficient for the v1 expected volume (≤ 9,999 / org / year / prefix).
- Audit log entry uses the formatted number as `entityName`.

## 3. Auth Layer (`src/context/AuthContext.jsx`)

The single most important file in the app. The flow:

```
onAuthStateChanged(auth, user => {
  if (!user)                       → loading=false, profile=null
  if (user) {
    await user.getIdToken(true)    ← force-refresh so Firestore sees a fresh auth context
    snap = await getDocFromServer(userRef)
    if (!snap.exists()) {
      profile = await ensureUserProfile(user)  ← creates profile + org if missing
      // brief 500ms wait then re-read; if still missing, use returned profile directly
    }
    if (snap.exists()) profile = snap
    setProfile(profile)
    setOrganization(await loadOrg(profile.organizationId))  ← getDocFromServer on org doc
  }
})
```

### Why `getDocFromServer` (not `onSnapshot`)

The auth flow uses `getDocFromServer` to force a server round-trip and bypass any cache. This is intentional Hyrum's-law defense: on cold start, `onSnapshot` can return a stale "profile missing" before the server says otherwise. `getIdToken(true)` is the additional fix for a known race where the ID token isn't yet valid for outbound calls.

### `ensureUserProfile` (`src/utils/userProfile.js`)

- Idempotent. If the user doc exists, returns it.
- If not, derives an org name from the email domain (`tinashe@acme.com` → "Acme") and creates a new `organizations` doc (auto-id) and a `users` doc keyed by `firebaseUser.uid` with `role: 'ADMIN'`.
- `createUserProfile` is the non-fallback version used by `RegisterPage` (where the user supplies a display name and org name explicitly).

### Exposed context value

```js
{
  firebaseUser,        // raw Firebase Auth user (or null)
  user,                // profile doc { id, uid, email, displayName, photoURL, organizationId, role, emailVerified, createdAt, updatedAt }
  organization,        // org doc { id, name, logo, ownerId, ... }
  currentOrg,          // alias of `organization` (for clarity at call sites)
  loading,             // true during initial auth+profile+org resolution
  profileError,        // Error object from the profile read (or null)
  isAuthenticated,     // !!firebaseUser
  isEmailVerified,     // !!firebaseUser?.emailVerified
  isAdmin,             // profile?.role === 'ADMIN'
  signOut,             // fbSignOut wrapper
  refreshUser,         // auth.currentUser.reload() + setState (used on VerifyEmailPage to recheck)
}
```

A separate effect syncs `firebaseUser.emailVerified` into the Firestore profile field as best-effort metadata. The actual auth gate reads `firebaseUser.emailVerified` (the source of truth), not the Firestore field.

## 4. Routing & Guards (`src/components/guards/`)

- `ProtectedRoute` — requires `firebaseUser`, `isEmailVerified`, and a non-null `profile`. If profile is missing but `firebaseUser` exists, shows an amber "Profile missing" screen with a "Create profile now" recovery button (calls `ensureUserProfile`, then `window.location.reload()`).
- `AdminRoute` — all of the above plus `isAdmin`. If non-admin, redirects to `/dashboard`. The Profile-missing recovery screen is **richer** here (red "Profile unreadable" if `profileError` is set, with diagnostic; amber "Profile missing" otherwise, with diagnostic + recovery).

`AdminRoute` has a built-in diagnostic that does a `getDocFromServer` against the expected `users/{uid}` path and reports `projectId`, `uid`, the `code` of any error, and a "doc found" / "doc-missing" / "error" reason. This was the user's escape hatch during the "Profile missing" debugging session.

## 5. Layout & Responsive

### `AppShell` (`src/components/layout/AppShell.jsx`)

```jsx
<div className="flex h-screen overflow-hidden bg-app-bg-primary">
  <Sidebar />                         ← hidden md:flex (desktop only)
  <div className="flex flex-col flex-1 overflow-hidden">
    <Topbar />
    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
      {children}
    </main>
  </div>
  <MobileNav />                       ← md:hidden (mobile only)
</div>
```

The `pb-20 md:pb-6` on `<main>` is essential — it leaves room for the fixed bottom tab bar on mobile so the last list item isn't hidden behind it.

### `Sidebar` — desktop nav

`navLinks` array (9 entries) is filtered by `isAdmin` for `adminOnly: true` links (Team, Audit Log). Active link uses Framer Motion's `layoutId="activeNav"` for a smooth sliding indicator. Shows org logo (or initials), org name, current user with role badge, and a logout button.

### `Topbar` — page title + actions

Reads `location.pathname` and looks up a `titleMap` (e.g. `/events` → "Events"). Renders a notification bell (live unread count via `onSnapshot`), a theme toggle, a sign-out icon button, and the current user's initials.

### `MobileNav` — bottom tab bar + More drawer

4 main links (Dashboard, Events, Quotes, Invoices) plus a "More" button that opens a right-side drawer with the remaining links, filtered by `isAdmin` for admin-only entries. Logout is at the bottom of the drawer.

**The single bug found in this area** (`MobileNav` was using the old `currentUser` / `logout` from the pre-Firebase localStorage `AuthContext`): the early-return `if (!user) return null;` made the entire mobile nav invisible. Fixed by switching to `user` and `signOut` from the current `AuthContext`. All other components had been migrated in a prior pass.

### `PageTransition` & `StaggerList`

`PageTransition` is a thin Framer Motion wrapper (`opacity` + `y` 16px → 0 on enter, `y` -8px on exit, 250ms ease-out). Wraps every page. `StaggerList` is an exported helper that staggers child entries by `index * 0.05` seconds (capped at 0.5s).

## 6. UI Components (`src/components/ui/`)

15 components, barrel-exported from `index.js`:

| Component | Notes |
|---|---|
| `Button` | variants: `primary|secondary|danger|ghost`; sizes: `sm|md|lg`; accepts `loading` and `isLoading`; default `type="button"` (so it doesn't accidentally submit forms); shows `Loader2` spinner when busy. |
| `Input` | `label`, `error`, `hint`, `leftIcon`, `rightIcon`; uses `useId()` for label-for binding; red `app-danger` border on error. |
| `Select` | same shape as `Input`; `options` is `[{value, label}]` or passthrough children. |
| `Textarea` | `label`, `error`, `hint`; `min-h-[100px] resize-y`. |
| `Badge` | status-to-color map covering ~30 statuses (event, quotation, invoice, role, action). |
| `Card` | `bg-app-bg-secondary` border + shadow; `clickable` variant adds hover+accent. |
| `StatCard` | KPI tile: `title`, `value`, `icon`, optional `trend{direction,value,label}`, `color` (blue/amber/red/green/purple/accent). |
| `PageHeader` | `title`, `subtitle`, `actions`; responsive flex layout. |
| `EmptyState` | `icon`, `title`, `description`, `action{label,onClick,icon}`. |
| `Modal` | `isOpen`, `onClose`, `title`, `children`, `size`; `createPortal` + `AnimatePresence`; backdrop click + Escape key both close; `bg-black/50 backdrop-blur-sm`. |
| `ConfirmDialog` | wraps `Modal`; `variant` for danger styling. |
| `Table` | `columns`, `data`, `isLoading`, `error`, `onRetry`; mobile falls back to stacked cards. |
| `NotificationPanel` | portal-mounted slide-in; live `onSnapshot` of `notifications` filtered by org; mark-all-read via `writeBatch`. |
| `Skeleton` | `animate-pulse bg-app-bg-tertiary` placeholder. |

## 7. Forms Pattern

Every form uses **react-hook-form + yup** via `@hookform/resolvers/yup`:

```jsx
const schema = yup.object({
  field1: yup.string().required('Required'),
  // ...
});
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  resolver: yupResolver(schema),
  defaultValues: { ... },
});
```

The submit handler:
1. Toast-error on missing/invalid business state (e.g. "At least one line item is required").
2. `createDoc` / `updateDocFields` against the right collection with `organizationId: currentOrg.id`.
3. `writeAuditLog` with the appropriate `action` + `entityType` + `entityId` + `entityName` + `details`.
4. Toast success.
5. `navigate('/<list-route>')` or `navigate('/<detail-route>')`.

Side-state that doesn't fit yup (line items, attached items, pricing tiers) is kept in `useState` arrays of `{ id: uuidv4(), ... }` records. Mutating helpers (`addX`, `removeX`, `updateX`) are local to the page.

## 8. Audit Logging (`src/utils/audit.js` + `writeAuditLog`)

Every mutation calls `writeAuditLog({ organizationId, userId, userName, action, entityType, entityId, entityName, details, diff })`. `action` values used in the codebase:

- `CREATED`, `UPDATED`, `DELETED`
- `PROMOTED`, `DEMOTED` (user role)
- `CONVERTED` (quotation → invoice)
- `STATUS_CHANGED` (invoice)
- `PAYMENT_RECORDED`, `PAYMENT_REMOVED` (event)

`entityType` values: `EVENT`, `EVENT_TYPE`, `INVENTORY_ITEM`, `QUOTATION`, `INVOICE`, `USER`, `ORGANIZATION`.

`AuditLogPage` shows a `Badge` for both `action` and `entityType`, with date/entity-type/action/user filters and an expand-on-click diff viewer (currently shows `log.details`; the `log.diff` field is reserved for future field-level diff rendering).

`useAuditLogs({ orgId, userId, entityType, entityId, max })` returns `{ logs, loading, error }`. **All page consumers must destructure `.logs`**, not use the hook result directly — this was the source of a class of bugs in the original localStorage build.

## 9. Money & Numbers (`src/utils/business.js` + `paymentHelpers.js`)

- `computeQuotationTotals(lineItems, discountPercent, taxPercent)` returns `{ subtotal, discountAmount, taxAmount, totalAmount }`, all rounded to 2 dp via `Math.round((n + Number.EPSILON) * 100) / 100`. Used by both Quotation and Invoice forms.
- `buildPaymentSummary(event)` returns `{ charged, paid, balance, status, percent, count }`. `status` is one of `UNPAID | PARTIAL | PAID`.
- `buildNewPayment({ amount, date, note, recordedBy })` returns a payment object with `id: uuidv4()`, ISO date, `serverTimestamp` for `createdAt`. Used by `EventFormPage` (initial deposit) and `EventDetailPage` (`RecordPaymentModal`).
- `formatCurrency(value)` — `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.

## 10. Auto-Status Updates

- `markExpiredQuotations(orgId)` (`utils/quotationHelpers.js`) — runs on `QuotationsPage` mount. Single `getDocs` query for status in `DRAFT|SENT` + `validUntil < today`; `writeBatch` updates to `EXPIRED`. Returns the count of updates.
- `checkAndUpdateOverdueInvoices(orgId)` (`utils/invoiceHelpers.js`) — runs on `InvoicesPage` mount. Same shape: batch-update `SENT` invoices past their `dueDate` to `OVERDUE`. Note: filter is `status in ['UNPAID','PARTIAL']` which is a small bug — invoices use statuses `DRAFT|SENT|PAID|OVERDUE|CANCELLED`, so `UNPAID` and `PARTIAL` never match. The current behavior is effectively a no-op; the proper filter would be `['SENT']`. Tracking only, not yet fixed.
- `markInvoiceAsPaid(invoiceId, userId)` — single `updateDoc` sets `status: 'PAID'`, `paidAt: serverTimestamp`, `paidBy: userId|null`. Used by the green check button in `InvoicesPage`.

## 11. Numbering & IDs

- `getNextNumber(prefix, orgId)` in `db.js` — transactional; returns `PREFIX-YYYY-####`. Documented in §2.
- Client-side `uuid` (v4) is used for: inventory variants, event attached items, quotation/invoice line items, event payment records. These are stable client-side IDs that survive Firestore doc creation and let React use them as `key` props.

## 12. Organization Lifecycle

- On `RegisterPage.submit`: `createUserWithEmailAndPassword` → `updateProfile(displayName)` → `createUserProfile(uid, displayName, orgName)` (creates the org doc + user doc atomically) → `sendEmailVerification`.
- On `LoginPage.submit`: `signInWithEmailAndPassword` → `ensureUserProfile(cred.user)` (defense in depth if a profile was deleted from Firestore while the user was signed out).
- On every subsequent auth state change: `AuthContext` resolves `firebaseUser → profile → organization` and exposes them.
- The user can have only ONE organization in v1. (Multi-org per user is not in scope.)

## 13. Things to NOT do

- Do NOT add a server-side component, Express handler, or any other backend. EventFlow is client-only by design.
- Do NOT use localStorage for app data. It was removed. (Theme is the one localStorage holdout, intentionally.)
- Do NOT add Google sign-in or any other OAuth provider. Email/password is the only auth.
- Do NOT mutate the auth context shape (adding `currentUser` or `logout` aliases for the deleted localStorage API). The new shape is `firebaseUser`, `user`, `signOut`, `isAdmin`, `isEmailVerified`, `refreshUser`.
- Do NOT use `react-hooks/set-state-in-effect` or `react-hooks/purity` rules — they're disabled on purpose.
- Do NOT add tests. The user has explicitly chosen not to write them this iteration.
- Do NOT add `paymentHelpers.js`'s `status in ['UNPAID','PARTIAL']` filter to `checkAndUpdateOverdueInvoices` blindly — it does not match actual invoice statuses. Use `['SENT']` if you fix it.
- Do NOT import `./storage` anywhere — the file was deleted. The only localStorage use is the theme preference.
- Do NOT use the `src/utils/numbering.js` and `src/utils/idGenerator.js` files — they are dead code (the first imports the deleted storage module; the second is never imported).

## 14. Firestore Security Rules (KNOWN GAP)

There is **no `firestore.rules` file in the repo** at the time of writing, and no `firebase.json`. The user's currently-deployed Firestore rules (per a prior screenshot) are the permissive `match /{document=**} { allow read, write: if request.auth != null; }` baseline. This is fine for single-tenant personal use but not production-grade. A first cut of org-scoped rules has been drafted in earlier sessions but never committed or deployed. **TODO: write `firestore.rules` enforcing `request.auth.uid == resource.data.organizationId.owner` for read, and a tighter per-org check for writes.**

## 15. Failure Modes (recent debugging history)

- **"Profile missing"** in production. Caused by cold-start race + stale ID token. Fixed in `AuthContext.jsx` by:
  1. `await user.getIdToken(true)` before reading the profile.
  2. `getDocFromServer` instead of cache reads.
  3. Self-heal via `ensureUserProfile` if the read returns `exists() === false`.
  4. `AdminRoute` recovery button for manual one-click repair.
- **"auth/invalid-api-key"** on Vercel. Caused by `.env.production` being gitignored + never committed, so Vercel had no env vars to bake in. Fixed by:
  1. Hardening `config.js` to throw at boot with a list of missing var names.
  2. Creating `.env.example` (committed) and deleting `.env.production`.
  3. Documenting in the README that env vars MUST be set in the platform dashboard.
- **Mobile bottom nav invisible.** Caused by `MobileNav.jsx` using the old `currentUser`/`logout` API from the pre-Firebase localStorage `AuthContext`. The `if (!currentUser) return null;` early-return made the nav render nothing. Fixed by migrating to `user` and `signOut` from the current context.
