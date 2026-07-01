# EventFlow — Event Management System
## Full System Documentation v1.0

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Data Architecture — LocalStorage Schema](#4-data-architecture--localstorage-schema)
5. [Authentication & Registration Flow](#5-authentication--registration-flow)
6. [Organization Management](#6-organization-management)
7. [User & Role Management](#7-user--role-management)
8. [Event Types Module](#8-event-types-module)
9. [Inventory Management Module](#9-inventory-management-module)
10. [Events & Scheduling Module](#10-events--scheduling-module)
11. [Quotations Module](#11-quotations-module)
12. [Invoices Module](#12-invoices-module)
13. [Audit Trail System](#13-audit-trail-system)
14. [Notifications System](#14-notifications-system)
15. [UI/UX Design System](#15-uiux-design-system)
16. [Routing & Navigation](#16-routing--navigation)
17. [Component Architecture](#17-component-architecture)
18. [Theme System (Dark/Light)](#18-theme-system-darklight)
19. [LocalStorage Helper Layer](#19-localstorage-helper-layer)

---

## 1. System Overview

**EventFlow** is a fully client-side, React-based Event Management System designed for event companies and organizations. It enables multi-staff organizations to plan, schedule, track, and invoice events — from weddings and graduations to funerals and memorials — all from a modern, responsive, animated web application.

### Core Capabilities

| Capability | Description |
|---|---|
| Multi-Organization Support | Multiple organizations can register independently; each has isolated data |
| Role-Based Access Control | Two roles: `ADMIN` and `STAFF`. Admins have full privileges; Staff have limited access |
| Event Type Configuration | Admins define event types with tiered pricing by guest count |
| Inventory Tracking | Manage physical inventory items (tents, chairs, etc.) with sizes/prices |
| Event Scheduling | Create events, attach inventory items, and track status |
| Quotations & Invoices | Generate quotes, convert to invoices, or create invoices directly |
| Audit Trail | Every create/update/delete action on events is logged with the responsible admin |
| Notifications | Proactive reminders as scheduled event dates approach |
| Dark/Light Mode | Full theme toggle persisted per user |
| Responsive Design | Mobile, tablet, and desktop layouts |

### System Boundaries

- All data is stored in browser `localStorage`
- No backend or API is required
- Data is scoped per organization via `organizationId`
- Auth is simulated (hashed password stored in localStorage)

---

## 2. Tech Stack

| Technology | Purpose |
|---|---|
| **React 18+** | UI framework (functional components + hooks) |
| **React Router v6** | Client-side routing and protected routes |
| **Tailwind CSS v3** | Utility-first styling with custom design tokens |
| **Framer Motion** | Page transitions, micro-interactions, animations |
| **React Hook Form** | Form state management and validation |
| **Yup** | Schema-based form validation |
| **date-fns** | Date formatting and event proximity calculation |
| **uuid** | Generating unique IDs for all entities |
| **Lucide React** | Icon library |
| **React Hot Toast** | Toast notifications |
| **LocalStorage** | Client-side data persistence |

---

## 3. Project Structure

```
eventflow/
├── public/
│   └── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css              # Tailwind base + custom CSS variables
│   │
│   ├── constants/
│   │   ├── storageKeys.js     # All localStorage key constants
│   │   └── roles.js           # Role constants
│   │
│   ├── utils/
│   │   ├── storage.js         # Generic get/set/update/delete helpers
│   │   ├── auth.js            # Auth helpers (hash password, get current user)
│   │   ├── audit.js           # Audit log writer helper
│   │   ├── notifications.js   # Notification generator
│   │   ├── idGenerator.js     # UUID wrapper
│   │   └── dateHelpers.js     # Event date proximity utilities
│   │
│   ├── context/
│   │   ├── AuthContext.jsx    # Current user, org, login, logout
│   │   └── ThemeContext.jsx   # Dark/Light theme toggle
│   │
│   ├── hooks/
│   │   ├── useStorage.js      # Reactive localStorage hook
│   │   ├── useAudit.js        # Audit log writer hook
│   │   └── useNotifications.js
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx        # Sidebar + topbar wrapper
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   ├── Topbar.jsx          # Header bar with notifications + theme toggle
│   │   │   └── MobileNav.jsx       # Bottom navigation for mobile
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── PageHeader.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── NotificationPanel.jsx
│   │   │
│   │   └── guards/
│   │       ├── ProtectedRoute.jsx  # Requires authenticated user
│   │       └── AdminRoute.jsx      # Requires ADMIN role
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LandingPage.jsx     # Welcome + Register/Login options
│   │   │   ├── RegisterPage.jsx    # Register new user (org creation or join existing)
│   │   │   └── LoginPage.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx   # Metrics, upcoming events, recent activity
│   │   │
│   │   ├── organization/
│   │   │   └── OrganizationPage.jsx # View/edit org profile
│   │   │
│   │   ├── users/
│   │   │   └── UsersPage.jsx        # List users, promote/demote roles (Admin only)
│   │   │
│   │   ├── event-types/
│   │   │   ├── EventTypesPage.jsx   # List event types
│   │   │   └── EventTypeFormPage.jsx # Create/Edit event type with pricing tiers
│   │   │
│   │   ├── inventory/
│   │   │   ├── InventoryPage.jsx    # List all inventory items
│   │   │   └── InventoryFormPage.jsx # Create/Edit item with variants
│   │   │
│   │   ├── events/
│   │   │   ├── EventsPage.jsx       # Calendar + list view of events
│   │   │   ├── EventFormPage.jsx    # Create/Edit event + attach inventory
│   │   │   └── EventDetailPage.jsx  # View full event details + audit trail
│   │   │
│   │   ├── quotations/
│   │   │   ├── QuotationsPage.jsx   # List quotations
│   │   │   └── QuotationFormPage.jsx # Create/Edit quotation; convert to invoice
│   │   │
│   │   ├── invoices/
│   │   │   ├── InvoicesPage.jsx     # List invoices
│   │   │   └── InvoiceFormPage.jsx  # Create/Edit invoice
│   │   │
│   │   └── audit/
│   │       └── AuditLogPage.jsx     # Full audit trail (Admin only)
│   │
│   └── tailwind.config.js
```

---

## 4. Data Architecture — LocalStorage Schema

All data is stored in `localStorage` under namespaced keys. Every key is prefixed with `ef_` (EventFlow) to avoid collisions.

### Storage Keys Reference

```js
// constants/storageKeys.js
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

---

### Data Models

#### 4.1 Organization

```json
{
  "id": "uuid-v4",
  "name": "Starlight Events",
  "email": "info@starlightevents.com",
  "phone": "+263771234567",
  "address": "123 Samora Machel Ave, Harare",
  "logoBase64": null,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "createdBy": "user-uuid"
}
```

#### 4.2 User

```json
{
  "id": "uuid-v4",
  "firstName": "Tinashe",
  "lastName": "Moyo",
  "email": "tinashe@starlightevents.com",
  "passwordHash": "hashed-string",
  "role": "ADMIN",
  "organizationId": "org-uuid",
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

> **Roles:**
> - `ADMIN` — Full access. Can manage users, event types, inventory, events, quotations, invoices, view audit logs. Promote/demote staff.
> - `STAFF` — Can view events, create quotations/invoices, cannot manage users or system settings.

#### 4.3 Event Type

```json
{
  "id": "uuid-v4",
  "organizationId": "org-uuid",
  "name": "Wedding",
  "description": "Full wedding ceremony and reception management",
  "icon": "heart",
  "color": "#E91E8C",
  "pricingTiers": [
    {
      "id": "tier-uuid-1",
      "guestCount": 100,
      "price": 2500.00,
      "description": "Intimate wedding"
    },
    {
      "id": "tier-uuid-2",
      "guestCount": 200,
      "price": 4500.00,
      "description": "Medium wedding"
    },
    {
      "id": "tier-uuid-3",
      "guestCount": 300,
      "price": 7000.00,
      "description": "Large wedding"
    },
    {
      "id": "tier-uuid-4",
      "guestCount": 1000,
      "price": 20000.00,
      "description": "Grand wedding"
    }
  ],
  "createdAt": "2025-01-15T10:00:00.000Z",
  "createdBy": "user-uuid",
  "updatedAt": null,
  "updatedBy": null
}
```

#### 4.4 Inventory Item

```json
{
  "id": "uuid-v4",
  "organizationId": "org-uuid",
  "name": "Frame Tent",
  "description": "Heavy-duty aluminium frame marquee tent",
  "category": "Tents",
  "unit": "piece",
  "variants": [
    {
      "id": "variant-uuid-1",
      "size": "6m x 9m",
      "pricePerUnit": 350.00,
      "quantityInStock": 5
    },
    {
      "id": "variant-uuid-2",
      "size": "9m x 12m",
      "pricePerUnit": 600.00,
      "quantityInStock": 3
    }
  ],
  "createdAt": "2025-01-15T10:00:00.000Z",
  "createdBy": "user-uuid",
  "updatedAt": null,
  "updatedBy": null
}
```

> **Other inventory item examples (name / category):**
> - Underplates / Tableware
> - Water Glasses / Tableware
> - Crossbag Chairs / Seating
> - Diamond Chairs / Seating
> - Tiffany Chairs / Seating
> - Flower Arrangements / Décor
> - Table Runners / Décor
> - Fairy Lights / Lighting

#### 4.5 Event

```json
{
  "id": "uuid-v4",
  "organizationId": "org-uuid",
  "title": "Moyo-Dube Wedding",
  "eventTypeId": "event-type-uuid",
  "clientName": "Chiedza Moyo",
  "clientPhone": "+263771234567",
  "clientEmail": "chiedza@email.com",
  "venue": "Borrowdale Brooke Country Club, Harare",
  "scheduledDate": "2025-08-14",
  "scheduledTime": "14:00",
  "guestCount": 200,
  "selectedPricingTierId": "tier-uuid-2",
  "status": "SCHEDULED",
  "attachedItems": [
    {
      "id": "attach-uuid",
      "inventoryItemId": "item-uuid",
      "variantId": "variant-uuid-1",
      "quantity": 2,
      "snapshotName": "Frame Tent",
      "snapshotSize": "6m x 9m",
      "snapshotPrice": 350.00
    },
    {
      "id": "attach-uuid-2",
      "inventoryItemId": "item-uuid-2",
      "variantId": null,
      "quantity": 100,
      "snapshotName": "Underplates",
      "snapshotSize": null,
      "snapshotPrice": 1.50
    }
  ],
  "notes": "Bride prefers ivory and gold color scheme",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "createdBy": "user-uuid",
  "updatedAt": "2025-01-20T14:30:00.000Z",
  "updatedBy": "user-uuid-2"
}
```

> **Event Status Values:** `SCHEDULED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`

#### 4.6 Quotation

```json
{
  "id": "uuid-v4",
  "quotationNumber": "QUO-2025-0001",
  "organizationId": "org-uuid",
  "eventId": "event-uuid-or-null",
  "clientName": "Blessing Ncube",
  "clientEmail": "blessing@email.com",
  "clientPhone": "+263779876543",
  "lineItems": [
    {
      "id": "line-uuid",
      "description": "Wedding coordination (300 guests)",
      "quantity": 1,
      "unitPrice": 7000.00,
      "total": 7000.00
    },
    {
      "id": "line-uuid-2",
      "description": "Frame Tent 9m x 12m",
      "quantity": 2,
      "unitPrice": 600.00,
      "total": 1200.00
    }
  ],
  "subtotal": 8200.00,
  "discountPercent": 5,
  "discountAmount": 410.00,
  "taxPercent": 15,
  "taxAmount": 1167.00,
  "totalAmount": 8957.00,
  "status": "DRAFT",
  "validUntil": "2025-02-15",
  "notes": "Quotation valid for 30 days",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "createdBy": "user-uuid",
  "updatedAt": null,
  "updatedBy": null,
  "convertedToInvoiceId": null
}
```

> **Quotation Status Values:** `DRAFT` | `SENT` | `ACCEPTED` | `REJECTED` | `CONVERTED`

#### 4.7 Invoice

```json
{
  "id": "uuid-v4",
  "invoiceNumber": "INV-2025-0001",
  "organizationId": "org-uuid",
  "quotationId": "quotation-uuid-or-null",
  "eventId": "event-uuid-or-null",
  "clientName": "Blessing Ncube",
  "clientEmail": "blessing@email.com",
  "clientPhone": "+263779876543",
  "lineItems": [...],
  "subtotal": 8200.00,
  "discountPercent": 5,
  "discountAmount": 410.00,
  "taxPercent": 15,
  "taxAmount": 1167.00,
  "totalAmount": 8957.00,
  "status": "DRAFT",
  "dueDate": "2025-02-28",
  "notes": "Payment due within 14 days of invoice date",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "createdBy": "user-uuid",
  "updatedAt": null,
  "updatedBy": null
}
```

> **Invoice Status Values:** `DRAFT` | `SENT` | `PAID` | `OVERDUE` | `CANCELLED`

#### 4.8 Audit Log

```json
{
  "id": "uuid-v4",
  "organizationId": "org-uuid",
  "entityType": "EVENT",
  "entityId": "event-uuid",
  "entityLabel": "Moyo-Dube Wedding",
  "action": "UPDATED",
  "performedBy": "user-uuid",
  "performedAt": "2025-01-20T14:30:00.000Z",
  "changes": {
    "before": { "venue": "Old Venue", "scheduledDate": "2025-08-10" },
    "after":  { "venue": "Borrowdale Brooke Country Club", "scheduledDate": "2025-08-14" }
  }
}
```

> **Entity Types:** `EVENT` | `EVENT_TYPE` | `INVENTORY_ITEM` | `QUOTATION` | `INVOICE` | `USER`
> **Actions:** `CREATED` | `UPDATED` | `DELETED`

#### 4.9 Notification

```json
{
  "id": "uuid-v4",
  "organizationId": "org-uuid",
  "userId": "user-uuid",
  "type": "EVENT_REMINDER",
  "title": "Event Tomorrow: Moyo-Dube Wedding",
  "message": "The Moyo-Dube Wedding at Borrowdale Brooke is scheduled for tomorrow at 14:00.",
  "eventId": "event-uuid",
  "isRead": false,
  "createdAt": "2025-08-13T08:00:00.000Z"
}
```

> **Notification Types:** `EVENT_REMINDER` | `SYSTEM`
> Notifications are generated:
> - **7 days before** a scheduled event
> - **3 days before** a scheduled event
> - **1 day before** a scheduled event
> - **On the event day**

---

## 5. Authentication & Registration Flow

### 5.1 Registration — Two Paths

When a new user registers, they are presented with a **choice screen**:

#### Path A — Create New Organization

Shown when user selects "Register a new company":

1. **Step 1 — Organization Details:**
   - Organization Name *(required)*
   - Organization Email *(required)*
   - Phone Number *(required)*
   - Physical Address *(required)*

2. **Step 2 — Admin Account:**
   - First Name *(required)*
   - Last Name *(required)*
   - Email Address *(required, unique globally)*
   - Password *(required, min 8 chars)*
   - Confirm Password *(required, must match)*

3. **On Submit:**
   - New `Organization` is created in localStorage
   - New `User` is created with `role: "ADMIN"` and linked to the new org
   - User is logged in and redirected to Dashboard

#### Path B — Join Existing Organization

Shown when user selects "Join an existing company":

1. **Step 1 — Select Organization:**
   - A searchable dropdown shows all organizations sorted alphabetically
   - User selects their organization from the list

2. **Step 2 — Personal Details:**
   - First Name *(required)*
   - Last Name *(required)*
   - Email Address *(required, unique within org)*
   - Password *(required, min 8 chars)*
   - Confirm Password *(required)*

3. **On Submit:**
   - New `User` is created with `role: "STAFF"` and linked to the selected org
   - User is logged in and redirected to Dashboard

### 5.2 Login

- Email + Password form
- Looks up user by email in localStorage
- Compares hashed password
- On success, stores `userId` in `localStorage` under `CURRENT_USER_ID` key
- Redirects to Dashboard

### 5.3 Logout

- Clears `CURRENT_USER_ID` from localStorage
- Redirects to Landing/Login page

---

## 6. Organization Management

**Access:** Admin only (edit). All roles can view.

### Organization Profile Page

Displays and allows editing of:
- Organization name
- Email
- Phone
- Address
- Logo (base64 image upload)

### Business Rules

- Only one organization is associated with a user at a time
- All data (events, inventory, etc.) is filtered by `organizationId` at the application layer
- Organization cannot be deleted (to preserve data integrity in localStorage)

---

## 7. User & Role Management

**Access:** Admin only.

### Users Page

Displays a table of all users in the organization:

| Column | Description |
|---|---|
| Name | Full name |
| Email | Email address |
| Role | `ADMIN` badge or `STAFF` badge |
| Joined | Date user registered |
| Actions | Promote / Demote button (cannot modify own role) |

### Role Rules

- The **first user** (org creator) is always `ADMIN` and cannot be demoted if they are the only admin
- An admin can **promote** a `STAFF` member to `ADMIN`
- An admin can **demote** another `ADMIN` to `STAFF`
- An admin **cannot** demote themselves
- There must always be **at least one admin** per organization

---

## 8. Event Types Module

**Access:** Admin only (create/edit/delete). All roles can view.

### Event Types Page

A grid/list showing all defined event types. Each card shows:
- Type name and icon
- Color indicator
- Number of pricing tiers defined
- Creation date

### Event Type Form

Fields:
- **Name** *(required)* — e.g. "Wedding", "Birthday", "Funeral"
- **Description** *(optional)*
- **Icon** — selectable from preset icon set (Heart, Cake, Star, GraduationCap, Flower, etc.)
- **Color** — color picker

### Pricing Tiers (Dynamic List within the Form)

An "Add Tier" button lets admins build a dynamic list:

| Field | Description |
|---|---|
| Guest Count | e.g. 100, 200, 300, 1000 |
| Price (USD) | e.g. 2500.00 |
| Description | Optional label e.g. "Intimate", "Grand" |

- Minimum 1 tier required
- Tiers are automatically sorted by guest count ascending on save
- Tiers can be added, edited, and removed individually

### Predefined Event Type Suggestions

On the event type form, a row of quick-select buttons offers common suggestions:
- Wedding
- Traditional Wedding
- Birthday
- Funeral
- Memorial
- Graduation
- Corporate Function
- Baby Shower
- Kitchen Party
- Anniversary

Clicking a suggestion auto-fills the Name, Icon, and Color fields.

---

## 9. Inventory Management Module

**Access:** Admin only (create/edit/delete). All roles can view.

### Inventory Page

A searchable, filterable table showing all inventory items with:
- Item name
- Category
- Number of variants
- Total stock count
- Actions (Edit, Delete)

### Inventory Form

Fields:
- **Name** *(required)* — e.g. "Frame Tent"
- **Description** *(optional)*
- **Category** *(required)* — either typed or selected from existing categories
- **Unit** *(required)* — e.g. "piece", "set", "meter"

### Variants (Dynamic List within the Form)

Items with size/price variation use a "Add Variant" dynamic list:

| Field | Description |
|---|---|
| Size / Specification | e.g. "6m x 9m", "Standard", "XL" |
| Price Per Unit | e.g. 350.00 |
| Quantity in Stock | e.g. 5 |

- Items with no variants (e.g. individual plates) have a single default variant with no size label
- Variants can be added, edited, removed

### Categories (examples)

- Tents
- Seating
- Tableware
- Décor
- Lighting
- Audio/Visual
- Catering Equipment
- Transport

---

## 10. Events & Scheduling Module

**Access:** All roles can create events. Only Admins can delete events.

### Events Page — Dual View

**List View:** Table/card list of all events with:
- Event title
- Event type badge
- Client name
- Scheduled date & time
- Guest count
- Status badge
- Actions (View, Edit, Delete)

**Calendar View:** Monthly calendar showing events on their scheduled dates. Events are color-coded by event type. Clicking an event opens a quick-view popover.

### Event Form — Create / Edit

Fields:

**Section 1 — Event Details:**
- Title *(required)* — e.g. "Moyo-Dube Wedding"
- Event Type *(required)* — dropdown of defined event types
- Status *(default: SCHEDULED)* — `SCHEDULED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`

**Section 2 — Client Details:**
- Client Name *(required)*
- Client Phone *(optional)*
- Client Email *(optional)*

**Section 3 — Schedule:**
- Venue *(required)*
- Date *(required)* — date picker
- Time *(required)* — time picker

**Section 4 — Guest Count & Pricing:**
- Guest Count *(required)* — numeric input
- Selected Pricing Tier *(auto-matched by guest count, or manually overridden from dropdown)*
- Displays the matched price for the selected tier

**Section 5 — Inventory Attachments:**
- "Add Item" button opens an item picker:
  - Select inventory item from dropdown (filtered by organization)
  - If item has variants, select the variant from a secondary dropdown
  - Enter quantity
- Attached items are shown in a summary list with name, size, quantity, unit price, and line total
- Items can be removed from the list

**Section 6 — Notes:**
- Free-text notes area

### Event Detail Page

Full read-only view of event with:
- All event details
- Inventory breakdown table (item, variant, qty, unit price, subtotal)
- Total estimated item cost
- Audit history specific to this event (who created, who edited, when)

### Business Rules

- Deleting an event is **soft-logged** — the audit log records the deletion with a snapshot of the event data
- Editing an event logs a `UPDATED` audit entry with a diff of what changed
- Events cannot be scheduled in the past (date validation on create)
- When editing, all current values are pre-filled in the form

---

## 11. Quotations Module

**Access:** All roles.

### Quotations Page

Table of all quotations with:
- Quotation number (QUO-YYYY-####)
- Client name
- Total amount
- Status badge
- Valid until date
- Actions (View, Edit, Convert to Invoice, Delete)

### Quotation Form

**Client Section:**
- Client Name *(required)*
- Client Email *(optional)*
- Client Phone *(optional)*
- Link to Event *(optional dropdown)* — links quote to an existing event

**Line Items (Dynamic):**
- "Add Line Item" adds a row with:
  - Description *(required)*
  - Quantity *(required, numeric)*
  - Unit Price *(required, numeric)*
  - Total *(auto-calculated: qty × unitPrice)*
- Rows can be reordered and deleted

**Totals Section (auto-calculated):**
- Subtotal = sum of all line item totals
- Discount % = optional input → Discount Amount auto-calculated
- Tax % = optional input (e.g. 15 for VAT) → Tax Amount auto-calculated
- **Total = Subtotal − Discount + Tax**

**Meta:**
- Valid Until Date
- Notes / Terms

### Convert Quotation to Invoice

- "Convert to Invoice" button appears on accepted/draft quotations
- Copies all line items, client info, and totals into a new Invoice
- Quotation status updates to `CONVERTED`
- `convertedToInvoiceId` is set on the quotation
- Redirects to new Invoice form pre-filled

### Auto-Numbering

- Quotation numbers auto-increment: `QUO-2025-0001`, `QUO-2025-0002`, etc.
- Scoped per organization

---

## 12. Invoices Module

**Access:** All roles.

### Invoices Page

Table of all invoices with:
- Invoice number (INV-YYYY-####)
- Client name
- Total amount
- Status badge (with color: green=Paid, orange=Sent, red=Overdue)
- Due date
- Source (from quote or direct)
- Actions (View, Edit, Mark as Paid, Delete)

### Invoice Form

Identical structure to Quotation Form, with the addition of:
- **Due Date** *(required)*
- No "Valid Until" date (invoices don't expire like quotes)
- Can optionally link to a quotation and/or event

### Status Transitions

- `DRAFT` → `SENT` (manual status change)
- `SENT` → `PAID` (via "Mark as Paid" action)
- `SENT` → `OVERDUE` (automatic — checked on app load if due date has passed)
- Any status → `CANCELLED`

### Auto-Numbering

- Invoice numbers: `INV-2025-0001`, `INV-2025-0002`, etc.
- Scoped per organization

---

## 13. Audit Trail System

**Access:** Admin only (full audit log page). Event detail page shows event-specific history for all roles.

### What is Logged

| Module | Logged Actions |
|---|---|
| Events | CREATED, UPDATED, DELETED |
| Event Types | CREATED, UPDATED, DELETED |
| Inventory Items | CREATED, UPDATED, DELETED |
| Quotations | CREATED, UPDATED, DELETED, CONVERTED |
| Invoices | CREATED, UPDATED, DELETED, STATUS_CHANGED |
| Users | PROMOTED, DEMOTED |

### Audit Log Page

Filterable table with:
- Date/Time
- User who performed the action (full name)
- Entity type badge
- Entity name
- Action badge (green=CREATED, blue=UPDATED, red=DELETED)
- "View Details" — expands a diff panel showing before/after values

**Filters:**
- Date range picker
- Entity type filter
- Action type filter
- User filter

### Audit Helper Function

```js
// utils/audit.js
export const writeAuditLog = ({ organizationId, entityType, entityId, entityLabel, action, performedBy, changes }) => {
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
    changes: changes || null,
  };
  logs.unshift(newLog); // newest first
  saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
};
```

This function is called **inside every create, update, and delete handler** across the application.

---

## 14. Notifications System

### Trigger Rules

Notifications are checked and generated on every app load (in `App.jsx` via a `useEffect`). For each upcoming event:

| Condition | Notification Title |
|---|---|
| Event is today | "Today: [Event Title]" |
| Event is tomorrow (1 day away) | "Tomorrow: [Event Title]" |
| Event is 3 days away | "In 3 Days: [Event Title]" |
| Event is 7 days away | "In 7 Days: [Event Title]" |

### Deduplication

Before creating a notification, the system checks if one already exists for the same `eventId` + `type` + same `createdAt` date (date only, not time). If it exists, no duplicate is created.

### Notification Panel (Topbar)

A bell icon in the topbar shows an unread count badge. Clicking opens a slide-in panel:
- Lists all unread notifications newest-first
- Each entry shows title, message, and relative time ("2 hours ago")
- Clicking an event notification navigates to that event's detail page
- "Mark all as read" button
- Individual mark-as-read on click

---

## 15. UI/UX Design System

### Visual Direction

**Aesthetic:** Refined, modern, slightly editorial. Think a premium events industry software — clean whitespace, elegant typography, confident use of color for status indicators, subtle depth with shadows and frosted glass effects. Animations should feel purposeful, not flashy.

### Color Palette

```css
/* Light Theme */
--color-bg-primary:     #F8F7F5;   /* Warm off-white */
--color-bg-secondary:   #FFFFFF;   /* Card backgrounds */
--color-bg-tertiary:    #F1EFE9;   /* Subtle section bg */
--color-border:         #E5E2DC;
--color-text-primary:   #1A1814;   /* Near-black */
--color-text-secondary: #6B6660;   /* Muted text */
--color-text-muted:     #9E9993;
--color-accent:         #C17F24;   /* Gold — brand primary */
--color-accent-light:   #F5E6C8;   /* Light gold tint */
--color-accent-dark:    #8C5A12;
--color-success:        #2D7D4E;
--color-warning:        #B45309;
--color-danger:         #B91C1C;
--color-info:           #1D4ED8;

/* Dark Theme */
--color-bg-primary:     #141210;
--color-bg-secondary:   #1E1C18;
--color-bg-tertiary:    #252219;
--color-border:         #2E2B24;
--color-text-primary:   #F2EFE8;
--color-text-secondary: #A09990;
--color-text-muted:     #6E6660;
--color-accent:         #D4943A;   /* Slightly lighter gold for dark bg */
--color-accent-light:   #3A2D10;
--color-accent-dark:    #F5C96A;
```

### Typography

```css
/* Google Fonts */
--font-display: 'Playfair Display', serif;   /* Page titles, event names */
--font-body:    'DM Sans', sans-serif;        /* All body, UI text */
--font-mono:    'JetBrains Mono', monospace; /* Invoice numbers, audit IDs */
```

### Spacing Scale (Tailwind extended)

Standard Tailwind spacing scale. Use `gap-4`, `p-6`, `px-8` consistently.

### Component Styles

**Cards:** `bg-white dark:bg-[--color-bg-secondary] rounded-2xl shadow-sm border border-[--color-border] p-6`

**Buttons — Primary:** `bg-[--color-accent] text-white rounded-xl px-5 py-2.5 font-medium hover:bg-[--color-accent-dark] transition-colors`

**Buttons — Secondary:** `border border-[--color-border] bg-transparent text-[--color-text-primary] rounded-xl px-5 py-2.5 hover:bg-[--color-bg-tertiary] transition-colors`

**Inputs:** `w-full rounded-xl border border-[--color-border] bg-[--color-bg-secondary] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-accent] transition`

### Status Badge Colors

| Status | Light BG | Text |
|---|---|---|
| SCHEDULED | Blue-50 | Blue-700 |
| IN_PROGRESS | Amber-50 | Amber-700 |
| COMPLETED | Green-50 | Green-700 |
| CANCELLED | Gray-100 | Gray-600 |
| DRAFT | Gray-100 | Gray-600 |
| SENT | Blue-50 | Blue-700 |
| PAID | Green-50 | Green-700 |
| OVERDUE | Red-50 | Red-700 |
| CONVERTED | Purple-50 | Purple-700 |
| ADMIN | Gold-accent-light | Gold-accent-dark |
| STAFF | Gray-100 | Gray-600 |

### Animations (Framer Motion)

- **Page entrance:** `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}`
- **Card list stagger:** Each card in a list uses `transition={{ delay: index * 0.05 }}`
- **Modal open:** Scale from 0.95 + fade in
- **Sidebar:** Slide in from left on mobile
- **Notification panel:** Slide in from right
- **Form validation error:** Subtle shake animation

### Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `< 768px` (mobile) | Single column, bottom navigation bar |
| `768px–1024px` (tablet) | Sidebar collapses to icon-only, content area expands |
| `> 1024px` (desktop) | Full sidebar with labels, multi-column content |

---

## 16. Routing & Navigation

### Route Structure

```
/                          → LandingPage (public)
/register                  → RegisterPage (public)
/login                     → LoginPage (public)

/dashboard                 → DashboardPage (protected)
/organization              → OrganizationPage (protected)
/users                     → UsersPage (admin only)
/event-types               → EventTypesPage (protected)
/event-types/new           → EventTypeFormPage (admin only)
/event-types/:id/edit      → EventTypeFormPage (admin only)
/inventory                 → InventoryPage (protected)
/inventory/new             → InventoryFormPage (admin only)
/inventory/:id/edit        → InventoryFormPage (admin only)
/events                    → EventsPage (protected)
/events/new                → EventFormPage (protected)
/events/:id                → EventDetailPage (protected)
/events/:id/edit           → EventFormPage (protected)
/quotations                → QuotationsPage (protected)
/quotations/new            → QuotationFormPage (protected)
/quotations/:id/edit       → QuotationFormPage (protected)
/invoices                  → InvoicesPage (protected)
/invoices/new              → InvoiceFormPage (protected)
/invoices/:id/edit         → InvoiceFormPage (protected)
/audit-log                 → AuditLogPage (admin only)
```

### Route Guards

**ProtectedRoute.jsx:** Checks if `CURRENT_USER_ID` exists in localStorage. If not, redirects to `/login`.

**AdminRoute.jsx:** Checks if the current user has `role === "ADMIN"`. If not, redirects to `/dashboard` with a toast message: "Access denied — Admins only."

---

## 17. Component Architecture

### AppShell

Wraps all authenticated pages. Contains:
- `<Sidebar>` — left navigation (hidden on mobile)
- `<Topbar>` — top bar with org name, notification bell, theme toggle, user avatar
- `<main>` — page content area with scroll
- `<MobileNav>` — bottom tab bar (visible only on mobile)

### Sidebar Navigation Links

| Icon | Label | Route | Role |
|---|---|---|---|
| LayoutDashboard | Dashboard | /dashboard | All |
| Calendar | Events | /events | All |
| Tag | Event Types | /event-types | All |
| Package | Inventory | /inventory | All |
| FileText | Quotations | /quotations | All |
| Receipt | Invoices | /invoices | All |
| Building2 | Organization | /organization | All |
| Users | Team | /users | Admin |
| ClipboardList | Audit Log | /audit-log | Admin |

### Dashboard Page

Displays:
1. **Stats Row:** 4 `StatCard` components:
   - Total Events This Month
   - Upcoming Events (next 30 days)
   - Pending Invoices (unpaid)
   - Open Quotations

2. **Upcoming Events List:** Next 5 scheduled events with countdown chip ("In 3 days")

3. **Recent Activity Feed:** Last 10 audit log entries

4. **Quick Actions:** Buttons for "New Event", "New Quotation", "New Invoice"

---

## 18. Theme System (Dark/Light)

### Implementation

```jsx
// context/ThemeContext.jsx
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.THEME) || 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Tailwind Config

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}
```

All component styling uses `dark:` variants throughout (e.g., `dark:bg-[--color-bg-secondary]`).

---

## 19. LocalStorage Helper Layer

### Core Helpers

```js
// utils/storage.js
export const getFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch { return null; }
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch { return false; }
};

// Get all items for an organization
export const getOrgItems = (key, organizationId) => {
  const all = getFromStorage(key) || [];
  return all.filter(item => item.organizationId === organizationId);
};

// Add a new item
export const addItem = (key, newItem) => {
  const all = getFromStorage(key) || [];
  all.push(newItem);
  saveToStorage(key, all);
  return newItem;
};

// Update an item by id
export const updateItem = (key, id, updates) => {
  const all = getFromStorage(key) || [];
  const idx = all.findIndex(item => item.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates };
  saveToStorage(key, all);
  return all[idx];
};

// Delete an item by id
export const deleteItem = (key, id) => {
  const all = getFromStorage(key) || [];
  const filtered = all.filter(item => item.id !== id);
  saveToStorage(key, filtered);
};

// Get single item by id
export const getItemById = (key, id) => {
  const all = getFromStorage(key) || [];
  return all.find(item => item.id === id) || null;
};
```

### Auto-Numbering Helper

```js
// utils/numbering.js
export const getNextNumber = (key, prefix, organizationId) => {
  const items = getOrgItems(key, organizationId);
  const year = new Date().getFullYear();
  const yearItems = items.filter(i => i[`${prefix.toLowerCase()}Number`]?.startsWith(`${prefix}-${year}`));
  const next = String(yearItems.length + 1).padStart(4, '0');
  return `${prefix}-${year}-${next}`;
};
// Usage: getNextNumber(STORAGE_KEYS.QUOTATIONS, 'QUO', orgId) → "QUO-2025-0001"
```

---

*End of EventFlow System Documentation v1.0*