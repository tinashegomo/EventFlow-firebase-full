import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection } from '../../hooks/useOrgCollection';
import { PageHeader, Table, Badge, ConfirmDialog } from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { COLLECTIONS } from '../../firebase/collections';
import { ROLES } from '../../constants/roles';
import { updateDocFields } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { formatDate } from '../../utils/dateHelpers';

const UsersPage = () => {
  const { currentOrg, user } = useAuth();
  const { items: users, loading: usersLoading, error: usersError } = useOrgCollection(COLLECTIONS.USERS);
  const [confirm, setConfirm] = useState(null);

  const adminCount = users.filter((u) => u.role === ROLES.ADMIN).length;

  const handlePromote = async (u) => {
    if (!currentOrg || !user) return;
    await updateDocFields(COLLECTIONS.USERS, u.id, { role: ROLES.ADMIN });
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user.uid,
      userName: user.displayName,
      action: 'PROMOTED',
      entityType: 'USER',
      entityId: u.id,
      entityName: u.displayName,
      details: `Promoted ${u.displayName} to Admin`,
    });
    toast.success(`${u.displayName} has been promoted to Admin`);
  };

  const handleDemote = async (u) => {
    if (adminCount <= 1) {
      toast.error('Cannot demote the only admin');
      return;
    }
    if (!currentOrg || !user) return;
    await updateDocFields(COLLECTIONS.USERS, u.id, { role: ROLES.STAFF });
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user.uid,
      userName: user.displayName,
      action: 'DEMOTED',
      entityType: 'USER',
      entityId: u.id,
      entityName: u.displayName,
      details: `Demoted ${u.displayName} to Staff`,
    });
    toast.success(`${u.displayName} has been demoted to Staff`);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <Link
            to={`/users/${row.id}`}
            className="font-medium hover:text-app-accent"
          >
            {row.displayName}
          </Link>
          {row.id === user?.uid && (
            <span className="ml-2 text-xs text-app-text-muted">(You)</span>
          )}
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge status={row.role} />,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => <span className="text-app-text-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        if (row.id === user?.uid) {
          return <span className="text-xs text-app-text-muted">—</span>;
        }
        if (row.role === ROLES.STAFF) {
          return (
            <button
              onClick={() => handlePromote(row)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-app-accent hover:underline"
            >
              <ArrowUpCircle size={14} /> Promote to Admin
            </button>
          );
        }
        if (row.role === ROLES.ADMIN && adminCount > 1) {
          return (
            <button
              onClick={() => setConfirm({ type: 'demote', user: row })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-app-danger hover:underline"
            >
              <ArrowDownCircle size={14} /> Demote to Staff
            </button>
          );
        }
        return (
          <span
            className="inline-flex items-center gap-1.5 text-xs text-app-text-muted cursor-not-allowed"
            title="Only admin"
          >
            <AlertCircle size={14} /> Cannot Demote
          </span>
        );
      },
    },
  ];

  return (
    <PageTransition>
      <PageHeader
        title="Team"
        subtitle={`${users.length} member${users.length === 1 ? '' : 's'} in ${currentOrg?.name || 'your organization'}`}
      />
      <Table
        columns={columns}
        data={users}
        isLoading={usersLoading}
        error={usersError}
        onRetry={() => window.location.reload()}
        emptyMessage="No team members yet."
      />
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm) await handleDemote(confirm.user);
          setConfirm(null);
        }}
        title="Demote to Staff?"
        message={`${confirm?.user?.displayName} will lose admin privileges.`}
        confirmLabel="Demote"
      />
    </PageTransition>
  );
};

export default UsersPage;
