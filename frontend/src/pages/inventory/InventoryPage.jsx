import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection } from '../../hooks/useOrgCollection';
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  ConfirmDialog,
  Input,
  Select,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { COLLECTIONS } from '../../firebase/collections';
import { deleteDocById } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { formatCurrency } from '../../utils/dateHelpers';

const InventoryPage = () => {
  const { currentOrg, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { items } = useOrgCollection(COLLECTIONS.INVENTORY);
  const { items: events } = useOrgCollection(COLLECTIONS.EVENTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchSearch =
        !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.description || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || i.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [items, search, categoryFilter]);

  const handleDelete = async (item) => {
    if (!currentOrg) return;
    const inUse = events.some((e) =>
      (e.attachedItems || []).some((a) => a.inventoryItemId === item.id)
    );
    if (inUse) {
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
    toast.success('Item deleted');
  };

  return (
    <PageTransition>
      <PageHeader
        title="Inventory"
        subtitle="Manage your physical inventory items and variants."
        actions={
          isAdmin && (
            <Link to="/inventory/new">
              <Button leftIcon={<Plus size={16} />}>Add Item</Button>
            </Link>
          )
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="All categories"
            options={categories.map((c) => ({ value: c, label: c }))}
          />
          {(search || categoryFilter) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="No inventory yet"
            description="Add items like tents, chairs, and tableware to attach them to events."
            action={
              isAdmin
                ? { label: 'Add Item', onClick: () => navigate('/inventory/new') }
                : null
            }
          />
        </Card>
      ) : (
        <div className="rounded-2xl border border-app-border bg-app-bg-secondary overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-app-bg-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Variants</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Total Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Unit</th>
                  {isAdmin && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const totalStock = (item.variants || []).reduce(
                    (sum, v) => sum + (Number(v.quantityInStock) || 0),
                    0
                  );
                  const prices = (item.variants || [])
                    .map((v) => Number(v.pricePerUnit) || 0)
                    .filter((p) => p > 0);
                  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                  const priceLabel =
                    prices.length === 0
                      ? '—'
                      : minPrice === maxPrice
                        ? formatCurrency(minPrice)
                        : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/inventory/${item.id}`)}
                      className={`border-t border-app-border hover:bg-app-bg-tertiary transition cursor-pointer ${
                        idx % 2 === 1 ? 'bg-app-bg-primary/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link to={`/inventory/${item.id}`} className="hover:text-app-accent" onClick={(e) => e.stopPropagation()}>
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-app-text-secondary">{item.category}</td>
                      <td className="px-4 py-3 font-mono text-app-text-primary">{priceLabel}</td>
                      <td className="px-4 py-3 text-app-text-secondary">{(item.variants || []).length}</td>
                      <td className="px-4 py-3 font-mono">{totalStock}</td>
                      <td className="px-4 py-3 text-app-text-secondary">{item.unit}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            <Link to={`/inventory/${item.id}/edit`}>
                              <button className="p-1.5 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted">
                                <Pencil size={14} />
                              </button>
                            </Link>
                            <button
                              onClick={() => setConfirm(item)}
                              className="p-1.5 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-danger"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-sm text-app-text-muted">
                      No items match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-app-border">
            {filtered.map((item) => {
              const totalStock = (item.variants || []).reduce(
                (sum, v) => sum + (Number(v.quantityInStock) || 0),
                0
              );
              return (
                <div
                  key={item.id}
                  className="p-4 space-y-1 cursor-pointer active:bg-app-bg-tertiary"
                  onClick={() => navigate(`/inventory/${item.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-app-text-muted">{item.category} · {item.unit}</p>
                    </div>
                    <span className="font-mono text-sm">{totalStock}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/inventory/${item.id}/edit`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">Edit</Button>
                      </Link>
                      <Button size="sm" variant="danger" onClick={() => setConfirm(item)} className="flex-1">Delete</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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

export default InventoryPage;
