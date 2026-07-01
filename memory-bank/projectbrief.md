# Project Brief — EventFlow

## What This Is

**EventFlow** is a client-side web application for **event-management companies** to plan, schedule, bill, and report on weddings, corporate functions, graduations, and similar events. It is a single-page React app that uses Firebase Authentication (email/password) and Cloud Firestore as its sole backend. There is no server-side application code.

The product replaces spreadsheet-driven workflows with a single workspace that handles event types, inventory, scheduled events, quotations, invoices, payments, team administration, and a complete audit trail.

## Business Context

- **Domain:** Event-management services (rentals + planning + execution).
- **Customer base (B2B):** Event companies that book client events and need to track inventory items (tents, chairs, tableware, etc.) attached to each event, with tiered pricing per event type and per-event payment tracking.
- **Inventory model:** Each inventory item has a name, category, unit, and one or more **variants** (size, stock, unit price). Variants can be attached to events in specific quantities.
- **Two product flows:**
  1. **Inventory-backed events** — items are pulled from stock and assigned to an event; line items become the source of truth for that event's inventory cost.
  2. **Tier-priced events** — event types define pricing tiers by guest count; an event charges the matched tier (or a custom quoted price).
- **Pricing rules:**
  - Quotation / invoice line items are `quantity * unitPrice` with optional discount % and tax %.
  - Event total is either `selectedTier.price` (tier mode) or `customPrice` (custom mode).
  - Payments are recorded per event; balance = `charged - paid`; status derives from balance.
- **Stock rule:** Inventory stock counts are tracked at item level; the app does not automatically decrement stock on event attachment (snapshots are stored on the event record). Stock is informational/audit-grade rather than reserved.

## Goals

1. **Multi-organization isolation** — every document is scoped by `organizationId`; a user's UI is always bound to a single active org.
2. **Role-based access** — `ADMIN` (full + team management) and `STAFF` (everyday ops). Only ADMINs can manage event types, inventory, team, and audit log.
3. **Traceable changes** — every mutation (create, update, delete, promote, demote, payment, status change) writes an entry to `auditLogs` with `organizationId`, `userId`, `userName`, `action`, `entityType`, `entityId`, `entityName`, and `details`.
4. **Auditable numbering** — quotations and invoices are auto-numbered per org per year via a Firestore transactional counter (`PREFIX-YYYY-####`).
5. **Email-verified access** — all authenticated users must verify their email before reaching the app shell.
6. **Mobile-friendly UI** — sidebar collapses to a bottom tab bar with a "More" drawer under `md`; pages have responsive grids and card/list views.

## Non-Goals (for v1)

- Payments processing / gateway (payments are tracked, not collected).
- Customer self-service portal.
- Multi-warehouse / multi-location stock.
- Public event pages or shareable links.
- Reporting / analytics dashboards beyond the dashboard's KPI tiles.
- Google / OAuth / SSO sign-in (removed by user preference — email/password only).
- Real-time collaborative editing (single editor per document at a time; Firestore snapshot reconciliation is not built).

## Core Modules (current state)

| Module | Routes | Status |
|---|---|---|
| Auth (Landing, Login, Register, Verify Email) | `/`, `/login`, `/register`, `/verify-email` | done |
| Dashboard | `/dashboard` | done |
| Organization profile + logo | `/organization` | done |
| Event Types (with tiered pricing) | `/event-types`, `/event-types/new`, `/event-types/:id`, `/event-types/:id/edit` | done |
| Inventory (with variants) | `/inventory`, `/inventory/new`, `/inventory/:id`, `/inventory/:id/edit` | done |
| Events (list+calendar, form with payments) | `/events`, `/events/new`, `/events/:id`, `/events/:id/edit` | done |
| Quotations (auto-numbered, convertible) | `/quotations`, `/quotations/new`, `/quotations/:id/edit` | done |
| Invoices (auto-numbered, mark-paid) | `/invoices`, `/invoices/new`, `/invoices/:id/edit` | done |
| Team management (promote/demote) | `/users`, `/users/:id` | done (ADMIN only) |
| Audit log | `/audit-log` | done (ADMIN only) |
| Notifications panel | Topbar bell icon | done |
| Theme toggle (light/dark, instant) | Topbar + Landing | done |

## User Roles (informational)

- `ADMIN` — full access; can create/edit/delete event types, inventory, manage team and audit log. The user who registers an organization is automatically its `ADMIN`.
- `STAFF` — day-to-day operations: create events, quotations, invoices; record payments; cannot modify event types, inventory, team, or audit log.

The last-admin constraint is enforced in `UsersPage.handleDemote` (refuses to demote when `adminCount <= 1`).

## Why Multi-Org + organizationId Everywhere

Every operational document (`eventTypes`, `inventory`, `events`, `quotations`, `invoices`, `auditLogs`, `notifications`, `users` within an org) carries an `organizationId` field. All Firestore queries are `where('organizationId', '==', currentOrg.id)`. This lets the same Firebase project host many isolated tenants without subcollections or per-org databases.

A `user` document lives in the global `users` collection (keyed by `firebaseUser.uid`) and references its `organizationId`; the user's role is per-org and stored on that same user doc.

## Documentation

- `README.md` — comprehensive business + technical overview, run instructions, deployment.
- `docs/instructions.md` — original build prompt (stale; describes pre-Firebase localStorage version).
- `docs/documentation.md` — original system documentation (stale; describes pre-Firebase localStorage version).
- `memory-bank/` (← this directory) — agent knowledge base.
- `skills/` — 24 SKILL.md files the agent auto-invokes per `AGENTS.md`.

**Source of truth = current source code.** The two `docs/*.md` files are pre-migration and do NOT describe the current Firebase-backed architecture. They will be rewritten in a future pass.

## Production Environment

- Hosting: Vercel (per user's deployment).
- Auth + DB: Firebase project `eventflow-8da1b` (apiKey `AIzaSyAK0wP3wqBvmfSpv4sfp5alIzKvU7_TdSc`).
- User's own account: `tinashegomo96@gmail.com`, uid `TTzuTVtepea5Yan7Jx4lWqdFIfb2`, orgId `Y1PbrBTxWx92h9QeieQ2`, role `ADMIN`.
- Vercel env-var setup: 7 `VITE_FIREBASE_*` vars set per-environment in Vercel Dashboard → Settings → Environment Variables.
