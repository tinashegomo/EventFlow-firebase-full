import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Tag,
  History,
  Calendar,
  Users,
  ChevronRight,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDoc, useOrgCollection } from '../../hooks/useOrgCollection';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  EmptyState,
  ConfirmDialog,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { COLLECTIONS } from '../../firebase/collections';
import { deleteDocById } from '../../firebase/db';
import { db } from '../../firebase/config';
import { writeAuditLog } from '../../utils/audit';
import { formatDate, formatDateTime, formatCurrency, formatRelative } from '../../utils/dateHelpers';
import { query, where, orderBy, collection, getDocs } from 'firebase/firestore';

const IconRenderer = ({ name, size = 22 }) => {
  const Icon = LucideIcons[name] || Tag;
  return <Icon size={size} />;
};

const useAuditLogs = (orgId, entityType, entityId) => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if (!orgId || !entityId) {
      setLogs([]);
      return;
    }
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      where('organizationId', '==', orgId),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc'),
    );
    getDocs(q).then((snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [orgId, entityType, entityId]);
  return logs;
};

const EventTypeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, user, isAdmin } = useAuth();
  const { data: eventType, loading } = useDoc(COLLECTIONS.EVENT_TYPES, id);
  const { items: allEvents } = useOrgCollection(COLLECTIONS.EVENTS);
  const logs = useAuditLogs(currentOrg?.id, 'EVENT_TYPE', id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const events = allEvents.filter((e) => e.eventTypeId === id);

  const sortedTiers = useMemo(() => {
    if (!eventType) return [];
    return [...(eventType.pricingTiers || [])].sort(
      (a, b) => a.guestCount - b.guestCount
    );
  }, [eventType]);

  const handleDelete = async () => {
    if (!currentOrg || !eventType) return;
    if (events.length > 0) {
      toast.error('Cannot delete — this event type is used by existing events.');
      return;
    }
    await deleteDocById(COLLECTIONS.EVENT_TYPES, eventType.id);
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'DELETED',
      entityType: 'EVENT_TYPE',
      entityId: eventType.id,
      entityName: eventType.name,
      details: `Deleted event type ${eventType.name}`,
    });
    toast.success('Event type deleted');
    navigate('/event-types');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!eventType) {
    return (
      <PageTransition>
        <PageHeader
          title="Event Type"
          actions={
            <Link to="/event-types">
              <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
            </Link>
          }
        />
        <Card>
          <EmptyState title="Event type not found" description="It may have been deleted." />
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title={eventType.name}
        subtitle={eventType.description || 'Event type details.'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/event-types">
              <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link to={`/event-types/${eventType.id}/edit`}>
                  <Button leftIcon={<Pencil size={16} />}>Edit</Button>
                </Link>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: `${eventType.color}20`,
                  color: eventType.color,
                }}
              >
                <IconRenderer name={eventType.icon} size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-semibold">{eventType.name}</h2>
                {eventType.description && (
                  <p className="text-sm text-app-text-secondary mt-1">
                    {eventType.description}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-4 border-t border-app-border">
              <div>
                <p className="text-xs text-app-text-muted mb-1">Color</p>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-5 h-5 rounded-md"
                    style={{ backgroundColor: eventType.color }}
                  />
                  <span className="font-mono text-xs">{eventType.color}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1">Created</p>
                <p className="font-medium">{formatDate(eventType.createdAt)}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <Tag size={18} /> Pricing Tiers
              <span className="ml-1 text-xs font-normal text-app-text-muted">
                ({sortedTiers.length})
              </span>
            </h3>
            {sortedTiers.length === 0 ? (
              <p className="text-sm text-app-text-muted text-center py-4">No pricing tiers defined.</p>
            ) : (
              <div className="rounded-xl border border-app-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-app-bg-tertiary">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Guest Count</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Description</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTiers.map((t) => (
                      <tr key={t.id} className="border-t border-app-border">
                        <td className="px-3 py-2 font-mono">{t.guestCount}</td>
                        <td className="px-3 py-2 text-app-text-secondary">
                          {t.description || '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {formatCurrency(t.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <Calendar size={18} /> Events Using This Type
              <span className="ml-1 text-xs font-normal text-app-text-muted">({events.length})</span>
            </h3>
            {events.length === 0 ? (
              <p className="text-sm text-app-text-muted text-center py-4">No events use this type yet.</p>
            ) : (
              <ul className="divide-y divide-app-border">
                {events
                  .sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || ''))
                  .slice(0, 10)
                  .map((e) => (
                    <li key={e.id}>
                      <Link
                        to={`/events/${e.id}`}
                        className="flex items-center justify-between p-3 hover:bg-app-bg-tertiary rounded-lg transition group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{e.title}</p>
                          <p className="text-xs text-app-text-muted flex items-center gap-2 mt-0.5">
                            <Calendar size={11} /> {formatDate(e.scheduledDate)}
                            <span>·</span>
                            <Users size={11} /> {e.guestCount} guests
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge status={e.status} />
                          <ChevronRight size={16} className="text-app-text-muted group-hover:translate-x-0.5 transition" />
                        </div>
                      </Link>
                    </li>
                  ))}
                {events.length > 10 && (
                  <li className="p-3 text-center text-xs text-app-text-muted">
                    +{events.length - 10} more
                  </li>
                )}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <History size={18} /> Audit History
            </h3>
            {logs.length === 0 ? (
              <p className="text-sm text-app-text-muted text-center py-4">No history yet.</p>
            ) : (
              <ul className="space-y-3">
                {logs.map((log) => (
                  <motion.li
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-l-2 border-app-border pl-3"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge status={log.action} />
                      <span className="text-xs text-app-text-muted">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{log.userName || 'Unknown'}</p>
                    <p className="text-xs text-app-text-muted">{formatRelative(log.createdAt)}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`Delete "${eventType.name}"?`}
        message="This action cannot be undone."
        confirmLabel="Delete"
      />
    </PageTransition>
  );
};

export default EventTypeDetailPage;
