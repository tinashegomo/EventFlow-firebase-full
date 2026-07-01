import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ClipboardList, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection } from '../../hooks/useOrgCollection';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { COLLECTIONS } from '../../firebase/collections';
import {
  PageHeader,
  Card,
  Badge,
  Input,
  Select,
  EmptyState,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { formatDateTime, formatRelative } from '../../utils/dateHelpers';

const ENTITY_TYPES = ['EVENT', 'EVENT_TYPE', 'INVENTORY_ITEM', 'QUOTATION', 'INVOICE', 'USER', 'ORGANIZATION'];
const ACTIONS = ['CREATED', 'UPDATED', 'DELETED', 'PROMOTED', 'DEMOTED', 'CONVERTED', 'STATUS_CHANGED'];

const AuditLogPage = () => {
  const { currentOrg } = useAuth();
  const { logs, loading: logsLoading, error: logsError } = useAuditLogs({ orgId: currentOrg?.id, max: 200 });
  const { items: users } = useOrgCollection(COLLECTIONS.USERS);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entityTypes, setEntityTypes] = useState([]);
  const [actions, setActions] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const d = l.createdAt?.toDate ? l.createdAt.toDate() : (l.createdAt ? new Date(l.createdAt) : null);
      const date = d ? d.toISOString().split('T')[0] : null;
      const matchFrom = !fromDate || (date && date >= fromDate);
      const matchTo = !toDate || (date && date <= toDate);
      const matchType = entityTypes.length === 0 || entityTypes.includes(l.entityType);
      const matchAction = actions.length === 0 || actions.includes(l.action);
      const matchUser = !userFilter || l.userId === userFilter;
      return matchFrom && matchTo && matchType && matchAction && matchUser;
    });
  }, [logs, fromDate, toDate, entityTypes, actions, userFilter]);

  const toggleEntity = (t) => {
    setEntityTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  const toggleAction = (a) => {
    setActions((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const renderChanges = (log) => {
    if (log.details) {
      return <p className="text-sm text-app-text-primary">{log.details}</p>;
    }
    return <p className="text-sm text-app-text-muted">No details.</p>;
  };

  return (
    <PageTransition>
      <PageHeader
        title="Audit Log"
        subtitle="Every change made across your organization."
      />

      <Card className="mb-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Select
            label="Performed By"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="All users"
            options={users.map((u) => ({
              value: u.id,
              label: u.displayName || u.email,
            }))}
          />
          <div className="flex items-end">
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setEntityTypes([]);
                setActions([]);
                setUserFilter('');
              }}
              className="text-xs text-app-accent hover:underline"
            >
              Clear all filters
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-app-text-secondary mb-2">Entity Type</p>
          <div className="flex flex-wrap gap-1">
            {ENTITY_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => toggleEntity(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  entityTypes.includes(t)
                    ? 'bg-app-accent-light text-app-accent-dark border-app-accent'
                    : 'border-app-border hover:bg-app-bg-tertiary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-app-text-secondary mb-2">Action</p>
          <div className="flex flex-wrap gap-1">
            {ACTIONS.map((a) => (
              <button
                key={a}
                onClick={() => toggleAction(a)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  actions.includes(a)
                    ? 'bg-app-accent-light text-app-accent-dark border-app-accent'
                    : 'border-app-border hover:bg-app-bg-tertiary'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {logsError ? (
        <Card className="border border-app-danger/30 bg-app-danger/5">
          <div className="flex items-start gap-3 p-2">
            <AlertTriangle className="text-app-danger flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm font-medium text-app-danger mb-1">
                Couldn&apos;t load the audit log
              </p>
              <p className="text-xs text-app-text-secondary mb-3">
                {logsError.code === 'permission-denied'
                  ? 'Your account does not have permission to read audit logs. Check Firestore security rules.'
                  : logsError.message || 'An unknown error occurred.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs font-medium text-app-accent hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </Card>
      ) : logsLoading ? (
        <Card>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-app-bg-tertiary animate-pulse"
              />
            ))}
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="No audit entries"
            description="No actions match your filters, or there hasn't been any activity yet."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <Card key={log.id} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full text-left p-4 hover:bg-app-bg-tertiary flex items-center gap-3"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="text-xs text-app-text-muted font-mono w-44 flex-shrink-0">
                    {formatDateTime(log.createdAt)}
                  </span>
                  <Badge status={log.action} />
                  <Badge status={log.entityType} />
                  <span className="text-sm font-medium flex-1 truncate">{log.entityName}</span>
                  <span className="text-xs text-app-text-muted hidden sm:inline">
                    {log.userName || 'Unknown'} · {formatRelative(log.createdAt)}
                  </span>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-app-border"
                    >
                      <div className="p-4 bg-app-bg-primary">
                        {renderChanges(log)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
};

export default AuditLogPage;
