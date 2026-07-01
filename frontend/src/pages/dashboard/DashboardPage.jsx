import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  Receipt,
  FileText,
  Plus,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Banknote,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection } from '../../hooks/useOrgCollection';
import { PageHeader, StatCard, Card, Badge, Button, EmptyState } from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { useCountUp } from '../../hooks/useCountUp';
import { COLLECTIONS } from '../../firebase/collections';
import {
  formatDate,
  formatRelative,
  getCountdownLabel,
  formatCurrency,
} from '../../utils/dateHelpers';
import {
  differenceInCalendarDays,
  startOfDay,
  parseISO,
  isSameMonth,
  subMonths,
  format,
} from 'date-fns';
import { useAuditLogs } from '../../hooks/useAuditLogs';

const CountUp = ({ value }) => {
  const v = useCountUp(value, 700);
  return <>{typeof value === 'number' && value >= 100 ? formatCurrency(v).replace('.00', '') : v}</>;
};

const formatCompact = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const BarChart = ({ data, height = 140 }) => {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max((d.value / maxVal) * 100, 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-app-text-primary text-white text-[10px] px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 font-mono">
              {formatCurrency(d.value)}
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="w-full rounded-t-md bg-gradient-to-t from-app-accent to-purple-400 min-h-[2px] cursor-pointer hover:opacity-80 transition"
              style={{ height: `${pct}%` }}
            />
            <span className="text-[10px] text-app-text-muted font-medium">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const DashboardPage = () => {
  const { user, currentOrg } = useAuth();
  const { items: events } = useOrgCollection(COLLECTIONS.EVENTS);
  const { items: quotations } = useOrgCollection(COLLECTIONS.QUOTATIONS);
  const { items: invoices } = useOrgCollection(COLLECTIONS.INVOICES);
  const { items: eventTypes } = useOrgCollection(COLLECTIONS.EVENT_TYPES);
  const { items: inventory } = useOrgCollection(COLLECTIONS.INVENTORY);
  const auditLogs = useAuditLogs({ orgId: currentOrg?.id }).logs;

  const eventTypeById = useMemo(
    () => Object.fromEntries(eventTypes.map((t) => [t.id, t])),
    [eventTypes]
  );

  // ── Financial Calculations ──
  const financials = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === 'PAID');
    const sentInvoices = invoices.filter((i) => i.status === 'SENT');
    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
    const draftInvoices = invoices.filter((i) => i.status === 'DRAFT');

    const totalRevenue = paidInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const pendingAmount = sentInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const overdueAmount = overdueInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const draftAmount = draftInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);

    const totalQuoted = quotations.reduce((s, q) => s + (Number(q.totalAmount) || 0), 0);
    const acceptedQuotations = quotations.filter((q) => q.status === 'ACCEPTED' || q.status === 'CONVERTED');
    const quotedValue = acceptedQuotations.reduce((s, q) => s + (Number(q.totalAmount) || 0), 0);

    return {
      totalRevenue,
      pendingAmount,
      overdueAmount,
      draftAmount,
      totalQuoted,
      quotedValue,
      paidCount: paidInvoices.length,
      sentCount: sentInvoices.length,
      overdueCount: overdueInvoices.length,
      draftCount: draftInvoices.length,
    };
  }, [invoices, quotations]);

  // ── Monthly Revenue (last 6 months) ──
  const monthlyRevenue = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const label = format(d, 'MMM');
      const monthStr = format(d, 'yyyy-MM');
      const value = invoices
        .filter((inv) => {
          if (inv.status !== 'PAID') return false;
          const invDate = inv.paidDate || inv.createdAt;
          if (!invDate) return false;
          const normalized = typeof invDate === 'string' ? parseISO(invDate) : invDate?.toDate?.() || new Date(invDate);
          return format(normalized, 'yyyy-MM') === monthStr;
        })
        .reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0);
      months.push({ label, value });
    }
    return months;
  }, [invoices]);

  // ── Event Stats ──
  const eventStats = useMemo(() => {
    const today = startOfDay(new Date());
    const thisMonth = events.filter((e) => isSameMonth(parseISO(e.scheduledDate), new Date()));
    const upcoming = events
      .filter(
        (e) =>
          e.status === 'SCHEDULED' &&
          differenceInCalendarDays(parseISO(e.scheduledDate), today) >= 0 &&
          differenceInCalendarDays(parseISO(e.scheduledDate), today) <= 30
      )
      .sort(
        (a, b) =>
          differenceInCalendarDays(parseISO(a.scheduledDate), today) -
          differenceInCalendarDays(parseISO(b.scheduledDate), today)
      );
    const completed = events.filter((e) => e.status === 'COMPLETED');
    const totalGuests = events.reduce((s, e) => s + (Number(e.guestCount) || 0), 0);

    return {
      thisMonth,
      upcoming: upcoming.slice(0, 5),
      completed,
      totalGuests,
      total: events.length,
    };
  }, [events]);

  // ── Inventory Stats ──
  const inventoryStats = useMemo(() => {
    const lowStock = inventory.filter((item) => {
      const totalQty = (item.variants || []).reduce(
        (s, v) => s + (Number(v.quantity) || 0),
        0
      );
      return totalQty <= 5 && totalQty >= 0;
    });
    const outOfStock = inventory.filter((item) => {
      const totalQty = (item.variants || []).reduce(
        (s, v) => s + (Number(v.quantity) || 0),
        0
      );
      return totalQty === 0;
    });
    const totalStockValue = inventory.reduce((s, item) => {
      return (
        s +
        (item.variants || []).reduce(
          (vs, v) => vs + (Number(v.quantity) || 0) * (Number(v.price) || 0),
          0
        )
      );
    }, 0);
    const totalItems = inventory.reduce(
      (s, item) => s + (item.variants || []).reduce((vs, v) => vs + (Number(v.quantity) || 0), 0),
      0
    );

    return { lowStock, outOfStock, totalStockValue, totalItems, total: inventory.length };
  }, [inventory]);

  // ── Event type breakdown for chart ──
  const eventTypeBreakdown = useMemo(() => {
    const counts = {};
    events.forEach((e) => {
      const type = eventTypeById[e.eventTypeId];
      const name = type?.name || 'Uncategorized';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [events, eventTypeById]);

  const pendingInvoices = invoices.filter(
    (i) => i.status === 'SENT' || i.status === 'DRAFT' || i.status === 'OVERDUE'
  );
  const openQuotations = quotations.filter(
    (q) => q.status === 'DRAFT' || q.status === 'SENT' || q.status === 'ACCEPTED'
  );

  return (
    <PageTransition>
      <PageHeader
        title={`Welcome, ${user?.displayName?.split(' ')[0] || ''}`}
        subtitle={`Here's what's happening in ${currentOrg?.name || 'your organization'}.`}
      />

      {/* ── Revenue Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={<CountUp value={financials.totalRevenue} />}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Pending Payments"
          value={<CountUp value={financials.pendingAmount} />}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue"
          value={<CountUp value={financials.overdueAmount} />}
          icon={AlertTriangle}
          color="red"
          trend={financials.overdueCount > 0 ? { direction: 'down', value: financials.overdueCount, label: 'invoices' } : undefined}
        />
        <StatCard
          title="Events This Month"
          value={<CountUp value={eventStats.thisMonth.length} />}
          icon={CalendarDays}
          color="purple"
        />
      </div>

      {/* ── Second Row Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Quoted Value"
          value={<CountUp value={financials.quotedValue} />}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Stock Items"
          value={<CountUp value={inventoryStats.total} />}
          icon={Package}
          color="accent"
          trend={inventoryStats.lowStock.length > 0 ? { direction: 'down', value: inventoryStats.lowStock.length, label: 'low stock' } : undefined}
        />
        <StatCard
          title="Stock Value"
          value={<CountUp value={inventoryStats.totalStockValue} />}
          icon={Banknote}
          color="green"
        />
        <StatCard
          title="Total Guests"
          value={<CountUp value={eventStats.totalGuests} />}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-display font-semibold">Revenue Trend</h2>
              <p className="text-sm text-app-text-muted">Paid invoices over the last 6 months</p>
            </div>
            <BarChart3 size={20} className="text-app-text-muted" />
          </div>
          <BarChart data={monthlyRevenue} height={160} />
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-app-border">
            <span className="text-sm text-app-text-muted">Total revenue</span>
            <span className="text-lg font-bold font-mono text-app-success">
              {formatCurrency(financials.totalRevenue)}
            </span>
          </div>
        </Card>

        {/* Event Types Breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-semibold">Events by Type</h2>
          </div>
          {eventTypeBreakdown.length === 0 ? (
            <p className="text-sm text-app-text-muted text-center py-8">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {eventTypeBreakdown.map((item, i) => {
                const type = Object.values(eventTypeById).find((t) => t.name === item.label);
                const maxCount = Math.max(...eventTypeBreakdown.map((e) => e.value));
                const pct = maxCount > 0 ? (item.value / maxCount) * 100 : 0;
                return (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: type?.color || '#9CA3AF' }}
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm font-mono font-semibold">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-app-bg-tertiary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.08, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: type?.color || '#9CA3AF' }}
                      />
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Events */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Upcoming Events</h2>
            <Link
              to="/events"
              className="text-sm text-app-accent hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {eventStats.upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming events"
              description="Schedule your next event to get started."
              action={{ label: 'New Event', onClick: () => (window.location.href = '/events/new') }}
            />
          ) : (
            <ul className="space-y-2">
              {eventStats.upcoming.map((e, i) => {
                const type = eventTypeById[e.eventTypeId];
                return (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/events/${e.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-app-border hover:border-app-accent hover:bg-app-bg-tertiary transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {type && (
                          <span
                            className="w-1.5 h-10 rounded-full flex-shrink-0"
                            style={{ backgroundColor: type.color }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-app-text-primary truncate font-display">
                            {e.title}
                          </p>
                          <p className="text-xs text-app-text-muted truncate">
                            {e.clientName} · {e.venue}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-app-text-muted hidden sm:inline">
                          {formatDate(e.scheduledDate)}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-app-accent-light text-app-accent-dark">
                          {getCountdownLabel(e.scheduledDate)}
                        </span>
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Stock Alerts</h2>
            <Link
              to="/inventory"
              className="text-sm text-app-accent hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {inventoryStats.lowStock.length === 0 && inventoryStats.outOfStock.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={32} className="mx-auto text-app-success mb-2" />
              <p className="text-sm text-app-text-muted">All stock levels healthy.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {inventoryStats.outOfStock.slice(0, 3).map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-red-200 bg-red-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={14} className="text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-red-800 truncate">{item.name}</p>
                    <p className="text-xs text-red-600">Out of stock</p>
                  </div>
                </motion.li>
              ))}
              {inventoryStats.lowStock.filter((i) => !inventoryStats.outOfStock.find((o) => o.id === i.id)).slice(0, 4).map((item, i) => {
                const totalQty = (item.variants || []).reduce((s, v) => s + (Number(v.quantity) || 0), 0);
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (i + inventoryStats.outOfStock.length) * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-amber-200 bg-amber-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-amber-800 truncate">{item.name}</p>
                      <p className="text-xs text-amber-600">{totalQty} left</p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Financials + Activity Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Financial Summary */}
        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Financial Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">Paid</p>
                  <p className="text-xs text-emerald-600">{financials.paidCount} invoices</p>
                </div>
              </div>
              <span className="font-mono font-semibold text-emerald-700">
                {formatCurrency(financials.totalRevenue)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <CreditCard size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Pending</p>
                  <p className="text-xs text-amber-600">{financials.sentCount} invoices</p>
                </div>
              </div>
              <span className="font-mono font-semibold text-amber-700">
                {formatCurrency(financials.pendingAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Overdue</p>
                  <p className="text-xs text-red-600">{financials.overdueCount} invoices</p>
                </div>
              </div>
              <span className="font-mono font-semibold text-red-700">
                {formatCurrency(financials.overdueAmount)}
              </span>
            </div>

            <div className="pt-3 border-t border-app-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-app-text-muted">Quotation conversion</span>
                <span className="text-sm font-mono font-semibold">
                  {quotations.length > 0
                    ? `${Math.round((financials.paidCount / quotations.length) * 100)}%`
                    : '—'}
                </span>
              </div>
              <div className="h-2 bg-app-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${quotations.length > 0 ? Math.min((financials.paidCount / quotations.length) * 100, 100) : 0}%`,
                  }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-app-accent to-purple-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Recent Activity</h2>
            <Link
              to="/audit-log"
              className="text-sm text-app-accent hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-app-text-muted text-center py-6">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {auditLogs.slice(0, 10).map((log) => (
                <li key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-app-bg-tertiary flex items-center justify-center flex-shrink-0">
                    {log.action === 'CREATED' ? (
                      <Plus size={12} className="text-app-success" />
                    ) : log.action === 'DELETED' ? (
                      <TrendingDown size={12} className="text-app-danger" />
                    ) : (
                      <CheckCircle2 size={12} className="text-app-info" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-app-text-primary leading-snug">
                      <strong>{log.userName || 'Unknown'}</strong>{' '}
                      <span className="text-app-text-secondary">
                        {(log.action || '').toLowerCase().replace(/_/g, ' ')}
                      </span>{' '}
                      <span className="text-app-text-primary">{log.entityName}</span>
                    </p>
                    <p className="text-xs text-app-text-muted mt-0.5">
                      {formatRelative(log.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <Card>
        <h2 className="text-lg font-display font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/events/new">
            <Button leftIcon={<Plus size={16} />}>New Event</Button>
          </Link>
          <Link to="/quotations/new">
            <Button variant="secondary" leftIcon={<Plus size={16} />}>New Quotation</Button>
          </Link>
          <Link to="/invoices/new">
            <Button variant="secondary" leftIcon={<Plus size={16} />}>New Invoice</Button>
          </Link>
          <Link to="/inventory/new">
            <Button variant="ghost" leftIcon={<Plus size={16} />}>Add Inventory</Button>
          </Link>
        </div>
      </Card>
    </PageTransition>
  );
};

export default DashboardPage;
