import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Calendar,
  MapPin,
  Users,
  Clock,
  History,
  DollarSign,
  Plus,
  X as XIcon,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDoc } from '../../hooks/useOrgCollection';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { COLLECTIONS } from '../../firebase/collections';
import { updateDocFields } from '../../firebase/db';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  EmptyState,
  Modal,
  Input,
  Textarea,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { writeAuditLog } from '../../utils/audit';
import { formatDate, formatDateTime, formatCurrency, formatRelative } from '../../utils/dateHelpers';
import {
  buildPaymentSummary,
  buildNewPayment,
} from '../../utils/paymentHelpers';

const EventDetailPage = () => {
  const { id } = useParams();
  const { currentOrg, user } = useAuth();
  const { data: event, loading } = useDoc(COLLECTIONS.EVENTS, id);
  const { data: eventType } = useDoc(COLLECTIONS.EVENT_TYPES, event?.eventTypeId);
  const logs = useAuditLogs({ orgId: currentOrg?.id, entityType: 'EVENT', entityId: id }).logs;
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const totalItemCost = useMemo(
    () =>
      (event?.attachedItems || []).reduce(
        (sum, a) => sum + (a.snapshotPrice || 0) * a.quantity,
        0
      ),
    [event]
  );

  const paymentSummary = useMemo(
    () => (event ? buildPaymentSummary(event) : null),
    [event]
  );

  const handleRecordPayment = async ({ amount, date, note }) => {
    if (!event || !currentOrg) return;
    const newPayment = buildNewPayment({ amount, date, note, recordedBy: user?.displayName });
    const updatedPayments = [...(event.payments || []), newPayment];
    await updateDocFields(COLLECTIONS.EVENTS, id, { payments: updatedPayments });
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'PAYMENT_RECORDED',
      entityType: 'EVENT',
      entityId: id,
      entityName: event.title,
      details: `Recorded payment of ${amount}${note ? ` — ${note}` : ''}`,
    });
    setIsPaymentOpen(false);
    toast.success('Payment recorded');
  };

  const handleDeletePayment = async (payment) => {
    if (!event || !currentOrg) return;
    const updatedPayments = (event.payments || []).filter((p) => p.id !== payment.id);
    await updateDocFields(COLLECTIONS.EVENTS, id, { payments: updatedPayments });
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'PAYMENT_REMOVED',
      entityType: 'EVENT',
      entityId: id,
      entityName: event.title,
      details: `Removed payment of ${payment.amount}`,
    });
    setConfirmDelete(null);
    toast.success('Payment removed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <PageTransition>
        <PageHeader
          title="Event"
          actions={
            <Link to="/events">
              <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back</Button>
            </Link>
          }
        />
        <Card>
          <EmptyState title="Event not found" description="This event may have been deleted." />
        </Card>
      </PageTransition>
    );
  }

  const charged = paymentSummary.charged;
  const paid = paymentSummary.paid;
  const balance = paymentSummary.balance;
  const status = paymentSummary.status;

  return (
    <PageTransition>
      <PageHeader
        title={event.title}
        subtitle={`${event.clientName} · ${formatDate(event.scheduledDate, 'EEEE, MMMM d, yyyy')}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/events">
              <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
            </Link>
            <Link to={`/events/${event.id}/edit`}>
              <Button leftIcon={<Pencil size={16} />}>Edit</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge status={event.status} />
              {eventType && (
                <Link to={`/event-types/${eventType.id}`}>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium hover:opacity-80"
                    style={{
                      backgroundColor: `${eventType.color}20`,
                      color: eventType.color,
                    }}
                  >
                    {eventType.name}
                  </span>
                </Link>
              )}
              <Badge status={status} />
            </div>
            <h2 className="text-2xl font-display font-semibold mb-4">{event.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-app-text-muted mb-1 flex items-center gap-1">
                  <Users size={12} /> Client
                </p>
                <p className="font-medium">{event.clientName}</p>
                {event.clientPhone && (
                  <p className="text-xs text-app-text-secondary">{event.clientPhone}</p>
                )}
                {event.clientEmail && (
                  <p className="text-xs text-app-text-secondary">{event.clientEmail}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1 flex items-center gap-1">
                  <MapPin size={12} /> Venue
                </p>
                <p className="font-medium">{event.venue}</p>
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Date
                </p>
                <p className="font-medium">{formatDate(event.scheduledDate)}</p>
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1 flex items-center gap-1">
                  <Clock size={12} /> Time
                </p>
                <p className="font-medium">{event.scheduledTime}</p>
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1 flex items-center gap-1">
                  <Users size={12} /> Guests
                </p>
                <p className="font-medium">{event.guestCount}</p>
              </div>
              <div>
                <p className="text-xs text-app-text-muted mb-1">Pricing</p>
                {event.priceMode === 'CUSTOM' ? (
                  <p className="font-medium">Custom — <span className="font-mono">{formatCurrency(charged)}</span></p>
                ) : (
                  <p className="font-medium">
                    {eventType?.pricingTiers?.find((t) => t.id === event.selectedPricingTierId)?.description || 'Tier'} —{' '}
                    <span className="font-mono">{formatCurrency(charged)}</span>
                  </p>
                )}
              </div>
            </div>
            {event.notes && (
              <div className="mt-5 pt-5 border-t border-app-border">
                <p className="text-xs text-app-text-muted mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-display font-semibold mb-4">Inventory Breakdown</h3>
            {(event.attachedItems || []).length === 0 ? (
              <p className="text-sm text-app-text-muted text-center py-4">
                No inventory attached.
              </p>
            ) : (
              <div className="rounded-xl border border-app-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-app-bg-tertiary">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Size</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Unit</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.attachedItems.map((a) => (
                      <tr key={a.id} className="border-t border-app-border">
                        <td className="px-3 py-2 font-medium">
                          <Link to={`/inventory/${a.inventoryItemId}`} className="hover:underline">
                            {a.snapshotName}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-app-text-secondary">{a.snapshotSize || '—'}</td>
                        <td className="px-3 py-2 text-right">{a.quantity}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(a.snapshotPrice)}</td>
                        <td className="px-3 py-2 text-right font-mono font-medium">
                          {formatCurrency(a.snapshotPrice * a.quantity)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-app-border bg-app-bg-tertiary">
                      <td colSpan="4" className="px-3 py-2 text-right font-medium">Total</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(totalItemCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                <DollarSign size={18} /> Payment
              </h3>
              <Badge status={status} />
            </div>

            {status === 'PAID' && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} />
                Paid in full
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-app-text-muted">Charged</span>
                <span className="font-mono font-semibold">{formatCurrency(charged)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-app-text-muted">Paid</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(paid)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-app-border">
                <span className="text-sm font-medium">Balance</span>
                <span
                  className={`font-mono font-semibold ${
                    balance > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatCurrency(Math.max(0, balance))}
                </span>
              </div>
              {charged > 0 && (
                <div className="pt-2">
                  <div className="h-2 w-full rounded-full bg-app-bg-tertiary overflow-hidden">
                    <div
                      className="h-full bg-app-accent transition-all"
                      style={{ width: `${paymentSummary.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-app-text-muted mt-1 text-right">
                    {paymentSummary.progress}% paid
                  </p>
                </div>
              )}
            </div>

            <Button
              className="w-full mt-4"
              onClick={() => setIsPaymentOpen(true)}
              leftIcon={<Plus size={14} />}
            >
              Record Payment
            </Button>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-app-text-muted font-semibold mb-2">
                Payment History
              </p>
              {paymentSummary.payments.length === 0 ? (
                <p className="text-xs text-app-text-muted text-center py-3">
                  No payments recorded yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {paymentSummary.payments.map((p) => {
                    return (
                      <li
                        key={p.id}
                        className="flex items-start gap-2 p-2 rounded-lg bg-app-bg-tertiary/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-mono font-semibold text-sm">{formatCurrency(p.amount)}</span>
                            <span className="text-[10px] text-app-text-muted">
                              {formatDate(p.date)}
                            </span>
                          </div>
                          {p.note && (
                            <p className="text-xs text-app-text-secondary mt-0.5 truncate">
                              {p.note}
                            </p>
                          )}
                          {p.recordedBy && (
                            <p className="text-[10px] text-app-text-muted">
                              by {p.recordedBy}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          className="p-1 rounded hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-danger flex-shrink-0"
                          aria-label="Remove payment"
                        >
                          <XIcon size={12} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <History size={18} /> Audit History
            </h3>
            {logs.length === 0 ? (
              <p className="text-sm text-app-text-muted text-center py-4">
                No history yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {logs.map((log) => {
                  return (
                    <motion.li
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border-l-2 border-app-border pl-3"
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge status={log.action} />
                        <span className="text-xs text-app-text-muted">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-app-text-primary">
                        {log.userName || 'Unknown'}
                      </p>
                      <p className="text-xs text-app-text-muted">
                        {formatRelative(log.createdAt)}
                      </p>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSubmit={handleRecordPayment}
        charged={charged}
        balance={balance}
      />

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove Payment?"
        size="sm"
      >
        <p className="text-sm text-app-text-secondary">
          Are you sure you want to remove the payment of{' '}
          <span className="font-mono font-semibold">{formatCurrency(confirmDelete?.amount || 0)}</span>?
          This will update the payment status.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDeletePayment(confirmDelete)}>
            Remove
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
};

const RecordPaymentModal = ({ isOpen, onClose, onSubmit, charged, balance }) => {
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(today);
      setNote('');
    }
  }, [isOpen]);

  const submit = (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;
    onSubmit({ amount: numericAmount, date: new Date(date).toISOString(), note });
  };

  const suggestedAmount = balance > 0 ? balance : charged;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="p-3 rounded-xl bg-app-bg-tertiary text-sm flex items-center justify-between">
          <span className="text-app-text-muted">Outstanding balance</span>
          <span className="font-mono font-semibold">{formatCurrency(Math.max(0, balance))}</span>
        </div>

        <Input
          label="Amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          leftIcon={<DollarSign size={16} />}
          required
        />
        {balance > 0 && balance !== Number(amount) && (
          <button
            type="button"
            onClick={() => setAmount(String(suggestedAmount))}
            className="text-xs text-app-accent hover:underline"
          >
            Pay full balance ({formatCurrency(suggestedAmount)})
          </button>
        )}

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <Textarea
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Cash deposit, bank transfer..."
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Record Payment</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EventDetailPage;
