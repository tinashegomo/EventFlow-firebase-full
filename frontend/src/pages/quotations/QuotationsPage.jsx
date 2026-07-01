import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, FileText, Search, ArrowRightCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection } from '../../hooks/useOrgCollection';
import { COLLECTIONS } from '../../firebase/collections';
import { QUOTATION_STATUSES } from '../../utils/business';
import { markExpiredQuotations } from '../../utils/quotationHelpers';
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
import { deleteDocById } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { formatDate, formatCurrency } from '../../utils/dateHelpers';
import { downloadQuotationPdf } from '../../utils/pdfGenerator';

const QuotationsPage = () => {
  const { currentOrg, user } = useAuth();
  const navigate = useNavigate();
  const { items: quotations } = useOrgCollection(COLLECTIONS.QUOTATIONS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (currentOrg?.id) {
      markExpiredQuotations(currentOrg.id);
    }
  }, [currentOrg?.id]);

  const filtered = useMemo(() => {
    return quotations
      .filter((q) => {
        const matchSearch =
          !search ||
          (q.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
          (q.quotationNumber || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = !statusFilter || q.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => (b.quotationNumber || '').localeCompare(a.quotationNumber || ''));
  }, [quotations, search, statusFilter]);

  const handleDelete = async (item) => {
    if (!currentOrg) return;
    await deleteDocById(COLLECTIONS.QUOTATIONS, item.id);
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'DELETED',
      entityType: 'QUOTATION',
      entityId: item.id,
      entityName: item.quotationNumber,
      details: `Deleted quotation ${item.quotationNumber}`,
    });
    toast.success('Quotation deleted');
  };

  return (
    <PageTransition>
      <PageHeader
        title="Quotations"
        subtitle="Create and track client quotations."
        actions={
          <Link to="/quotations/new">
            <Button leftIcon={<Plus size={16} />}>New Quotation</Button>
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
            options={QUOTATION_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </Card>

      {quotations.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No quotations yet"
            description="Create your first quotation to send to a client."
            action={{ label: 'New Quotation', onClick: () => navigate('/quotations/new') }}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <Card key={q.id} className="hover:border-app-accent">
              <div className="flex items-center gap-3 flex-wrap">
                <Link to={`/quotations/${q.id}`} className="font-mono text-sm font-semibold text-app-accent hover:underline">
                  {q.quotationNumber}
                </Link>
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{q.clientName}</span>
                <Badge status={q.status} />
                <span className="text-sm text-app-text-muted hidden sm:inline">
                  Valid until {formatDate(q.validUntil)}
                </span>
                <span className="font-mono font-semibold text-app-text-primary">
                  {formatCurrency(q.totalAmount)}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => downloadQuotationPdf(q, currentOrg)}
                    className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-accent"
                    title="Download PDF"
                  >
                    <Download size={16} />
                  </button>
                  {(q.status === 'DRAFT' || q.status === 'ACCEPTED' || q.status === 'SENT') && (
                    <Link to={`/invoices/new?fromQuotation=${q.id}`}>
                      <button
                        className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-accent"
                        title="Convert to Invoice"
                      >
                        <ArrowRightCircle size={16} />
                      </button>
                    </Link>
                  )}
                  <Link to={`/quotations/${q.id}/edit`}>
                    <button className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted" aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                  </Link>
                  <button
                    onClick={() => setConfirm(q)}
                    className="p-2 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-danger"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card>
              <p className="text-center text-sm text-app-text-muted py-8">
                No quotations match your filters.
              </p>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        title={`Delete ${confirm?.quotationNumber}?`}
        message="This action cannot be undone."
        confirmLabel="Delete"
      />
    </PageTransition>
  );
};

export default QuotationsPage;
