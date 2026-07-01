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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection } from '../../hooks/useOrgCollection';
import { PageHeader, StatCard, Card, EmptyState } from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { useCountUp } from '../../hooks/useCountUp';
import { COLLECTIONS } from '../../firebase/collections';
import { formatDate, formatRelative, getCountdownLabel } from '../../utils/dateHelpers';
import { differenceInCalendarDays, startOfDay, parseISO, isSameMonth } from 'date-fns';
import { useAuditLogs } from '../../hooks/useAuditLogs';

const CountUp = ({ value }) => {
  const v = useCountUp(value, 700);
  return <>{v}</>;
};

const DashboardPage = () => {
  const { user, currentOrg } = useAuth();
  const { items: events } = useOrgCollection(COLLECTIONS.EVENTS);
  const { items: quotations } = useOrgCollection(COLLECTIONS.QUOTATIONS);
  const { items: invoices } = useOrgCollection(COLLECTIONS.INVOICES);
  const { items: eventTypes } = useOrgCollection(COLLECTIONS.EVENT_TYPES);
  const auditLogs = useAuditLogs({ orgId: currentOrg?.id }).logs;

  const thisMonthEvents = useMemo(
    () => events.filter((e) => isSameMonth(parseISO(e.scheduledDate), new Date())),
    [events]
  );

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return events
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
      )
      .slice(0, 5);
  }, [events]);

  const pendingInvoices = invoices.filter(
    (i) => i.status === 'SENT' || i.status === 'DRAFT' || i.status === 'OVERDUE'
  );
  const openQuotations = quotations.filter(
    (q) => q.status === 'DRAFT' || q.status === 'SENT' || q.status === 'ACCEPTED'
  );

  const eventTypeById = useMemo(
    () => Object.fromEntries(eventTypes.map((t) => [t.id, t])),
    [eventTypes]
  );

  return (
    <PageTransition>
      <PageHeader
        title={`Welcome, ${user?.displayName?.split(' ')[0] || ''}`}
        subtitle={`Here's what's happening in ${currentOrg?.name || 'your organization'}.`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Events this month"
          value={<CountUp value={thisMonthEvents.length} />}
          icon={CalendarDays}
          color="blue"
        />
        <StatCard
          title="Upcoming (30 days)"
          value={<CountUp value={upcomingEvents.length} />}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Pending invoices"
          value={<CountUp value={pendingInvoices.length} />}
          icon={Receipt}
          color="red"
        />
        <StatCard
          title="Open quotations"
          value={<CountUp value={openQuotations.length} />}
          icon={FileText}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming events"
              description="Schedule your next event to get started."
              action={{ label: 'New Event', onClick: () => (window.location.href = '/events/new') }}
            />
          ) : (
            <ul className="space-y-2">
              {upcomingEvents.map((e, i) => {
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

        <Card>
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
            <p className="text-sm text-app-text-muted text-center py-6">
              No activity yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {auditLogs.slice(0, 10).map((log) => {
                return (
                  <li key={log.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-app-bg-tertiary flex items-center justify-center flex-shrink-0">
                      {log.action === 'CREATED' ? (
                        <Plus size={12} className="text-app-success" />
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
                        <span className="text-app-text-primary">
                          {log.entityName}
                        </span>
                      </p>
                      <p className="text-xs text-app-text-muted mt-0.5">
                        {formatRelative(log.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-display font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/events/new">
            <button className="px-4 py-2.5 rounded-xl bg-app-accent text-white text-sm font-medium hover:bg-app-accent-dark transition flex items-center gap-2">
              <Plus size={16} /> New Event
            </button>
          </Link>
          <Link to="/quotations/new">
            <button className="px-4 py-2.5 rounded-xl border border-app-border bg-app-bg-secondary text-sm font-medium hover:bg-app-bg-tertiary transition flex items-center gap-2">
              <Plus size={16} /> New Quotation
            </button>
          </Link>
          <Link to="/invoices/new">
            <button className="px-4 py-2.5 rounded-xl border border-app-border bg-app-bg-secondary text-sm font-medium hover:bg-app-bg-tertiary transition flex items-center gap-2">
              <Plus size={16} /> New Invoice
            </button>
          </Link>
        </div>
      </Card>
    </PageTransition>
  );
};

export default DashboardPage;
