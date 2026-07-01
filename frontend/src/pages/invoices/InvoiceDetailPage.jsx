import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Download, Receipt, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDoc } from '../../hooks/useOrgCollection';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { COLLECTIONS } from '../../firebase/collections';
import { PageHeader, Card, Badge, Button, EmptyState } from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { formatDate, formatCurrency, formatDateTime } from '../../utils/dateHelpers';
import { downloadInvoicePdf } from '../../utils/pdfGenerator';
import { markInvoiceAsPaid } from '../../utils/invoiceHelpers';
import { writeAuditLog } from '../../utils/audit';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const { currentOrg, user } = useAuth();
  const { data: invoice, loading } = useDoc(COLLECTIONS.INVOICES, id);
  const { data: sourceQuotation } = useDoc(COLLECTIONS.QUOTATIONS, invoice?.quotationId);
  const { data: linkedEvent } = useDoc(COLLECTIONS.EVENTS, invoice?.eventId);
  const logs = useAuditLogs({ orgId: currentOrg?.id, entityType: 'INVOICE', entityId: id }).logs;

  const handleMarkPaid = async () => {
    if (!invoice || !currentOrg) return;
    await markInvoiceAsPaid(invoice.id, user?.uid);
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'STATUS_CHANGED',
      entityType: 'INVOICE',
      entityId: id,
      entityName: invoice.invoiceNumber,
      details: `Marked invoice ${invoice.invoiceNumber} as paid`,
    });
    toast.success('Invoice marked as paid');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <PageTransition>
        <PageHeader title="Invoice" subtitle="Document not found." />
        <Card>
          <EmptyState
            icon={Receipt}
            title="Invoice not found"
            description="This invoice may have been deleted."
            action={{ label: 'Back to Invoices', onClick: () => window.history.back() }}
          />
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title={invoice.invoiceNumber || 'Invoice'}
        subtitle={`Invoice for ${invoice.clientName || '—'}`}
        actions={
          <div className="flex gap-2">
            <Link to="/invoices">
              <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>Back</Button>
            </Link>
            <Button
              variant="secondary"
              leftIcon={<Download size={16} />}
              onClick={() => downloadInvoicePdf(invoice, currentOrg)}
            >
              PDF
            </Button>
            {invoice.status === 'SENT' && (
              <Button
                leftIcon={<CheckCircle2 size={16} />}
                onClick={handleMarkPaid}
              >
                Mark Paid
              </Button>
            )}
            <Link to={`/invoices/${id}/edit`}>
              <Button leftIcon={<Pencil size={16} />}>Edit</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-display font-semibold mb-4">Client Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-app-text-muted mb-1">Name</p>
                <p className="font-medium">{invoice.clientName || '—'}</p>
              </div>
              <div>
                <p className="text-app-text-muted mb-1">Email</p>
                <p className="font-medium">{invoice.clientEmail || '—'}</p>
              </div>
              <div>
                <p className="text-app-text-muted mb-1">Phone</p>
                <p className="font-medium">{invoice.clientPhone || '—'}</p>
              </div>
              <div>
                <p className="text-app-text-muted mb-1">Source</p>
                <p className="font-medium">
                  {sourceQuotation ? (
                    <Link to={`/quotations/${sourceQuotation.id}`} className="text-app-accent hover:underline">
                      {sourceQuotation.quotationNumber}
                    </Link>
                  ) : 'Direct'}
                </p>
              </div>
              <div>
                <p className="text-app-text-muted mb-1">Linked Event</p>
                <p className="font-medium">
                  {linkedEvent ? (
                    <Link to={`/events/${linkedEvent.id}`} className="text-app-accent hover:underline">
                      {linkedEvent.title}
                    </Link>
                  ) : '—'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-display font-semibold mb-4">Line Items</h2>
            {invoice.lineItems?.length > 0 ? (
              <div className="rounded-xl border border-app-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-app-bg-tertiary">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Description</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Unit Price</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((li, i) => (
                      <tr key={li.id || i} className="border-t border-app-border">
                        <td className="px-3 py-2 text-app-text-muted">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{li.description || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono">{li.quantity}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(li.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {formatCurrency((Number(li.quantity) || 0) * (Number(li.unitPrice) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-app-text-muted text-center py-4">No line items.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-display font-semibold mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-app-text-muted">Status</span>
                <Badge status={invoice.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-app-text-muted">Due Date</span>
                <span className="font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="border-t border-app-border pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-app-text-muted">Subtotal</span>
                  <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-app-text-muted">Discount ({invoice.discountPercent}%)</span>
                    <span className="font-mono text-app-danger">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-app-text-muted">Tax ({invoice.taxPercent}%)</span>
                    <span className="font-mono">+{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-app-border pt-2 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </Card>

          {invoice.notes && (
            <Card>
              <h2 className="text-lg font-display font-semibold mb-4">Notes</h2>
              <p className="text-sm text-app-text-secondary whitespace-pre-wrap">{invoice.notes}</p>
            </Card>
          )}

          {logs.length > 0 && (
            <Card>
              <h2 className="text-lg font-display font-semibold mb-4">Activity</h2>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <Badge status={log.action} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-app-text-secondary">{log.details}</p>
                      <p className="text-xs text-app-text-muted mt-0.5">
                        {log.userName} · {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default InvoiceDetailPage;
