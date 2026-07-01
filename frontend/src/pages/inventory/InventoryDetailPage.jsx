import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Package,
  History,
  Calendar,
  ChevronRight,
  Layers,
} from 'lucide-react';
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

const useAuditLogs = (orgId, entityType, entityId) => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    if (!orgId || !entityId) { setLogs([]); return; }
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      where('organizationId', '==', orgId),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('createdAt', 'desc'),
    );
    getDocs(q).then((snap) => setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [orgId, entityType, entityId]);
  return logs;
};

const InventoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, user, isAdmin } = useAuth();
  const { data: item, loading } = useDoc(COLLECTIONS.INVENTORY, id);
  const { items: allEvents } = useOrgCollection(COLLECTIONS.EVENTS);
  const logs = useAuditLogs(currentOrg?.id, 'INVENTORY_ITEM', id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const events = useMemo(
    () => allEvents
      .filter((e) => (e.attachedItems || []).some((a) => a.inventoryItemId === id))
      .sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || '')),
    [allEvents, id]
  );

  const totalStock = useMemo(
    () => (item?.variants || []).reduce((sum, v) => sum + (Number(v.quantityInStock) || 0), 0),
    [item]
  );

  const totalValue = useMemo(
    () => (item?.variants || []).reduce(
      (sum, v) => sum + (Number(v.quantityInStock) || 0) * (Number(v.pricePerUnit) || 0),
      0
    ),
    [item]
  );

  const handleDelete = async () => {
    if (!currentOrg || !item) return;
    if (events.length > 0) {
      toast.error('Cannot delete — this item is attached to existing events.');
      return;
    }
    await deleteDocById(COLLECTIONS.INVENTORY, item.id);
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'DELETED',
      entityType: 'INVENTORY_ITEM',
      entityId: item.id,
      entityName: item.name,
      details: `Deleted inventory item ${item.name}`,
    });
    toast.success('Inventory item deleted');
    navigate('/inventory');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!item) {
    return (
      <PageTransition>
        <PageHeader
          title="Inventory Item"
          actions={
            <Link to="/inventory">
              <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back</Button>
            </Link>
          }
        />
        <Card>
          <EmptyState title="Item not found" description="It may have been deleted." />
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title={item.name}
        subtitle={item.description || 'Inventory item details.'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/inventory">
              <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back</Button>
            </Link>
            {isAdmin && (
              <>
                <Link to={`/inventory/${item.id}/edit`}>
                  <Button leftIcon={<Pencil size={16} />}>Edit</Button>
                </Link>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-app-accent-light/40 text-app-accent-dark flex-shrink-0">
                <Package size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-display font-semibold">{item.name}</h2>
                {item.description && (
                  <p className="text-sm text-app-text-secondary mt-1">{item.description}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm pt-4 border-t border-app-border">
              <div>
                <p className="text-xs text-app-text-muted mb-1">Category</p>
                <p className="font-medium">{item.category || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1">Unit</p>
                <p className="font-medium capitalize">{item.unit || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1">Variants</p>
                <p className="font-medium font-mono">{(item.variants || []).length}</p>
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1">Created</p>
                <p className="font-medium">{formatDate(item.createdAt)}</p>
              </div>
            </div>
            {(item.variants || []).length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-app-border">
                <div className="p-3 rounded-xl bg-app-bg-tertiary">
                  <p className="text-xs text-app-text-muted">Total Stock</p>
                  <p className="text-xl font-mono font-semibold">{totalStock}</p>
                </div>
                <div className="p-3 rounded-xl bg-app-bg-tertiary">
                  <p className="text-xs text-app-text-muted">Total Value</p>
                  <p className="text-xl font-mono font-semibold">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <Layers size={18} /> Variants
              <span className="ml-1 text-xs font-normal text-app-text-muted">({(item.variants || []).length})</span>
            </h3>
            {(item.variants || []).length === 0 ? (
              <p className="text-sm text-app-text-muted text-center py-4">No variants — item is sold as a single SKU.</p>
            ) : (
              <div className="rounded-xl border border-app-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-app-bg-tertiary">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Size / Variant</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Stock</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Price</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.variants.map((v) => (
                      <tr key={v.id} className="border-t border-app-border">
                        <td className="px-3 py-2 font-medium">{v.size || 'Default'}</td>
                        <td className="px-3 py-2 text-right font-mono">{v.quantityInStock || 0}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(v.pricePerUnit || 0)}</td>
                        <td className="px-3 py-2 text-right font-mono font-medium">
                          {formatCurrency((v.quantityInStock || 0) * (v.pricePerUnit || 0))}
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
              <Calendar size={18} /> Used in Events
              <span className="ml-1 text-xs font-normal text-app-text-muted">({events.length})</span>
            </h3>
            {events.length === 0 ? (
              <p className="text-sm text-app-text-muted text-center py-4">Not attached to any events yet.</p>
            ) : (
              <ul className="divide-y divide-app-border">
                {events.slice(0, 10).map((e) => {
                  const totalQty = (e.attachedItems || [])
                    .filter((a) => a.inventoryItemId === id)
                    .reduce((s, a) => s + (a.quantity || 0), 0);
                  return (
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
                            <span>Qty: <span className="font-mono">{totalQty}</span></span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge status={e.status} />
                          <ChevronRight size={16} className="text-app-text-muted group-hover:translate-x-0.5 transition" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
                {events.length > 10 && (
                  <li className="p-3 text-center text-xs text-app-text-muted">+{events.length - 10} more</li>
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
                      <span className="text-xs text-app-text-muted">{formatDateTime(log.createdAt)}</span>
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
        title={`Delete "${item.name}"?`}
        message="This action cannot be undone."
        confirmLabel="Delete"
      />
    </PageTransition>
  );
};

export default InventoryDetailPage;
