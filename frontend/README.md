# EventFlow

> A modern, multi-organization event management platform that streamlines how event planners, venues, and coordinators organize, track, and deliver experiences.

## Table of Contents

- [What is EventFlow?](#what-is-eventflow)
- [Why EventFlow?](#why-eventflow)
- [Key Features](#key-features)
- [Target Users](#target-users)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Data Model](#data-model)
- [Authentication & Authorization](#authentication--authorization)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [OpenCode Skills Integration](#opencode-skills-integration)
- [Roadmap](#roadmap)

---

## What is EventFlow?

EventFlow is a web-based event management system designed to replace spreadsheets, scattered documents, and disconnected tools. It provides a centralized command center for creating events, building quotations, managing inventory, tracking payments, and maintaining a complete audit trail — all within a collaborative, multi-organization environment.

Whether you run a single event planning agency or manage multiple departments across different organizations, EventFlow scales with your needs while keeping data isolated and secure.

## Why EventFlow?

For Event Planners:
- Stop juggling Excel sheets and email threads
- Track events from quotation to final invoice in one place
- Monitor budgets, timelines, and team assignments with real-time updates
- Generate professional quotations and invoices instantly

For Venue Managers:
- Know exactly what's booked and when
- Track inventory (chairs, tables, AV equipment) with availability checks
- Maintain a complete activity log for accountability
- Give staff role-appropriate access (admin vs. staff)

For Business Owners:
- Create virtual organizations for different brands or locations
- Manage teams with fine-grained permissions
- Audit everything — who changed what and when
- Built-in email verification and secure authentication

## Key Features

### Event Lifecycle Management
- Create, edit, and schedule events with rich details, timelines, and notes
- Budget tracking with cost breakdowns and payment history
- Event templates via Event Types (weddings, corporate, conferences, etc.)
- Status pipeline: Planning → Confirmed → In Progress → Completed → Cancelled

### Quotation & Invoicing
- Generate quotations with line items, quantities, unit costs, and totals
- Convert to invoices with one click
- Payment tracking with partial payments, notes, and dates
- Status handling: Pending → Accepted/Rejected → Converted
- Export support via html2canvas and jspdf for PDF generation

### Inventory Management
- Catalog items with descriptions, costs, and stock quantities
- Availability tracking per event to prevent double-booking
- Usage history tied to events for cost analysis

### User & Organization Management
- Multi-organization support: Each organization has independent data
- Role-based access control: ADMIN vs. STAFF permissions
- Email verification required before accessing the system
- Profile recovery mechanism for edge cases

### Real-Time Notifications & Audit Trail
- In-app notifications with unread counters (real-time via Firestore)
- Activity audit logs capturing every mutation: who, what, when, and the diff
- Log filtering by organization, entity type (event, quotation, invoice, etc.), or user

### Dashboard & Analytics
- Overview KPIs: Events this month, revenue, pending quotations, upcoming events
- Recent activity feed from the audit log
- Responsive design optimized for desktop and mobile
- Dark mode support with system preference detection

## Target Users

- Independent event planners managing weddings, parties, corporate events
- Venue rental companies coordinating multiple spaces and clients
- Catering businesses tracking events and inventory
- Agencies running multiple brands with separate billing
- Small teams (2–20 people) who need shared visibility without enterprise complexity

---

## Technology Stack

### Frontend
- React 19 — UI library with concurrent features
- Vite 8 — Ultra-fast build tool with HMR
- Tailwind CSS v3 — Utility-first styling with custom design tokens
- Framer Motion — Smooth animations and transitions
- React Hot Toast — Notification system
- React Hook Form — Performant form handling
- Yup — Schema validation for forms
- Lucide React — Consistent icon set
- date-fns — Date parsing, formatting, and arithmetic
- uuid — Unique ID generation for documents

### Backend & Data
- Firebase Firestore — NoSQL document database (serverless, real-time)
- Firebase Authentication — Email/password authentication with email verification
- Firestore Security Rules — Organization-scoped access control

### Utilities
- html2canvas — DOM-to-canvas rendering for export
- jspdf — PDF generation for quotations and invoices
- react-router-dom — Client-side routing with protected routes
- clsx + tailwind-merge — Conditional class merging

---

## System Architecture

### Multi-Organization Model

EventFlow is built around the concept of organizations as top-level data boundaries:

```
Organization A (Company X)
├── Users (Admins + Staff)
├── Events
├── Quotations
├── Invoices
├── Inventory
├── Audit Logs
└── Notifications

Organization B (Company Y)
├── Users (Admins + Staff)
├── Events
├── Quotations
├── Invoices
├── Inventory
├── Audit Logs
└── Notifications
```

Data isolation: Every Firestore query is scoped to the authenticated user's `organizationId`. No data leaks between organizations.

### Authentication Flow

1. User signs in with email/password
2. `AuthContext` checks for user profile document in `users` collection
3. If missing, self-healing creates a profile automatically
4. Profile is fetched and cached in React context
5. Organization data is loaded from `organizations` collection
6. User gains access to org-scoped pages based on role

### Real-Time Subscriptions

- Notifications: `onSnapshot` on user's notification subcollection for instant alerts
- Unread count: Live badge updates in the topbar
- Dashboard activity: Latest audit log entries stream in real-time

### Audit Trail

Every state-changing operation writes an audit log entry:

```
{
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'PROMOTED' | 'CONVERTED' | 'STATUS_CHANGED',
  entityType: 'EVENT' | 'QUOTATION' | 'INVOICE' | 'INVENTORY_ITEM' | 'EVENT_TYPE' | 'USER',
  entityId: '<document_id>',
  entityName: '<human_readable_name>',
  userId: '<actor_uid>',
  userName: '<actor_displayName>',
  organizationId: '<org_id>',
  details: { ... },
  diff: { before: {...}, after: {...} },
  createdAt: Timestamp
}
```

---

## Data Model

### Collections

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `users` | User profiles linked to Firebase Auth | `uid`, `email`, `displayName`, `organizationId`, `role`, `emailVerified` |
| `organizations` | Company/tenant data | `name`, `logo`, `ownerId`, `createdAt` |
| `events` | Event records | `name`, `scheduledDate`, `status`, `budget`, `organizationId`, `payments[]` |
| `quotations` | Client quotes | `eventId`, `lineItems[]`, `total`, `status`, `organizationId` |
| `invoices` | Final bills | `eventId`, `lineItems[]`, `total`, `status`, `organizationId`, `payments[]` |
| `eventTypes` | Reusable event categories | `name`, `description`, `defaultBudget`, `organizationId` |
| `inventory` | Equipment/materials catalog | `name`, `description`, `quantity`, `unitCost`, `organizationId` |
| `auditLogs` | Activity audit trail | `action`, `entityType`, `userId`, `organizationId`, `createdAt` |
| `notifications` | In-app user alerts | `userId`, `message`, `read`, `type`, `relatedId` |

### Document Schemas (High Level)

Event:
```
{
  id: string,
  name: string,
  description: string,
  scheduledDate: ISO string,
  venue: string,
  clientName: string,
  clientPhone: string,
  clientEmail: string,
  budget: number,
  status: 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  eventTypeId: string,
  notes: string,
  payments: [{ id, amount, date, note, recordedBy }],
  organizationId: string,
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Quotation:
```
{
  id: string,
  eventId: string,
  lineItems: [{ name, quantity, unitCost, total }],
  subtotal: number,
  tax: number,
  total: number,
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED',
  organizationId: string,
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Invoice:
```
{
  id: string,
  eventId: string,
  quotationId: string,
  lineItems: [{ name, quantity, unitCost, total }],
  subtotal: number,
  tax: number,
  total: number,
  paidAmount: number,
  balance: number,
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL',
  payments: [{ id, amount, date, method, note, recordedBy }],
  organizationId: string,
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Authentication & Authorization

### Roles

| Role | Permissions |
|------|------------|
| ADMIN | Full CRUD on all entities, user management, audit log access, organization settings |
| STAFF | Read/write on events, quotations, invoices, inventory. Read-only on audit log. Cannot promote/demote users. |

### Route Guards

- `ProtectedRoute` — Requires authenticated + email-verified session. Redirects unauthenticated users to login, unverified users to verification screen.
- `AdminRoute` — Extends ProtectedRoute. Requires `role === 'ADMIN'`. Redirects staff to `/dashboard`.

### Email Verification

- Registration triggers an email verification link
- Unverified users cannot access any protected routes
- Users can request a new verification email

### Password Reset

- Self-service password reset via Firebase Auth
- Secure token-based reset flow

---

## Project Structure

```
EventFlow/
├── public/                    # Static assets, service worker
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable UI primitives (Button, Modal, Table, Input, etc.)
│   │   ├── forms/            # Form-specific components (FormField, FormSelect, etc.)
│   │   ├── layout/           # Layout components (Sidebar, Topbar, Navbar, Footer)
│   │   └── common/           # Shared components (EmptyState, LoadingSpinner)
│   ├── pages/
│   │   ├── auth/             # Login, Register, VerifyEmail, ForgotPassword
│   │   ├── dashboard/        # Dashboard overview with KPIs and activity feed
│   │   ├── events/           # Event list, detail, form (create/edit)
│   │   ├── quotations/       # Quotation list, detail, form
│   │   ├── invoices/         # Invoice list, detail, form, payments
│   │   ├── inventory/        # Inventory list, detail, form
│   │   ├── event-types/      # Event type management
│   │   ├── users/            # User list, detail (admin only)
│   │   └── audit/            # Audit log viewer (admin only)
│   ├── hooks/
│   │   ├── useAuth.js        # Authentication context hook (exported from context)
│   │   ├── useOrgCollection.js  # Org-scoped Firestore queries with loading/error states
│   │   ├── useDoc.js         # Single document fetch hook
│   │   ├── useAuditLogs.js   # Audit log query hook (supports orgId, userId, entity filters)
│   │   └── useForm.js        # Form helper with validation
│   ├── context/
│   │   ├── AuthContext.jsx   # Firebase auth state + profile + organization hydration
│   │   ├── ThemeContext.jsx  # Light/dark mode with localStorage persistence
│   │   └── NotificationContext.jsx  # Real-time notification state
│   ├── firebase/
│   │   ├── config.js         # Firebase app initialization, auth, db exports
│   │   ├── collections.js    # Collection name constants
│   │   └── db.js             # Firestore helper functions (CRUD, transactions)
│   ├── utils/
│   │   ├── audit.js          # Audit log writer utility
│   │   ├── userProfile.js    # Profile creation and recovery utilities
│   │   └── helpers.js        # General utility functions
│   ├── App.jsx               # Router definition with guards
│   └── main.jsx              # App entry point with providers
├── skills/                   # OpenCode skills system (see below)
├── design-system/            # Generated design systems from ui-ux-pro-max
├── firestore.rules           # Firestore security rules (org-scoped)
├── firebase.json             # Firebase CLI configuration
├── vite.config.js            # Vite build configuration
├── tailwind.config.js        # Tailwind theme customization
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- A Firebase project (free tier is sufficient)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd EventFlow

# Install dependencies
npm install

# Configure Firebase
# 1. Create a Firebase project at https://console.firebase.google.com
# 2. Enable Authentication (Email/Password provider)
# 3. Create a Firestore database
# 4. Copy your Firebase config and update src/firebase/config.js

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`

### Firebase Configuration

Edit `src/firebase/config.js` with your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Firestore Rules

Deploy the org-scoped security rules:

```bash
firebase deploy --only firestore:rules
```

Or manually paste the contents of `firestore.rules` into the Firebase Console.

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on all source files |

### Code Conventions

- Plain JavaScript only (no TypeScript)
- ESLint configured with React Hooks rules
- Component names: PascalCase
- Utility/hook names: camelCase
- File names: PascalCase for components, camelCase for utilities
- Firestore collection names: PascalCase constants in `COLLECTIONS`

### Adding a New Feature

1. Create the page component in `src/pages/<feature>/`
2. Add the route in `src/App.jsx` with appropriate guard (ProtectedRoute or AdminRoute)
3. Add Firestore collection name to `src/firebase/collections.js`
4. Create/update data hooks in `src/hooks/`
5. Add audit logging for mutations via `writeAuditLog()`
6. Update navigation in the sidebar if needed

---

## Deployment

### Option 1: Vercel (Recommended for Quick Setup)

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) → your project → Settings → Environment Variables
3. Add each of the seven `VITE_FIREBASE_*` variables from your local `.env` file (see `.env.example` for the list). For each one:
   - Key: `VITE_FIREBASE_API_KEY` (etc.)
   - Value: paste the value from your `.env` file
   - Environment: check all three (Production, Preview, Development)
4. Save each variable
5. Vercel auto-detects Vite, so build/output settings are usually correct:
   - Build command: `npm run build`
   - Output directory: `dist`
6. Redeploy (Deployments tab → click the three dots on the latest → Redeploy)

After redeploy, open the browser console. You should no longer see `auth/invalid-api-key` and the app should render.

If the error persists, check the Vercel build log: Settings → General → Build & Development Settings → view the build output. Look for any env-var-related warnings.

### Option 2: Firebase Hosting

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting (one-time setup)
firebase init hosting

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Option 3: Netlify

1. Push code to GitHub
2. Connect repository to [Netlify](https://netlify.com)
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add Firebase environment variables in Netlify dashboard

### Environment Variables

For production deployment, use environment variables instead of hardcoded Firebase config:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

Update `src/firebase/config.js` to read from `import.meta.env`:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

---

## OpenCode Skills Integration

This repository includes an AI skill system for enhanced development workflows using OpenCode or Claude Code.

### What are Skills?

Skills are packaged instructions and scripts that extend AI assistant capabilities beyond basic code generation. They provide structured workflows for common development tasks.

### Available Skills

| Skill | Purpose | Use When |
|-------|---------|----------|
| `spec-driven-development` | Define features with specs before coding | Building new features |
| `incremental-implementation` | Break features into small, testable increments | Complex feature development |
| `test-driven-development` | Write tests before implementation | Adding test coverage |
| `planning-and-task-breakdown` | Create structured development plans | Project planning |
| `debugging-and-error-recovery` | Systematic bug diagnosis | Tests fail, builds break, unexpected errors |
| `code-review-and-quality` | Review code for issues, security, quality | Before merging code |
| `code-simplification` | Refactor and simplify code | Technical debt reduction |
| `api-and-interface-design` | Design clean APIs and interfaces | New API endpoints or components |
| `frontend-ui-engineering` | Build professional UI components | UI development work |
| `ui-ux-pro-max` | Generate complete design systems | UI/UX overhaul or new pages |

### How to Invoke a Skill

1. Determine if the task matches a skill
2. Read the skill definition from `skills/<skill-name>/SKILL.md`
3. Follow the workflow steps exactly
4. Only implement after required planning/spec steps are complete

### Example: Using ui-ux-pro-max

Generate a complete design system for EventFlow:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "saas event management dashboard professional" --design-system -p "EventFlow" --stack react
```

This outputs a comprehensive design system with colors, typography, spacing, and anti-patterns specific to your product type.

---

## Roadmap

### Current (v1.0)
- Multi-organization support
- Event, quotation, and invoice management
- Inventory tracking
- Role-based access control
- Real-time notifications
- Audit logging
- Email verification
- Dark mode

### Planned (v1.1)
- [ ] Calendar view (month/week/day) for event scheduling
- [ ] Client portal (public-facing quote acceptance)
- [ ] File uploads (contracts, invoices, event photos)
- [ ] Budget vs. actual spending comparison
- [ ] Duplicate event / quotation functionality
- [ ] Bulk inventory operations

### Future (v2.0)
- [ ] Multi-currency support
- [ ] Stripe/PayPal payment integration
- [ ] Mobile app (React Native)
- [ ] Vendor/contractor management
- [ ] Task assignments within events
- [ ] SMS notifications via Twilio
- [ ] Advanced reporting and analytics dashboard

---

## Support

For issues, feature requests, or contributions, please open an issue in the project repository.

---

*Built with React, Vite, Tailwind CSS, and Firebase.*

