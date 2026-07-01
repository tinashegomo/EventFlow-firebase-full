import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import { useDoc, useOrgCollection } from '../../hooks/useOrgCollection';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { COLLECTIONS } from '../../firebase/collections';
import {
  PageHeader,
  Card,
  Badge,
  EmptyState,
  Button,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { formatDate, formatDateTime, formatRelative } from '../../utils/dateHelpers';

const UserDetailPage = () => {
  const { id } = useParams();
  const { currentOrg } = useAuth();
  const { data: user, loading } = useDoc(COLLECTIONS.USERS, id);
  const { items: orgEvents } = useOrgCollection(COLLECTIONS.EVENTS);
  const allLogs = useAuditLogs({ orgId: currentOrg?.id, max: 500 }).logs;
  const logs = useMemo(() => allLogs.filter((l) => l.userId === id), [allLogs, id]);

  const stats = useMemo(() => {
    if (!user) return null;
    const eventsCreated = orgEvents.filter((e) => e.createdBy === user.id).length;
    const paymentsRecorded = logs.filter((l) => l.action === 'PAYMENT_RECORDED').length;
    const totalActions = logs.length;
    return { eventsCreated, paymentsRecorded, totalActions };
  }, [user, orgEvents, logs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <PageHeader
          title="Team Member"
          actions={
            <Link to="/users">
              <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back</Button>
            </Link>
          }
        />
        <Card>
          <EmptyState title="User not found" description="This team member may have been removed." />
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title={user.displayName}
        subtitle={`${user.role === ROLES.ADMIN ? 'Administrator' : 'Team member'} · ${currentOrg?.name || ''}`}
        actions={
          <Link to="/users">
            <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-app-accent-light text-app-accent-dark flex items-center justify-center text-xl font-display font-semibold flex-shrink-0">
                {user.displayName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-display font-semibold">
                  {user.displayName}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge status={user.role} />
                  <span className="text-xs text-app-text-muted">
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-4 mt-4 border-t border-app-border">
              <div>
                <p className="text-xs text-app-text-muted mb-1 flex items-center gap-1">
                  <Mail size={12} /> Email
                </p>
                <p className="font-medium break-all">{user.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1 flex items-center gap-1">
                  <Phone size={12} /> Phone
                </p>
                <p className="font-medium">{user.phone || user.clientPhone || '—'}</p>
              </div>
            </div>
          </Card>

          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="text-center">
                <Activity className="mx-auto mb-2 text-app-accent" size={20} />
                <p className="text-2xl font-mono font-semibold">{stats.totalActions}</p>
                <p className="text-xs text-app-text-muted mt-1">Total Actions</p>
              </Card>
              <Card className="text-center">
                <Calendar className="mx-auto mb-2 text-app-accent" size={20} />
                <p className="text-2xl font-mono font-semibold">{stats.eventsCreated}</p>
                <p className="text-xs text-app-text-muted mt-1">Events Created</p>
              </Card>
              <Card className="text-center">
                <Shield className="mx-auto mb-2 text-app-accent" size={20} />
                <p className="text-2xl font-mono font-semibold">{stats.paymentsRecorded}</p>
                <p className="text-xs text-app-text-muted mt-1">Payments Recorded</p>
              </Card>
            </div>
          )}

          <Card>
            <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <Activity size={18} /> Recent Activity
              <span className="ml-1 text-xs font-normal text-app-text-muted">
                ({logs.length})
              </span>
            </h3>
            {logs.length === 0 ? (
              <p className="text-sm text-app-text-muted text-center py-4">
                No activity recorded yet.
              </p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {logs.slice(0, 30).map((log) => (
                  <li
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-app-bg-tertiary/50 hover:bg-app-bg-tertiary transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge status={log.action} />
                        <span className="text-xs text-app-text-muted">
                          {formatDateTime(log.performedAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-1 truncate">{log.entityLabel}</p>
                      {log.entityId && (
                        <p className="text-xs text-app-text-muted">
                          {log.entityType.replace(/_/g, ' ').toLowerCase()}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-app-text-muted whitespace-nowrap">
                      {formatRelative(log.performedAt)}
                    </span>
                  </li>
                ))}
                {logs.length > 30 && (
                  <li className="text-center text-xs text-app-text-muted py-2">
                    +{logs.length - 30} more in the audit log
                  </li>
                )}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <UserIcon size={18} /> Profile
            </h3>
            <dl className="text-sm space-y-3">
              <div>
                <dt className="text-xs text-app-text-muted">User ID</dt>
                <dd className="font-mono text-xs break-all mt-0.5">{user.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-app-text-muted">Organization</dt>
                <dd className="font-medium mt-0.5">{currentOrg?.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-app-text-muted">Role</dt>
                <dd className="mt-0.5"><Badge status={user.role} /></dd>
              </div>
              <div>
                <dt className="text-xs text-app-text-muted">Joined</dt>
                <dd className="font-medium mt-0.5">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default UserDetailPage;
