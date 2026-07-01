import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Receipt, Search, CheckCircle2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection } from '../../hooks/useOrgCollection';
import { COLLECTIONS } from '../../firebase/collections';
import { INVOICE_STATUSES } from '../../utils/business';
import { checkAndUpdateOverdueInvoices, markInvoiceAsPaid } from '../../utils/invoiceHelpers';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  ConfirmDialog,
  Input,
  Select,
  EmptyState,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { deleteDocById, updateDocFields, fetchDoc } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { formatDate, formatCurrency } from '../../utils/dateHelpers';
import { downloadInvoicePdf } from '../../utils/pdfGenerator';

const InvoicesPage = () => {
  const { currentOrg, user } = useAuth();
  const navigate = useNavigate();
  const { items: invoices } = useOrgCollection(COLLECTIONS.INVOICES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (currentOrg?.id) {
      checkAndUpdateOverdueInvoices(currentOrg.id);
    }
  }, [currentOrg?.id]);

  const filtered = useMemo(() => {
    return invoices
      .filter((i) => {
        const matchSearch =
          !search ||
          (i.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
          (i.invoiceNumber || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || i.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => (b.invoiceNumber || '').localeCompare(a.invoiceNumber || ''));
  }, [invoices, search, statusFilter]);

  const handleDelete = async (item) => {
    if (!currentOrg) return;
    await deleteDocById(COLLECTIONS.INVOICES, item.id);
    if (item.quotationId) {
      const q = await fetchDoc(COLLECTIONS.QUOTATIONS, item.quotationId);
      if (q) {
        await updateDocFields(COLLECTIONS.QUOTATIONS, q.id, {
          status: 'ACCEPTED',
          convertedToInvoiceId: null,
        });
      }
    }
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'DELETED',
      entityType: 'INVOICE',
      entityId: item.id,
      entityName: item.invoiceNumber,
      details: `Deleted invoice ${item.invoiceNumber}`,
    });
    toast.success('Invoice deleted');
  };

  const handleMarkPaid = async (item) => {
    if (!currentOrg) return;
    await markInvoiceAsPaid(item.id, user?.uid);
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'STATUS_CHANGED',
      entityType: 'INVOICE',
      entityId: item.id,
      entityName: item.invoiceNumber,
      details: `Marked invoice ${item.invoiceNumber} as paid`,
    });
    toast.success('Invoice marked as paid');
  };

  const SourceLabel = ({ invoiceId }) => {
    const [label, setLabel] = useState('Direct');
    useEffect(() => {
      const inv = invoices.find((x) => x.id === invoiceId);
      if (!inv?.quotationId) { setLabel('Direct'); return; }
      fetchDoc(COLLECTIONS.QUOTATIONS, inv.quotationId).then((q) => {
        setLabel(`From ${q?.quotationNumber || 'QUO'}`);
      });
    }, [invoiceId, invoices]);
    return <>{label}</>;
  };

  return (
    <PageTransition>
      <PageHeader
        title="Invoices"
        subtitle="Manage and track invoices sent to clients."
        actions={
          <Link to="/invoices/new">
            <Button leftIcon={<Plus size={16} />}>New Invoice</Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Search by client or #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All statuses"
            options={INVOICE_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </Card>

      {invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Create your first invoice to bill a client."
            action={{ label: 'New Invoice', onClick: () => navigate('/invoices/new') }}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((i) => {
            return (
              <Card key={i.id} className="hover:border-app-accent">
                <div className="flex items-center gap-3 flex-wrap">
                  <Link to={`/invoices/${i.id}`} className="font-mono text-sm font-semibold text-app-accent hover:underline">
                    {i.invoiceNumber}
                  </Link>
                  <span className="text-sm font-medium flex-1 min-w-0 truncate">{i.clientName}</span>
                  <Badge status={i.status} />
                  <span className="text-sm text-app-text-muted hidden sm:inline">
                    Due {formatDate(i.dueDate)}
                  </span>
                  <span className="text-xs text-app-text-muted hidden md:inline px-2 py-0.5 rounded-md bg-app-bg-tertiary">
                    <SourceLabel invoiceId={i.id} />
                  </span>
                  <span className="font-mono font-semibold text-app-text-primary">
                    {formatCurrency(i.totalAmount)}
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => downloadInvoicePdf(i, currentOrg)}
                      className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-accent"
                      title="Download PDF"
                    >
                      <Download size={16} />
                    </button>
                    {i.status === 'SENT' && (
                      <button
                        onClick={() => handleMarkPaid(i)}
                        className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-success"
                        title="Mark as Paid"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <Link to={`/invoices/${i.id}/edit`}>
                      <button className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted">
                        <Pencil size={16} />
                      </button>
                    </Link>
                    <button
                      onClick={() => setConfirm(i)}
                      className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card>
              <p className="text-center text-sm text-app-text-muted py-8">
                No invoices match your filters.
              </p>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        title={`Delete ${confirm?.invoiceNumber}?`}
        message="This action cannot be undone."
        confirmLabel="Delete"
      />
    </PageTransition>
  );
};

export default InvoicesPage;
