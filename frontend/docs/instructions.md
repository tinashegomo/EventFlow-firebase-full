# EventFlow — OpenCode Build Prompt
## Ultra-Detailed Step-by-Step Implementation Guide

---

## OVERVIEW FOR THE AGENT

You are building **EventFlow**, a fully client-side React event management web application for event companies. It uses **React 18**, **React Router v6**, **Tailwind CSS**, **Framer Motion**, **React Hook Form + Yup**, **date-fns**, **uuid**, **Lucide React**, and **React Hot Toast**. All data is persisted in `localStorage`. There is no backend.

Read every section carefully before writing any code. Complete each phase in order. Do not skip phases or combine steps.

---

## PHASE 0 — PROJECT BOOTSTRAP

### Step 0.1 — Scaffold the Project

```bash
npm create vite@latest eventflow -- --template react
cd eventflow
```

### Step 0.2 — Install All Dependencies

```bash
npm install react-router-dom framer-motion react-hook-form yup @hookform/resolvers date-fns uuid lucide-react react-hot-toast
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 0.3 — Configure Tailwind

Replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

### Step 0.4 — Set Up Global CSS

Replace `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --color-bg-primary: #F8F7F5;
  --color-bg-secondary: #FFFFFF;
  --color-bg-tertiary: #F1EFE9;
  --color-border: #E5E2DC;
  --color-text-primary: #1A1814;
  --color-text-secondary: #6B6660;
  --color-text-muted: #9E9993;
  --color-accent: #C17F24;
  --color-accent-light: #F5E6C8;
  --color-accent-dark: #8C5A12;
  --color-success: #2D7D4E;
  --color-warning: #B45309;
  --color-danger: #B91C1C;
  --color-info: #1D4ED8;
}

.dark {
  --color-bg-primary: #141210;
  --color-bg-secondary: #1E1C18;
  --color-bg-tertiary: #252219;
  --color-border: #2E2B24;
  --color-text-primary: #F2EFE8;
  --color-text-secondary: #A09990;
  --color-text-muted: #6E6660;
  --color-accent: #D4943A;
  --color-accent-light: #3A2D10;
  --color-accent-dark: #F5C96A;
}

body {
  font-family: 'DM Sans', sans-serif;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

* {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
```

---

## PHASE 1 — CONSTANTS & UTILITIES

### Step 1.1 — Create `src/constants/storageKeys.js`

```js
export const STORAGE_KEYS = {
  ORGANIZATIONS:   'ef_organizations',
  USERS:           'ef_users',
  EVENT_TYPES:     'ef_event_types',
  INVENTORY_ITEMS: 'ef_inventory_items',
  EVENTS:          'ef_events',
  QUOTATIONS:      'ef_quotations',
  INVOICES:        'ef_invoices',
  AUDIT_LOGS:      'ef_audit_logs',
  NOTIFICATIONS:   'ef_notifications',
  CURRENT_USER_ID: 'ef_current_user_id',
  THEME:           'ef_theme',
};
```

### Step 1.2 — Create `src/constants/roles.js`

```js
export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
};
```

### Step 1.3 — Create `src/utils/storage.js`

Implement these exported functions:
- `getFromStorage(key)` — parse JSON from localStorage, return null on error
- `saveToStorage(key, data)` — stringify and save to localStorage
- `getOrgItems(key, organizationId)` — get all items filtered by `organizationId`
- `addItem(key, newItem)` — push newItem to the array at key, save
- `updateItem(key, id, updates)` — find by `id`, merge updates, save, return updated item
- `deleteItem(key, id)` — filter out item with matching `id`, save
- `getItemById(key, id)` — return single item by `id` or null

### Step 1.4 — Create `src/utils/idGenerator.js`

```js
import { v4 as uuidv4 } from 'uuid';
export const generateId = () => uuidv4();
```

### Step 1.5 — Create `src/utils/auth.js`

Implement:
- `simpleHash(str)` — a basic deterministic hash function (can use a simple djb2 or btoa-based approach — NOT crypto-secure, just for demo purposes)
- `getCurrentUserId()` — get from localStorage CURRENT_USER_ID key
- `setCurrentUserId(id)` — save to localStorage
- `clearCurrentUserId()` — remove from localStorage
- `getCurrentUser()` — get userId then look up user in USERS array
- `getCurrentOrg()` — get current user's organizationId then look up in ORGANIZATIONS

### Step 1.6 — Create `src/utils/audit.js`

```js
import { generateId } from './idGenerator';
import { getFromStorage, saveToStorage } from './storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

export const writeAuditLog = ({ organizationId, entityType, entityId, entityLabel, action, performedBy, changes = null }) => {
  const logs = getFromStorage(STORAGE_KEYS.AUDIT_LOGS) || [];
  const newLog = {
    id: generateId(),
    organizationId,
    entityType,
    entityId,
    entityLabel,
    action,
    performedBy,
    performedAt: new Date().toISOString(),
    changes,
  };
  logs.unshift(newLog);
  saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
  return newLog;
};
```

### Step 1.7 — Create `src/utils/numbering.js`

Implement `getNextNumber(key, prefix, organizationId)`:
- Gets all org items from the storage key
- Filters for items whose `[prefix.toLowerCase() + 'Number']` field starts with `${prefix}-${currentYear}`
- Returns `${prefix}-${currentYear}-${String(count + 1).padStart(4, '0')}`
- Example result: `"QUO-2025-0001"`, `"INV-2025-0003"`

### Step 1.8 — Create `src/utils/dateHelpers.js`

Implement:
- `formatDate(isoString)` — returns "14 Aug 2025"
- `formatDateTime(isoString)` — returns "14 Aug 2025, 14:00"
- `daysUntil(dateString)` — returns number of days from today to the given date (negative if past)
- `isToday(dateString)` — boolean
- `isTomorrow(dateString)` — boolean
- `formatRelative(isoString)` — "2 hours ago", "3 days ago", etc. using date-fns

### Step 1.9 — Create `src/utils/notifications.js`

Implement `generateEventNotifications(organizationId)`:

```js
export const generateEventNotifications = (organizationId) => {
  const events = getOrgItems(STORAGE_KEYS.EVENTS, organizationId);
  const existing = getFromStorage(STORAGE_KEYS.NOTIFICATIONS) || [];
  const today = new Date().toDateString();
  const newNotifications = [];

  events.forEach(event => {
    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') return;
    const days = daysUntil(event.scheduledDate);

    const thresholds = [
      { days: 0,  title: `Today: ${event.title}`,          message: `${event.title} is scheduled for today at ${event.scheduledTime}.` },
      { days: 1,  title: `Tomorrow: ${event.title}`,       message: `${event.title} is scheduled for tomorrow at ${event.scheduledTime}.` },
      { days: 3,  title: `In 3 Days: ${event.title}`,      message: `${event.title} at ${event.venue} is in 3 days.` },
      { days: 7,  title: `In 7 Days: ${event.title}`,      message: `${event.title} at ${event.venue} is in 7 days.` },
    ];

    thresholds.forEach(({ days: threshold, title, message }) => {
      if (days === threshold) {
        // Check deduplication: same eventId + same threshold + same calendar day
        const alreadyExists = existing.some(n =>
          n.eventId === event.id &&
          n.title === title &&
          new Date(n.createdAt).toDateString() === today
        );
        if (!alreadyExists) {
          newNotifications.push({
            id: generateId(),
            organizationId,
            userId: null, // broadcast to all org users
            type: 'EVENT_REMINDER',
            title,
            message,
            eventId: event.id,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
  });

  if (newNotifications.length > 0) {
    const updated = [...newNotifications, ...existing];
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
  }
};
```

---

## PHASE 2 — CONTEXT PROVIDERS

### Step 2.1 — Create `src/context/ThemeContext.jsx`

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.THEME) || 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

### Step 2.2 — Create `src/context/AuthContext.jsx`

State: `{ currentUser, currentOrg, isLoading }`

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, getCurrentOrg, clearCurrentUserId, setCurrentUserId } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(() => {
    const user = getCurrentUser();
    const org = user ? getCurrentOrg(user.organizationId) : null;
    setCurrentUser(user);
    setCurrentOrg(org);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = (userId) => {
    setCurrentUserId(userId);
    loadUser();
  };

  const logout = () => {
    clearCurrentUserId();
    setCurrentUser(null);
    setCurrentOrg(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, currentOrg, isLoading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## PHASE 3 — UI COMPONENT LIBRARY

Build all reusable UI components in `src/components/ui/`. Every component must support dark mode via CSS variables.

### Step 3.1 — `Button.jsx`

Props: `variant` (`primary` | `secondary` | `danger` | `ghost`), `size` (`sm` | `md` | `lg`), `isLoading`, `leftIcon`, `rightIcon`, `children`, all standard button props.

- `primary`: gold background, white text
- `secondary`: transparent with border
- `danger`: red background
- `ghost`: no border, no bg, just text

Include a `LoadingSpinner` inline when `isLoading` is true.

### Step 3.2 — `Input.jsx`

Props: `label`, `error`, `hint`, `leftIcon`, `rightIcon`, plus all standard input props.

Renders a label above, the input with optional icons inside, and an error message below in red if `error` is provided.

### Step 3.3 — `Select.jsx`

Props: `label`, `error`, `options` (array of `{ value, label }`), `placeholder`, plus standard select props.

Renders a styled select dropdown consistent with Input styling.

### Step 3.4 — `Badge.jsx`

Props: `status` — one of: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CONVERTED`, `REJECTED`, `ACCEPTED`, `ADMIN`, `STAFF`.

Map each status to appropriate background and text color classes. Return a small rounded pill span.

### Step 3.5 — `Card.jsx`

A generic wrapper: `rounded-2xl border bg-white dark:bg-[--color-bg-secondary] shadow-sm p-6`.

Props: `children`, `className`, `onClick`.

When `onClick` is provided, apply hover styling and cursor-pointer.

### Step 3.6 — `Modal.jsx`

Uses a React Portal to render outside the main DOM tree. 

Props: `isOpen`, `onClose`, `title`, `children`, `size` (`sm` | `md` | `lg` | `xl`).

- Dark overlay backdrop (`bg-black/50 backdrop-blur-sm`)
- Centered modal panel with `Card` styling
- Framer Motion animation: scale from 0.95 + opacity 0 → 1
- Close button (X) in the top-right corner
- Click outside backdrop to close

### Step 3.7 — `ConfirmDialog.jsx`

A specialized Modal for confirmation prompts.

Props: `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmLabel` (default "Delete"), `variant` (`danger` | `warning`).

Renders the title, message text, and two buttons: Cancel + Confirm.

### Step 3.8 — `Table.jsx`

Props: `columns` (array of `{ key, header, render? }`), `data` (array of objects), `isLoading`, `emptyMessage`.

Renders a full-width table with sticky header row. Alternating row shading in light mode. Responsive: on mobile, display as stacked cards instead of rows.

### Step 3.9 — `EmptyState.jsx`

Props: `icon` (Lucide component), `title`, `description`, `action` (optional `{ label, onClick }`).

Centered illustration-style empty state with the icon large, title, description, and optional action button.

### Step 3.10 — `PageHeader.jsx`

Props: `title`, `subtitle`, `actions` (JSX node for right side).

Renders a section at the top of every page: large display-font title, smaller subtitle, and action buttons right-aligned.

### Step 3.11 — `StatCard.jsx`

Props: `title`, `value`, `icon`, `trend` (optional `{ value, label, direction: 'up'|'down'` }), `color`.

Renders a metric card with the icon in a colored circle, large number, title, and optional trend indicator.

### Step 3.12 — `NotificationPanel.jsx`

A slide-in panel from the right side of the screen.

Props: `isOpen`, `onClose`.

- Reads notifications from localStorage filtered by `organizationId`
- Groups by read/unread
- Shows title, message, relative time
- Clicking an `EVENT_REMINDER` navigates to the event
- "Mark all as read" button at the top
- Individual notifications are marked read on click

---

## PHASE 4 — ROUTE GUARDS

### Step 4.1 — `src/components/guards/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};
```

### Step 4.2 — `src/components/guards/AdminRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import toast from 'react-hot-toast';

export const AdminRoute = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== ROLES.ADMIN) {
    toast.error('Access denied — Admins only');
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};
```

---

## PHASE 5 — LAYOUT

### Step 5.1 — `src/components/layout/Sidebar.jsx`

A vertical sidebar with:
- Top: Organization logo/name (first letter avatar fallback)
- Middle: Navigation links list (see routing table in documentation for full list of nav items with icons)
- Bottom: Current user name + role badge + logout button

Navigation links:
```js
const navLinks = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard',    roles: ['ADMIN', 'STAFF'] },
  { icon: Calendar,        label: 'Events',        path: '/events',        roles: ['ADMIN', 'STAFF'] },
  { icon: Tag,             label: 'Event Types',   path: '/event-types',  roles: ['ADMIN', 'STAFF'] },
  { icon: Package,         label: 'Inventory',     path: '/inventory',    roles: ['ADMIN', 'STAFF'] },
  { icon: FileText,        label: 'Quotations',    path: '/quotations',   roles: ['ADMIN', 'STAFF'] },
  { icon: Receipt,         label: 'Invoices',      path: '/invoices',     roles: ['ADMIN', 'STAFF'] },
  { icon: Building2,       label: 'Organization',  path: '/organization', roles: ['ADMIN', 'STAFF'] },
  { icon: Users,           label: 'Team',          path: '/users',        roles: ['ADMIN'] },
  { icon: ClipboardList,   label: 'Audit Log',     path: '/audit-log',    roles: ['ADMIN'] },
];
```

- Active link has gold left border and accent background
- Non-admin users see only links with their role
- On mobile: sidebar is hidden (use MobileNav instead)
- On tablet: sidebar shows icons only (no labels), expands on hover

### Step 5.2 — `src/components/layout/Topbar.jsx`

A horizontal bar at the top of the content area:
- Left: Page title (auto-detected from current route)
- Right: Notification bell with unread count badge, Theme toggle button (Sun/Moon icon), User avatar circle

### Step 5.3 — `src/components/layout/MobileNav.jsx`

A bottom tab bar (visible only on `sm` breakpoint and below).

Shows 5 most common nav items: Dashboard, Events, Quotations, Invoices, and a "More" button that opens a drawer with remaining links.

### Step 5.4 — `src/components/layout/AppShell.jsx`

```jsx
export const AppShell = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-primary)]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
};
```

---

## PHASE 6 — APP ENTRY POINT

### Step 6.1 — `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { AdminRoute } from './components/guards/AdminRoute';
import { generateEventNotifications } from './utils/notifications';
import { useEffect } from 'react';

// Import all page components...

const NotificationBootstrap = () => {
  const { currentOrg } = useAuth();
  useEffect(() => {
    if (currentOrg?.id) {
      generateEventNotifications(currentOrg.id);
    }
  }, [currentOrg?.id]);
  return null;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <NotificationBootstrap />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes wrapped in AppShell */}
            <Route path="/dashboard" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
            <Route path="/organization" element={<ProtectedRoute><AppShell><OrganizationPage /></AppShell></ProtectedRoute>} />
            <Route path="/event-types" element={<ProtectedRoute><AppShell><EventTypesPage /></AppShell></ProtectedRoute>} />
            <Route path="/event-types/new" element={<AdminRoute><AppShell><EventTypeFormPage /></AppShell></AdminRoute>} />
            <Route path="/event-types/:id/edit" element={<AdminRoute><AppShell><EventTypeFormPage /></AppShell></AdminRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><AppShell><InventoryPage /></AppShell></ProtectedRoute>} />
            <Route path="/inventory/new" element={<AdminRoute><AppShell><InventoryFormPage /></AppShell></AdminRoute>} />
            <Route path="/inventory/:id/edit" element={<AdminRoute><AppShell><InventoryFormPage /></AppShell></AdminRoute>} />
            <Route path="/events" element={<ProtectedRoute><AppShell><EventsPage /></AppShell></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><AppShell><EventFormPage /></AppShell></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><AppShell><EventDetailPage /></AppShell></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute><AppShell><EventFormPage /></AppShell></ProtectedRoute>} />
            <Route path="/quotations" element={<ProtectedRoute><AppShell><QuotationsPage /></AppShell></ProtectedRoute>} />
            <Route path="/quotations/new" element={<ProtectedRoute><AppShell><QuotationFormPage /></AppShell></ProtectedRoute>} />
            <Route path="/quotations/:id/edit" element={<ProtectedRoute><AppShell><QuotationFormPage /></AppShell></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><AppShell><InvoicesPage /></AppShell></ProtectedRoute>} />
            <Route path="/invoices/new" element={<ProtectedRoute><AppShell><InvoiceFormPage /></AppShell></ProtectedRoute>} />
            <Route path="/invoices/:id/edit" element={<ProtectedRoute><AppShell><InvoiceFormPage /></AppShell></ProtectedRoute>} />
            <Route path="/users" element={<AdminRoute><AppShell><UsersPage /></AppShell></AdminRoute>} />
            <Route path="/audit-log" element={<AdminRoute><AppShell><AuditLogPage /></AppShell></AdminRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

---

## PHASE 7 — AUTH PAGES

### Step 7.1 — `LandingPage.jsx`

A beautiful full-screen landing page with:
- Large display font headline: "Your Events, Perfectly Orchestrated"
- Subtitle text about the platform
- Two CTAs side by side: "Get Started" (→ /register) and "Sign In" (→ /login)
- Background: subtle geometric pattern or gradient mesh using CSS
- Animated entrance with Framer Motion staggered text reveals
- Dark/Light theme toggle in top-right corner

### Step 7.2 — `RegisterPage.jsx`

A multi-step registration form. State: `step` (1 or 2), `registrationType` (`'new'` or `'join'`).

**Step 1 — Choose path (full screen choice):**
```
Two large cards side by side:
  [🏢 Register a New Company]   [👥 Join an Existing Company]
```

**Step 2A — New Organization (2 sub-steps):**

Sub-step 1: Organization details form
- Fields: `name`, `email`, `phone`, `address`
- Validate with Yup: all required

Sub-step 2: Admin account form
- Fields: `firstName`, `lastName`, `email`, `password`, `confirmPassword`
- Validate with Yup: all required, email format, password min 8, passwords match

On final submit:
1. Create organization object with `generateId()` and current timestamp
2. Hash the password using `simpleHash()`
3. Create user object with `role: 'ADMIN'`, `organizationId` = new org's id
4. Save both to localStorage using `addItem()`
5. Write audit log: `CREATED` on `USER` entity
6. Call `login(userId)` from AuthContext
7. Navigate to `/dashboard`
8. Show success toast: "Welcome! Your organization has been set up."

**Step 2B — Join Existing Organization:**

Step 1: Organization picker
- Load all organizations from localStorage sorted alphabetically
- Render a searchable `<Select>` dropdown
- User selects one organization

Step 2: Personal details form
- Fields: `firstName`, `lastName`, `email`, `password`, `confirmPassword`
- Validate: email must be unique across ALL users (not just this org)

On submit:
1. Create user with `role: 'STAFF'`, `organizationId` = selected org's id
2. Save to localStorage
3. Write audit log
4. Call `login(userId)`
5. Navigate to `/dashboard`
6. Toast: "Welcome! You've joined [Org Name]."

### Step 7.3 — `LoginPage.jsx`

Simple centered form with email + password fields.

On submit:
1. Find user by `email` in USERS array
2. Compare `simpleHash(password)` with stored `passwordHash`
3. If match, call `login(user.id)`, navigate to `/dashboard`
4. If no match, show inline error: "Invalid email or password"

Include a link to `/register` at the bottom.

---

## PHASE 8 — DASHBOARD PAGE

### `DashboardPage.jsx`

On mount:
1. Load events, quotations, invoices from localStorage for current org
2. Calculate:
   - `thisMonthEvents`: events where `scheduledDate` falls in the current calendar month
   - `upcomingEvents`: events with `status === 'SCHEDULED'` and date within next 30 days, sorted ascending
   - `pendingInvoices`: invoices with `status === 'SENT'` or `status === 'DRAFT'`
   - `openQuotations`: quotations with `status === 'DRAFT'` or `status === 'SENT'`
3. Render:

**Stats Row (4 StatCards):**
- Total Events This Month | Calendar icon | blue
- Upcoming Events | Clock icon | amber
- Pending Invoices | Receipt icon | red
- Open Quotations | FileText icon | green

**Upcoming Events Section:**
- Heading "Upcoming Events" with a "View All" link to /events
- List of up to 5 upcoming events, each showing:
  - Event title (display font)
  - Event type badge
  - Venue
  - Date with countdown chip: "Today", "Tomorrow", "In N days"
  - Clicking navigates to event detail

**Recent Activity Feed:**
- Heading "Recent Activity" with "View All" link to /audit-log
- Last 10 audit log entries for the org
- Each entry: user full name, action badge, entity label, relative time

**Quick Actions Row:**
- Three buttons: "+ New Event" (→ /events/new), "+ New Quotation" (→ /quotations/new), "+ New Invoice" (→ /invoices/new)

Wrap the entire page content in a Framer Motion `motion.div` with `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`.

---

## PHASE 9 — ORGANIZATION PAGE

### `OrganizationPage.jsx`

Two-column layout (single on mobile):
- Left: Logo upload area (click to upload image → convert to base64 and save)
- Right: Editable form with org name, email, phone, address

Uses React Hook Form + Yup. On submit, call `updateItem(STORAGE_KEYS.ORGANIZATIONS, orgId, updates)` and call `refreshUser()` from AuthContext to reload org data.

---

## PHASE 10 — USERS PAGE (ADMIN ONLY)

### `UsersPage.jsx`

Load all users where `organizationId === currentOrg.id`.

Table columns: Name | Email | Role (Badge) | Joined (formatted date) | Actions

Actions column logic:
- If user is `currentUser`: show "(You)" — no promote/demote
- If user is `STAFF`: show "Promote to Admin" button
- If user is `ADMIN` and not the only admin: show "Demote to Staff" button
- If user is the only `ADMIN`: show a disabled "Cannot Demote — Only Admin" tooltip button

On promote:
1. Call `updateItem(STORAGE_KEYS.USERS, userId, { role: 'ADMIN' })`
2. Write audit log: `action: 'PROMOTED'`, `entityType: 'USER'`
3. Toast: "[Name] has been promoted to Admin"

On demote:
1. Check that at least 2 admins exist before allowing
2. Call `updateItem(STORAGE_KEYS.USERS, userId, { role: 'STAFF' })`
3. Write audit log: `action: 'DEMOTED'`, `entityType: 'USER'`
4. Toast: "[Name] has been demoted to Staff"

---

## PHASE 11 — EVENT TYPES MODULE

### `EventTypesPage.jsx`

Load all event types where `organizationId === currentOrg.id`.

Display as a responsive grid of cards (3 cols desktop, 2 tablet, 1 mobile). Each card:
- Colored left border using the event type's `color` field
- Icon + Name (display font)
- Description (muted)
- Number of pricing tiers: "4 pricing tiers"
- Price range: "$2,500 – $20,000"
- Created by + date
- Edit button (Admin only) → `/event-types/:id/edit`
- Delete button (Admin only) → ConfirmDialog

On delete:
1. Check if any events use this event type. If yes, show error toast: "Cannot delete — this event type is used by existing events."
2. If safe, delete and write audit log.

Empty state: "No event types yet. Add your first one to start creating events."

Admin-only "+ New Event Type" button in PageHeader.

### `EventTypeFormPage.jsx`

**For create (`/event-types/new`) and edit (`/event-types/:id/edit`).**

On edit, load existing event type by `:id` param and pre-fill all form fields.

**Form fields:**

1. Name (text input) — required
2. Description (textarea) — optional
3. Quick-select buttons for common types (Wedding, Traditional Wedding, Birthday, Funeral, Memorial, Graduation, Corporate Function, Baby Shower, Kitchen Party, Anniversary) — clicking auto-fills Name and sets default Icon + Color
4. Icon picker — a grid of ~12 icon options: Heart, Cake, Star, GraduationCap, Music, Briefcase, Baby, Flower2, Coffee, Sun, Globe, Users2. User clicks to select.
5. Color picker — 10 swatches (hardcoded hex values) the user can click

**Pricing Tiers section:**

State: `tiers` = array of `{ id, guestCount, price, description }`.

- "Add Tier" button appends a new blank tier row
- Each row: Guest Count input + Price input + Description input + Delete (×) button
- Tiers are sorted by guestCount ascending on save
- At least 1 tier required (Yup validation)

**Submit logic:**
- Create: generate id, set `organizationId`, `createdAt`, `createdBy`
- Update: merge fields, set `updatedAt`, `updatedBy`
- Write audit log in both cases
- Navigate back to `/event-types`
- Toast success message

---

## PHASE 12 — INVENTORY MODULE

### `InventoryPage.jsx`

Searchable, filterable table of all inventory items for the org.

Search bar at top filters by item name.
Category filter dropdown (auto-populated from existing item categories).

Table columns: Name | Category | Variants | Total Stock | Unit | Actions (Edit, Delete)

"Total Stock" = sum of all variant `quantityInStock` values.

On delete:
1. Check if any events have this item attached. If yes, show error: "Cannot delete — this item is attached to existing events."
2. Write audit log on deletion.

Empty state with a helpful description.

Admin-only "+ Add Item" button in PageHeader.

### `InventoryFormPage.jsx`

**For create and edit.**

Form fields:
1. Name — required
2. Description — optional
3. Category — combobox (can type custom or select from existing org categories)
4. Unit — select from: "piece", "set", "meter", "roll", "box", "pair" — required

**Variants section:**

State: `variants` = array of `{ id, size, pricePerUnit, quantityInStock }`.

- "Add Variant" button
- Each row: Size/Spec input (optional) + Price Per Unit + Qty In Stock + Delete button
- At least 1 variant required
- For items with no meaningful size (e.g. plates), users can leave the size field empty

Submit logic follows same pattern as EventTypeFormPage (audit log, toast, navigate back).

---

## PHASE 13 — EVENTS MODULE

### `EventsPage.jsx`

**View Toggle:** List | Calendar (two buttons in top-right of PageHeader)

**List View:**
Filterable table/card list with:
- Search by event title or client name
- Filter by event type (dropdown of org's event types)
- Filter by status (dropdown)
- Filter by date range (two date pickers: from / to)
- Sort: by date (asc/desc)

Table columns: Title | Event Type | Client | Date & Time | Guest Count | Status | Actions

Actions: Eye (view detail) | Pencil (edit) — Admin only | Trash (delete) — Admin only

**Calendar View:**
A custom monthly calendar built with React and date-fns (do NOT use a calendar library — build it yourself):
- `currentMonth` state (default: current month)
- Prev/Next month navigation buttons
- 7-column grid header: Sun Mon Tue Wed Thu Fri Sat
- Day cells: each shows the day number; if an event exists on that day, show a colored dot and a small event pill
- Clicking a day cell that has an event opens a popover listing events for that day with links to their detail pages
- Events on calendar are color-coded by event type color

On delete event:
1. Show ConfirmDialog: "Are you sure you want to delete [Event Title]? This action cannot be undone."
2. On confirm: delete from localStorage, write audit log with a `changes.snapshot` = the full event object before deletion
3. Toast: "Event deleted."

### `EventFormPage.jsx`

**For create (`/events/new`) and edit (`/events/:id/edit`).**

On edit, load event by `:id` param and pre-fill all fields.

**Section 1 — Event Details:**
- Title (text) — required
- Event Type (select from org's event types) — required
- Status (select) — default SCHEDULED

**Section 2 — Client Details:**
- Client Name — required
- Client Phone — optional
- Client Email — optional (email format validation if provided)

**Section 3 — Schedule:**
- Venue — required
- Date (date input) — required; validate: must not be in the past on CREATE (skip this check on edit)
- Time (time input, e.g. "14:00") — required

**Section 4 — Guest Count & Pricing:**
- Guest Count (number input) — required, min 1
- When event type is selected and guestCount is entered: automatically find the closest pricing tier (pick the tier with the smallest guestCount ≥ entered count; if none, pick the largest tier). Show the matched tier and price in a highlighted info box. Allow manual override via a dropdown showing all tiers.

**Section 5 — Inventory Attachments:**
State: `attachedItems` = array of `{ id, inventoryItemId, variantId, quantity, snapshotName, snapshotSize, snapshotPrice }`.

"+ Attach Item" button opens an inline panel/accordion:
- Dropdown 1: Select inventory item (all org items)
- Dropdown 2: If the selected item has variants, show variant selector
- Number input: Quantity
- "Add" button

Once added, the item appears in a summary table below:
Columns: Item Name | Size/Spec | Qty | Unit Price | Line Total | Remove (×)

The `snapshot*` fields are captured at the time of attachment so item data changes don't retroactively affect event records.

**Section 6 — Notes:**
- Textarea for free text notes

**Submit — Create:**
1. Validate with Yup
2. Create event object with `generateId()`, `organizationId`, `createdAt`, `createdBy: currentUser.id`
3. `addItem(STORAGE_KEYS.EVENTS, newEvent)`
4. `writeAuditLog({ action: 'CREATED', entityType: 'EVENT', ... })`
5. Toast + navigate to `/events/:newId`

**Submit — Update:**
1. Load existing event
2. Build `changes: { before: existingFields, after: updatedFields }`
3. `updateItem(STORAGE_KEYS.EVENTS, id, { ...updates, updatedAt: now, updatedBy: currentUser.id })`
4. `writeAuditLog({ action: 'UPDATED', entityType: 'EVENT', changes })`
5. Toast + navigate to `/events/:id`

### `EventDetailPage.jsx`

Full read-only view with a back button.

Layout (two columns on desktop, single on mobile):

**Left/Main column:**
- Event title (display font, large)
- Status badge
- Event type badge (with color dot)
- Client info section (name, phone, email)
- Schedule section (venue, date, time, guest count, pricing tier)
- Notes section

**Right/Side column:**
- **Inventory Breakdown card:**
  - Table: Item | Size | Qty | Unit Price | Subtotal
  - Total row at bottom (sum of all line subtotals)
- **Event Audit History card:**
  - List of audit log entries where `entityId === event.id`
  - Shows: action badge | user full name | date/time | changes diff (expandable)

Quick actions bar at bottom (Edit Event button for admins).

---

## PHASE 14 — QUOTATIONS MODULE

### `QuotationsPage.jsx`

Table with: Quote # | Client | Total | Status | Valid Until | Actions

Actions: Edit | Convert to Invoice (if status is DRAFT or ACCEPTED) | Delete

Status filter + search by client name.

Auto-mark expired quotations: on page load, check `validUntil` dates. If `validUntil` < today and status is not already `CONVERTED` or `REJECTED`, update status to `EXPIRED` (add EXPIRED to the status list — or just leave as SENT and rely on visual to show past dates).

### `QuotationFormPage.jsx`

For create and edit. On edit, pre-fill all fields.

**Client Section:**
- Client Name — required
- Client Email — optional
- Client Phone — optional
- Link to Event — optional dropdown (all org events, sorted by date descending)

**Line Items Section:**
State: `lineItems` = array of `{ id, description, quantity, unitPrice, total }`.

"+ Add Line Item" button. For each item:
- Description input (full width)
- Quantity input (number, min 1)
- Unit Price input (number, min 0)
- Total = computed (quantity × unitPrice), displayed read-only
- Delete (×) button

At least 1 line item required.

**Totals Section (auto-calculated, displayed read-only with input for discount/tax):**
- Subtotal = sum of all line item totals (read-only)
- Discount % input (optional, 0–100) → Discount Amount = subtotal × (discount/100)
- Tax % input (optional, default 0) → Tax Amount = (subtotal - discountAmount) × (tax/100)
- **Total = subtotal − discountAmount + taxAmount** (bold, large)

**Meta Section:**
- Valid Until — date input — required
- Notes / Terms — textarea — optional

**Status** — select (DRAFT | SENT | ACCEPTED | REJECTED)

On submit (create):
1. Generate `quotationNumber` using `getNextNumber(STORAGE_KEYS.QUOTATIONS, 'QUO', orgId)`
2. Save, audit log, toast, navigate to `/quotations`

**Convert to Invoice button** (visible on QuotationFormPage when editing an existing quotation that is not yet CONVERTED):
- Clicking navigates to `/invoices/new?fromQuotation=:quotationId`
- The invoice form pre-fills all client info and line items from the quotation
- After the invoice is saved, the quotation's `status` is updated to `CONVERTED` and `convertedToInvoiceId` is set

---

## PHASE 15 — INVOICES MODULE

### `InvoicesPage.jsx`

Table: Invoice # | Client | Total | Status | Due Date | Source | Actions

Source column: shows "From QUO-2025-0001" if it was converted from a quotation, else "Direct".

On page load: check all invoices with `status === 'SENT'` where `dueDate` < today. Auto-update those to `status: 'OVERDUE'` and write an audit log entry.

Mark as Paid action: update status to `PAID`, write audit log.

### `InvoiceFormPage.jsx`

Identical structure to `QuotationFormPage` with these differences:
- Field: **Due Date** (required) instead of "Valid Until"
- Status options: DRAFT | SENT | PAID | OVERDUE | CANCELLED
- No "Convert to Invoice" button (it IS the invoice)
- `invoiceNumber` generated with prefix `INV`
- If URL query param `fromQuotation=:id` exists, load the quotation and pre-fill all fields

---

## PHASE 16 — AUDIT LOG PAGE (ADMIN ONLY)

### `AuditLogPage.jsx`

Full audit history table.

**Filters (all applied simultaneously):**
- Date range: "From" + "To" date pickers
- Entity Type: multi-select (EVENT, EVENT_TYPE, INVENTORY_ITEM, QUOTATION, INVOICE, USER)
- Action: multi-select (CREATED, UPDATED, DELETED, PROMOTED, DEMOTED, CONVERTED, STATUS_CHANGED)
- Performed By: dropdown of org users

**Table columns:**
- Date/Time (formatted with formatDateTime helper)
- Performed By (user full name)
- Action (colored Badge)
- Entity Type (Badge)
- Entity Label (e.g. "Moyo-Dube Wedding")
- Details button → expands row or opens Modal showing the `changes` diff

**Diff Display:**
When `changes` has `before` and `after` objects, render a side-by-side diff:
- Left: "Before" (red-tinted)
- Right: "After" (green-tinted)
- Only show fields that changed

---

## PHASE 17 — ANIMATIONS & POLISH

### Step 17.1 — Page Transitions

Wrap every page component's root element with:
```jsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.25, ease: 'easeOut' }}
>
```

### Step 17.2 — List Stagger Animation

In any page that renders a grid or list of cards:
```jsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.2 }}
  >
    <ItemCard item={item} />
  </motion.div>
))}
```

### Step 17.3 — Stat Card Counter Animation

On DashboardPage, StatCard values should count up from 0 to their final value on mount using a custom `useCountUp` hook with `requestAnimationFrame`.

### Step 17.4 — Sidebar Active Indicator

The active nav link in the sidebar should have an animated gold left border using:
```jsx
<motion.div layoutId="activeNav" className="absolute left-0 top-0 h-full w-1 bg-[--color-accent] rounded-r" />
```

### Step 17.5 — Loading Skeleton

When data is loading (reading from localStorage is instant, but simulate with a tiny `useEffect` delay of 150ms for UX), show skeleton placeholder cards using a `Skeleton` component:
```jsx
// A pulsing gray rectangle
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-[--color-bg-tertiary] rounded-xl ${className}`} />
);
```

---

## PHASE 18 — FINAL INTEGRATION CHECKS

After building all phases, verify:

1. **Data isolation:** Every read operation filters by `organizationId`. No data leaks between organizations.

2. **Audit trail coverage:** Every create, update, and delete in every module calls `writeAuditLog()`. Check: EventTypes, Inventory, Events, Quotations, Invoices, Users.

3. **Route guard completeness:** All admin-only routes use `<AdminRoute>`. All authenticated routes use `<ProtectedRoute>`. The `/`, `/login`, and `/register` routes are publicly accessible.

4. **Notification generation:** `generateEventNotifications()` is called once on app mount (in `NotificationBootstrap`) and only when `currentOrg` is available.

5. **Auto-numbering:** Quotations use `QUO-YYYY-####` and Invoices use `INV-YYYY-####`. Both are scoped to the organization.

6. **Theme toggle:** The sun/moon button in Topbar toggles the `dark` class on `<html>`. All components use `dark:` Tailwind variants. Theme is persisted in localStorage.

7. **Responsive layout:**
   - Mobile (`< 768px`): Sidebar hidden, MobileNav bottom bar visible, all tables show card-view fallback
   - Tablet (`768–1024px`): Sidebar icon-only (no labels), content adapts
   - Desktop (`> 1024px`): Full sidebar, multi-column layouts

8. **Form validation:** Every form uses React Hook Form + Yup. All required fields show inline errors on submit attempt. Errors appear below each field in red.

9. **Toast feedback:** Every successful create/update/delete shows a success toast. Every error (validation failure, delete blocked) shows an error toast.

10. **Empty states:** Every list/table page shows an `EmptyState` component when no items exist, with a contextual description and action button.

---

## DESIGN FINAL CHECKLIST

- [ ] Google Fonts loaded: Playfair Display, DM Sans, JetBrains Mono
- [ ] All CSS custom properties (`--color-*`) applied via `var()` in Tailwind classes
- [ ] Dark mode works on every single component
- [ ] Gold accent color (`#C17F24` light / `#D4943A` dark) used for: active nav, primary buttons, focus rings, stat card accents
- [ ] Status badges use the correct colors as defined in the documentation
- [ ] All page headers use `font-display` (Playfair Display) for the title
- [ ] All quotation/invoice numbers use `font-mono` (JetBrains Mono)
- [ ] Framer Motion applied to: page entrance, list stagger, modal open/close, sidebar active indicator
- [ ] Mobile bottom nav has the correct 5 items
- [ ] Notification bell shows correct unread count badge (red dot or number)
- [ ] Calendar view is custom-built with date-fns, no external calendar library

---

*End of EventFlow OpenCode Prompt v1.0*