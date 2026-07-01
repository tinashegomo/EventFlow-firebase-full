import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminRoute from './components/guards/AdminRoute';

const LandingPage = lazy(() => import('./pages/auth/LandingPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const OrganizationPage = lazy(() => import('./pages/organization/OrganizationPage'));
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const EventTypesPage = lazy(() => import('./pages/event-types/EventTypesPage'));
const EventTypeFormPage = lazy(() => import('./pages/event-types/EventTypeFormPage'));
const EventTypeDetailPage = lazy(() => import('./pages/event-types/EventTypeDetailPage'));
const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage'));
const InventoryFormPage = lazy(() => import('./pages/inventory/InventoryFormPage'));
const InventoryDetailPage = lazy(() => import('./pages/inventory/InventoryDetailPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const EventFormPage = lazy(() => import('./pages/events/EventFormPage'));
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage'));
const QuotationsPage = lazy(() => import('./pages/quotations/QuotationsPage'));
const QuotationFormPage = lazy(() => import('./pages/quotations/QuotationFormPage'));
const QuotationDetailPage = lazy(() => import('./pages/quotations/QuotationDetailPage'));
const InvoicesPage = lazy(() => import('./pages/invoices/InvoicesPage'));
const InvoiceFormPage = lazy(() => import('./pages/invoices/InvoiceFormPage'));
const InvoiceDetailPage = lazy(() => import('./pages/invoices/InvoiceDetailPage'));
const UserDetailPage = lazy(() => import('./pages/users/UserDetailPage'));
const AuditLogPage = lazy(() => import('./pages/audit/AuditLogPage'));

const PageFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <Loader2 size={32} className="animate-spin text-app-accent" />
  </div>
);



export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              },
            }}
          />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <DashboardPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organization"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <OrganizationPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event-types"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <EventTypesPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event-types/new"
                element={
                  <AdminRoute>
                    <AppShell>
                      <EventTypeFormPage />
                    </AppShell>
                  </AdminRoute>
                }
              />
              <Route
                path="/event-types/:id"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <EventTypeDetailPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event-types/:id/edit"
                element={
                  <AdminRoute>
                    <AppShell>
                      <EventTypeFormPage />
                    </AppShell>
                  </AdminRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <InventoryPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory/new"
                element={
                  <AdminRoute>
                    <AppShell>
                      <InventoryFormPage />
                    </AppShell>
                  </AdminRoute>
                }
              />
              <Route
                path="/inventory/:id"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <InventoryDetailPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory/:id/edit"
                element={
                  <AdminRoute>
                    <AppShell>
                      <InventoryFormPage />
                    </AppShell>
                  </AdminRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <EventsPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/new"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <EventFormPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <EventDetailPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id/edit"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <EventFormPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotations"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <QuotationsPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotations/new"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <QuotationFormPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotations/:id"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <QuotationDetailPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotations/:id/edit"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <QuotationFormPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <InvoicesPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/new"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <InvoiceFormPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/:id"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <InvoiceDetailPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/:id/edit"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <InvoiceFormPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <AdminRoute>
                    <AppShell>
                      <UsersPage />
                    </AppShell>
                  </AdminRoute>
                }
              />
              <Route
                path="/users/:id"
                element={
                  <AdminRoute>
                    <AppShell>
                      <UserDetailPage />
                    </AppShell>
                  </AdminRoute>
                }
              />
              <Route
                path="/audit-log"
                element={
                  <AdminRoute>
                    <AppShell>
                      <AuditLogPage />
                    </AppShell>
                  </AdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
