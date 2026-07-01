import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection, useDoc } from '../../hooks/useOrgCollection';
import { COLLECTIONS } from '../../firebase/collections';
import { INVOICE_STATUSES } from '../../utils/business';
import {
  PageHeader,
  Card,
  Input,
  Textarea,
  Button,
  Select,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { createDoc, updateDocFields, getNextNumber } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { v4 as uuidv4 } from 'uuid';
import { computeQuotationTotals } from '../../utils/business';
import { formatCurrency } from '../../utils/dateHelpers';

const schema = yup.object({
  clientName: yup.string().required('Client name is required'),
  clientEmail: yup.string().email('Invalid email'),
  clientPhone: yup.string(),
  dueDate: yup.string().required('Due date is required'),
  status: yup.string().required('Status is required'),
});

const emptyLine = () => ({
  id: uuidv4(),
  description: '',
  quantity: 1,
  unitPrice: 0,
});

const convertQuotationLines = (rawLines) => {
  if (!Array.isArray(rawLines) || rawLines.length === 0) return [emptyLine()];
  const converted = rawLines
    .filter((l) => l && (l.snapshotName || l.description))
    .map((l) => {
      if (l.snapshotName) {
        const sizeSuffix = l.snapshotSize ? ` (${l.snapshotSize})` : '';
        return {
          id: l.id || uuidv4(),
          description: `${l.snapshotName}${sizeSuffix}`,
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.snapshotPrice) || 0,
        };
      }
      return {
        id: l.id || uuidv4(),
        description: l.description || '',
        quantity: Number(l.quantity) || 1,
        unitPrice: Number(l.unitPrice) || 0,
      };
    });
  return converted.length > 0 ? converted : [emptyLine()];
};

const InvoiceFormPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fromQuotationId = searchParams.get('fromQuotation');
  const navigate = useNavigate();
  const { currentOrg, user } = useAuth();
  const isEdit = Boolean(id);
  const [lineItems, setLineItems] = useState([emptyLine()]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const { items: allEvents } = useOrgCollection(COLLECTIONS.EVENTS);
  const { items: quotations } = useOrgCollection(COLLECTIONS.QUOTATIONS);
  const events = useMemo(
    () => [...allEvents].sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || '')),
    [allEvents]
  );
  const { data: existing } = useDoc(COLLECTIONS.INVOICES, id);
  const { data: sourceQuotation } = useDoc(COLLECTIONS.QUOTATIONS, isEdit ? null : fromQuotationId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      eventId: '',
      quotationId: '',
      dueDate: '',
      status: 'DRAFT',
      notes: '',
    },
  });

  useEffect(() => {
    if (isEdit && existing) {
      reset({
        clientName: existing.clientName,
        clientEmail: existing.clientEmail || '',
        clientPhone: existing.clientPhone || '',
        eventId: existing.eventId || '',
        quotationId: existing.quotationId || '',
        dueDate: existing.dueDate || '',
        status: existing.status || 'DRAFT',
        notes: existing.notes || '',
      });
      setLineItems(existing.lineItems || [emptyLine()]);
      setDiscountPercent(existing.discountPercent || 0);
      setTaxPercent(existing.taxPercent || 0);
    } else if (!isEdit && sourceQuotation) {
      reset({
        clientName: sourceQuotation.clientName,
        clientEmail: sourceQuotation.clientEmail || '',
        clientPhone: sourceQuotation.clientPhone || '',
        eventId: sourceQuotation.eventId || '',
        quotationId: sourceQuotation.id,
        dueDate: '',
        status: 'DRAFT',
        notes: sourceQuotation.notes || '',
      });
      setLineItems(convertQuotationLines(sourceQuotation.lineItems));
      setDiscountPercent(sourceQuotation.discountPercent || 0);
      setTaxPercent(sourceQuotation.taxPercent || 0);
    }
  }, [existing, sourceQuotation, isEdit, reset]);

  const totals = useMemo(
    () => computeQuotationTotals(lineItems, discountPercent, taxPercent),
    [lineItems, discountPercent, taxPercent]
  );

  const addLine = () => setLineItems((l) => [...l, emptyLine()]);
  const removeLine = (lid) => setLineItems((l) => l.filter((x) => x.id !== lid));
  const updateLine = (lid, key, val) =>
    setLineItems((l) => l.map((x) => (x.id === lid ? { ...x, [key]: val } : x)));

  const onSubmit = async (data) => {
    if (lineItems.length === 0 || lineItems.every((l) => !l.description)) {
      toast.error('At least one line item with a description is required');
      return;
    }
    const validLines = lineItems
      .filter((l) => l.description && l.quantity > 0)
      .map((l) => ({
        id: l.id,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        total: Number(l.quantity) * Number(l.unitPrice),
      }));

    if (isEdit) {
      const updates = {
        clientName: data.clientName,
        clientEmail: data.clientEmail || '',
        clientPhone: data.clientPhone || '',
        eventId: data.eventId || null,
        quotationId: data.quotationId || null,
        lineItems: validLines,
        ...totals,
        discountPercent: Number(discountPercent) || 0,
        taxPercent: Number(taxPercent) || 0,
        status: data.status,
        dueDate: data.dueDate,
        notes: data.notes || '',
        updatedBy: user?.uid,
      };
      if (existing && updates.status !== existing.status) {
        await writeAuditLog({
          organizationId: currentOrg.id,
          userId: user?.uid,
          userName: user?.displayName,
          action: 'STATUS_CHANGED',
          entityType: 'INVOICE',
          entityId: id,
          entityName: existing.invoiceNumber,
          details: `Status changed from ${existing.status} to ${updates.status}`,
        });
      }
      await updateDocFields(COLLECTIONS.INVOICES, id, updates);
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'UPDATED',
        entityType: 'INVOICE',
        entityId: id,
        entityName: existing?.invoiceNumber,
        details: `Updated invoice ${existing?.invoiceNumber}`,
      });
      toast.success('Invoice updated');
      navigate('/invoices');
    } else {
      const invoiceNumber = await getNextNumber('INV', currentOrg.id);
      const newId = await createDoc(COLLECTIONS.INVOICES, {
        invoiceNumber,
        organizationId: currentOrg.id,
        quotationId: data.quotationId || null,
        eventId: data.eventId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail || '',
        clientPhone: data.clientPhone || '',
        lineItems: validLines,
        ...totals,
        discountPercent: Number(discountPercent) || 0,
        taxPercent: Number(taxPercent) || 0,
        status: data.status,
        dueDate: data.dueDate,
        notes: data.notes || '',
        createdBy: user?.uid,
      });
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'CREATED',
        entityType: 'INVOICE',
        entityId: newId,
        entityName: invoiceNumber,
        details: `Created invoice ${invoiceNumber}`,
      });
      if (data.quotationId) {
        await updateDocFields(COLLECTIONS.QUOTATIONS, data.quotationId, {
          status: 'CONVERTED',
          convertedToInvoiceId: newId,
        });
        await writeAuditLog({
          organizationId: currentOrg.id,
          userId: user?.uid,
          userName: user?.displayName,
          action: 'CONVERTED',
          entityType: 'QUOTATION',
          entityId: data.quotationId,
          entityName: sourceQuotation?.quotationNumber,
          details: `Converted quotation ${sourceQuotation?.quotationNumber} to invoice ${invoiceNumber}`,
        });
      }
      toast.success('Invoice created');
      navigate('/invoices');
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title={isEdit ? `Edit ${existing?.invoiceNumber || 'Invoice'}` : sourceQuotation ? `Invoice from ${sourceQuotation.quotationNumber}` : 'New Invoice'}
        subtitle="Build an invoice with line items, discounts, and tax."
        actions={
          <Link to="/invoices">
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Client</h2>
          <div className="space-y-4">
            <Input label="Client Name" {...register('clientName')} error={errors.clientName?.message} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Email (optional)" type="email" {...register('clientEmail')} error={errors.clientEmail?.message} />
              <Input label="Phone (optional)" {...register('clientPhone')} error={errors.clientPhone?.message} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Link to Event (optional)"
                {...register('eventId')}
                options={events.map((e) => ({
                  value: e.id,
                  label: `${e.title} (${e.scheduledDate})`,
                }))}
                placeholder="None"
              />
              <Select
                label="From Quotation (optional)"
                {...register('quotationId')}
                options={quotations.map((q) => ({
                  value: q.id,
                  label: `${q.quotationNumber} — ${q.clientName}`,
                }))}
                placeholder="None"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Line Items</h2>
            <Button type="button" size="sm" variant="secondary" leftIcon={<Plus size={14} />} onClick={addLine}>
              Add Line
            </Button>
          </div>
          <div className="space-y-3">
            {lineItems.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-xl border border-app-border bg-app-bg-primary"
              >
                <div className="md:col-span-6">
                  <Input
                    placeholder="Description"
                    value={l.description}
                    onChange={(e) => updateLine(l.id, 'description', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={l.quantity}
                    onChange={(e) => updateLine(l.id, 'quantity', e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit price"
                    value={l.unitPrice}
                    onChange={(e) => updateLine(l.id, 'unitPrice', e.target.value)}
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeLine(l.id)}
                    disabled={lineItems.length === 1}
                    className="w-full md:w-auto p-2.5 rounded-xl border border-app-border hover:bg-app-bg-tertiary disabled:opacity-40"
                  >
                    <X size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Totals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Input
                label="Discount %"
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
              <Input
                label="Tax %"
                type="number"
                min="0"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
              />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-app-text-secondary">Subtotal</span>
                <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-text-secondary">Discount</span>
                <span className="font-mono">-{formatCurrency(totals.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-app-text-secondary">Tax</span>
                <span className="font-mono">+{formatCurrency(totals.taxAmount)}</span>
              </div>
              <div className="border-t border-app-border pt-2 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Meta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Due Date" type="date" {...register('dueDate')} error={errors.dueDate?.message} />
            <Select
              label="Status"
              {...register('status')}
              options={INVOICE_STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="mt-3">
            <Textarea label="Notes / Terms" {...register('notes')} />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/invoices">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </PageTransition>
  );
};

export default InvoiceFormPage;
