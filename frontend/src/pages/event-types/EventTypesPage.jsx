import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Tag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection } from '../../hooks/useOrgCollection';
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  ConfirmDialog,
} from '../../components/ui';
import PageTransition, { StaggerList } from '../../components/layout/PageTransition';
import { COLLECTIONS } from '../../firebase/collections';
import { deleteDocById } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { formatDate, formatCurrency } from '../../utils/dateHelpers';

const IconRenderer = ({ name, size = 22 }) => {
  const Icon = LucideIcons[name] || Tag;
  return <Icon size={size} />;
};

const EventTypesPage = () => {
  const { currentOrg, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { items: eventTypes } = useOrgCollection(COLLECTIONS.EVENT_TYPES);
  const { items: events } = useOrgCollection(COLLECTIONS.EVENTS);
  const [confirm, setConfirm] = useState(null);

  const handleDelete = async (item) => {
    if (!currentOrg) return;
    const inUse = events.some((e) => e.eventTypeId === item.id);
    if (inUse) {
      toast.error('Cannot delete — this event type is used by existing events.');
      return;
    }
    await deleteDocById(COLLECTIONS.EVENT_TYPES, item.id);
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'DELETED',
      entityType: 'EVENT_TYPE',
      entityId: item.id,
      entityName: item.name,
      details: `Deleted event type ${item.name}`,
    });
    toast.success('Event type deleted');
  };

  return (
    <PageTransition>
      <PageHeader
        title="Event Types"
        subtitle="Define categories of events you plan and their pricing."
        actions={
          isAdmin && (
            <Link to="/event-types/new">
              <Button leftIcon={<Plus size={16} />}>New Event Type</Button>
            </Link>
          )
        }
      />
      {eventTypes.length === 0 ? (
        <Card>
          <EmptyState
            icon={Tag}
            title="No event types yet"
            description="Add your first event type to start creating events."
            action={
              isAdmin
                ? { label: 'New Event Type', onClick: () => navigate('/event-types/new') }
                : null
            }
          />
        </Card>
      ) : (
        <StaggerList
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          items={eventTypes}
          renderItem={(t) => {
            const prices = (t.pricingTiers || []).map((p) => p.price).filter(Boolean);
            const min = prices.length ? Math.min(...prices) : 0;
            const max = prices.length ? Math.max(...prices) : 0;
            return (
              <Link to={`/event-types/${t.id}`} className="block group">
                <Card className="relative overflow-hidden h-full transition group-hover:border-app-accent/40">
                  <div
                    className="absolute top-0 left-0 bottom-0 w-1.5"
                    style={{ backgroundColor: t.color }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${t.color}20`,
                        color: t.color,
                      }}
                    >
                      <IconRenderer name={t.icon} size={20} />
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Link to={`/event-types/${t.id}/edit`}>
                          <button
                            className="p-1.5 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-text-primary"
                            aria-label="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => setConfirm(t)}
                          className="p-1.5 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-danger"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-display font-semibold group-hover:text-app-accent transition">
                    {t.name}
                  </h3>
                  {t.description && (
                    <p className="mt-1 text-sm text-app-text-secondary line-clamp-2">
                      {t.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-app-text-muted">
                      {(t.pricingTiers || []).length} pricing tier
                      {(t.pricingTiers || []).length === 1 ? '' : 's'}
                    </span>
                    {prices.length > 0 && (
                      <span className="font-mono text-app-text-primary">
                        {formatCurrency(min)} – {formatCurrency(max)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] text-app-text-muted">
                    Created {formatDate(t.createdAt)}
                  </p>
                </Card>
              </Link>
            );
          }}
        />
      )}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm) await handleDelete(confirm);
          setConfirm(null);
        }}
        title={`Delete "${confirm?.name}"?`}
        message="This action cannot be undone."
        confirmLabel="Delete"
      />
    </PageTransition>
  );
};

export default EventTypesPage;
