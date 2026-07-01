import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  List as ListIcon,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection } from '../../hooks/useOrgCollection';
import { COLLECTIONS } from '../../firebase/collections';
import { EVENT_STATUSES } from '../../utils/business';
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  ConfirmDialog,
  Input,
  Select,
  Badge,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { deleteDocById } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { formatDateTime } from '../../utils/dateHelpers';

const EventsPage = () => {
  const { currentOrg, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { items: events } = useOrgCollection(COLLECTIONS.EVENTS);
  const { items: eventTypes } = useOrgCollection(COLLECTIONS.EVENT_TYPES);
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [popoverDay, setPopoverDay] = useState(null);

  const eventTypeById = useMemo(
    () => Object.fromEntries(eventTypes.map((t) => [t.id, t])),
    [eventTypes]
  );

  const filtered = useMemo(() => {
    return events
      .filter((e) => {
        const matchSearch =
          !search ||
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          (e.clientName || '').toLowerCase().includes(search.toLowerCase());
        const matchType = !typeFilter || e.eventTypeId === typeFilter;
        const matchStatus = !statusFilter || e.status === statusFilter;
        const matchFrom = !fromDate || e.scheduledDate >= fromDate;
        const matchTo = !toDate || e.scheduledDate <= toDate;
        return matchSearch && matchType && matchStatus && matchFrom && matchTo;
      })
      .sort((a, b) => {
        const cmp = a.scheduledDate.localeCompare(b.scheduledDate);
        return sortAsc ? cmp : -cmp;
      });
  }, [events, search, typeFilter, statusFilter, fromDate, toDate, sortAsc]);

  const handleDelete = async (item) => {
    if (!currentOrg) return;
    await deleteDocById(COLLECTIONS.EVENTS, item.id);
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'DELETED',
      entityType: 'EVENT',
      entityId: item.id,
      entityName: item.title,
      details: `Deleted event ${item.title}`,
    });
    toast.success('Event deleted');
  };

  const canEdit = isAdmin;

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!e.scheduledDate) return;
      const key = e.scheduledDate;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  return (
    <PageTransition>
      <PageHeader
        title="Events"
        subtitle="Schedule and manage your events."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-app-border overflow-hidden">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition ${
                  view === 'list'
                    ? 'bg-app-accent text-white'
                    : 'bg-app-bg-secondary text-app-text-secondary hover:bg-app-bg-tertiary'
                }`}
              >
                <ListIcon size={14} /> List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition ${
                  view === 'calendar'
                    ? 'bg-app-accent text-white'
                    : 'bg-app-bg-secondary text-app-text-secondary hover:bg-app-bg-tertiary'
                }`}
              >
                <CalendarIcon size={14} /> Calendar
              </button>
            </div>
            <Link to="/events/new">
              <Button leftIcon={<Plus size={16} />}>New Event</Button>
            </Link>
          </div>
        }
      />

      {view === 'list' && (
        <>
          <Card className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <Input
                placeholder="Search title or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search size={16} />}
              />
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                placeholder="All types"
                options={eventTypes.map((t) => ({ value: t.id, label: t.name }))}
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="All statuses"
                options={EVENT_STATUSES.map((s) => ({ value: s, label: s }))}
              />
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To"
              />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-app-text-muted">
              <span>Sort by date:</span>
              <button
                onClick={() => setSortAsc((s) => !s)}
                className="px-2 py-1 rounded-md hover:bg-app-bg-tertiary"
              >
                {sortAsc ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          </Card>

          {events.length === 0 ? (
            <Card>
              <EmptyState
                icon={CalendarIcon}
                title="No events yet"
                description="Create your first event to start scheduling."
                action={{ label: 'New Event', onClick: () => navigate('/events/new') }}
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((e, i) => {
                const type = eventTypeById[e.eventTypeId];
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  >
                    <Card className="hover:border-app-accent">
                      <div className="flex items-center gap-4">
                        {type && (
                          <div
                            className="w-1.5 self-stretch rounded-full flex-shrink-0"
                            style={{ backgroundColor: type.color }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-display font-semibold truncate">{e.title}</h3>
                            {type && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                style={{
                                  backgroundColor: `${type.color}20`,
                                  color: type.color,
                                }}
                              >
                                {type.name}
                              </span>
                            )}
                            <Badge status={e.status} />
                          </div>
                          <p className="text-xs text-app-text-muted">
                            {e.clientName} · {formatDateTime(`${e.scheduledDate}T${e.scheduledTime || '00:00'}`)} · {e.guestCount} guests · {e.venue}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link to={`/events/${e.id}`}>
                            <button className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted" aria-label="View">
                              <Eye size={16} />
                            </button>
                          </Link>
                          <Link to={`/events/${e.id}/edit`}>
                            <button className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted" aria-label="Edit">
                              <Pencil size={16} />
                            </button>
                          </Link>
                          {canEdit && (
                            <button
                              onClick={() => setConfirm(e)}
                              className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-danger"
                              aria-label="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <Card>
                  <p className="text-center text-sm text-app-text-muted py-8">
                    No events match your filters.
                  </p>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {view === 'calendar' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth((d) => subMonths(d, 1))}
                className="p-2 rounded-lg border border-app-border hover:bg-app-bg-tertiary"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-2 text-xs rounded-lg border border-app-border hover:bg-app-bg-tertiary"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth((d) => addMonths(d, 1))}
                className="p-2 rounded-lg border border-app-border hover:bg-app-bg-tertiary"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold uppercase tracking-wider text-app-text-muted py-2"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = format(d, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[key] || [];
              const isCurrentMonth = isSameMonth(d, currentMonth);
              const isToday = isSameDay(d, new Date());
              return (
                <div
                  key={key}
                  className={`relative min-h-[90px] md:min-h-[110px] p-1.5 rounded-lg border ${
                    isCurrentMonth
                      ? 'border-app-border bg-app-bg-primary'
                      : 'border-transparent bg-app-bg-tertiary/40 opacity-50'
                  }`}
                >
                  <div
                    className={`text-xs font-semibold mb-1 ${
                      isToday
                        ? 'text-app-accent'
                        : 'text-app-text-primary'
                    }`}
                  >
                    {format(d, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((e) => {
                      const type = eventTypeById[e.eventTypeId];
                      return (
                        <button
                          key={e.id}
                          onClick={() => setPopoverDay({ day: d, events: dayEvents })}
                          className="w-full text-left px-1.5 py-1 rounded text-[10px] truncate hover:opacity-80 transition"
                          style={{
                            backgroundColor: type ? `${type.color}20` : 'var(--color-bg-tertiary)',
                            color: type?.color || 'var(--color-text-primary)',
                          }}
                        >
                          {e.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <button
                        onClick={() => setPopoverDay({ day: d, events: dayEvents })}
                        className="text-[10px] text-app-text-muted hover:underline"
                      >
                        +{dayEvents.length - 2} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <AnimatePresence>
        {popoverDay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPopoverDay(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-app-border bg-app-bg-secondary shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-app-border flex items-center justify-between">
                <h3 className="font-display font-semibold">
                  {format(popoverDay.day, 'EEEE, MMM d, yyyy')}
                </h3>
                <button
                  onClick={() => setPopoverDay(null)}
                  className="text-xs text-app-text-muted hover:underline"
                >
                  Close
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {popoverDay.events.map((e) => {
                  const type = eventTypeById[e.eventTypeId];
                  return (
                    <Link
                      key={e.id}
                      to={`/events/${e.id}`}
                      onClick={() => setPopoverDay(null)}
                      className="block p-3 rounded-xl border border-app-border hover:border-app-accent hover:bg-app-bg-tertiary"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {type && (
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                        )}
                        <p className="font-medium text-sm">{e.title}</p>
                      </div>
                      <p className="text-xs text-app-text-muted">
                        {e.scheduledTime} · {e.venue}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        title={`Delete "${confirm?.title}"?`}
        message="This action cannot be undone."
        confirmLabel="Delete"
      />
    </PageTransition>
  );
};

export default EventsPage;
