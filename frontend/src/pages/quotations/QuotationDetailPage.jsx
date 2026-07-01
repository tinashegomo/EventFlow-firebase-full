import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Download, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDoc } from '../../hooks/useOrgCollection';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { COLLECTIONS } from '../../firebase/collections';
import { PageHeader, Card, Badge, Button, EmptyState } from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { formatDate, formatCurrency, formatDateTime } from '../../utils/dateHelpers';
import { downloadQuotationPdf } from '../../utils/pdfGenerator';

const QuotationDetailPage = () => {
  const { id } = useParams();
  const { currentOrg } = useAuth();
  const { data: quotation, loading } = useDoc(COLLECTIONS.QUOTATIONS, id);
  const { data: linkedEvent } = useDoc(COLLECTIONS.EVENTS, quotation?.eventId);
  const logs = useAuditLogs({ orgId: currentOrg?.id, entityType: 'QUOTATION', entityId: id }).logs;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <PageTransition>
        <PageHeader title="Quotation" subtitle="Document not found." />
        <Card>
          <EmptyState
            icon={FileText}
            title="Quotation not found"
            description="This quotation may have been deleted."
            action={{ label: 'Back to Quotations', onClick: () => window.history.back() }}
          />
        </Card>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title={quotation.quotationNumber || 'Quotation'}
        subtitle={`Quotation for ${quotation.clientName || '—'}`}
        actions={
          <div className="flex gap-2">
            <Link to="/quotations">
              <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>Back</Button>
            </Link>
            <Button
              variant="secondary"
              leftIcon={<Download size={16} />}
              onClick={() => downloadQuotationPdf(quotation, currentOrg)}
            >
              PDF
            </Button>
            <Link to={`/quotations/${id}/edit`}>
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
                <p className="font-medium">{quotation.clientName || '—'}</p>
              </div>
              <div>
                <p className="text-app-text-muted mb-1">Email</p>
                <p className="font-medium">{quotation.clientEmail || '—'}</p>
              </div>
              <div>
                <p className="text-app-text-muted mb-1">Phone</p>
                <p className="font-medium">{quotation.clientPhone || '—'}</p>
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
            {quotation.lineItems?.length > 0 ? (
              <div className="rounded-xl border border-app-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-app-bg-tertiary">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Size</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Unit Price</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.lineItems.map((li, i) => (
                      <tr key={li.id || i} className="border-t border-app-border">
                        <td className="px-3 py-2 text-app-text-muted">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{li.snapshotName || '—'}</td>
                        <td className="px-3 py-2 text-app-text-secondary">{li.snapshotSize || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono">{li.quantity}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(li.snapshotPrice)}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {formatCurrency((Number(li.snapshotPrice) || 0) * (Number(li.quantity) || 0))}
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
                <Badge status={quotation.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-app-text-muted">Valid Until</span>
                <span className="font-medium">{formatDate(quotation.validUntil)}</span>
              </div>
              <div className="border-t border-app-border pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-app-text-muted">Subtotal</span>
                  <span className="font-mono">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-app-text-muted">Discount ({quotation.discountPercent}%)</span>
                    <span className="font-mono text-app-danger">-{formatCurrency(quotation.discountAmount)}</span>
                  </div>
                )}
                {quotation.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-app-text-muted">Tax ({quotation.taxPercent}%)</span>
                    <span className="font-mono">+{formatCurrency(quotation.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-app-border pt-2 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(quotation.totalAmount)}</span>
                </div>
              </div>
            </div>
          </Card>

          {quotation.notes && (
            <Card>
              <h2 className="text-lg font-display font-semibold mb-4">Notes</h2>
              <p className="text-sm text-app-text-secondary whitespace-pre-wrap">{quotation.notes}</p>
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

export default QuotationDetailPage;
