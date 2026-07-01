import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowLeft, Plus, X, ArrowRightCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection, useDoc } from '../../hooks/useOrgCollection';
import { COLLECTIONS } from '../../firebase/collections';
import { QUOTATION_STATUSES } from '../../utils/business';
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
  validUntil: yup.string().required('Valid until is required'),
  status: yup.string().required('Status is required'),
});

const isInventoryLine = (li) => li && (li.inventoryItemId || li.snapshotName);

const normalizeExistingLines = (rawLines) => {
  if (!Array.isArray(rawLines) || rawLines.length === 0) return [];
  return rawLines
    .map((li) => {
      if (isInventoryLine(li)) {
        return {
          id: li.id || uuidv4(),
          inventoryItemId: li.inventoryItemId || null,
          variantId: li.variantId || null,
          quantity: Number(li.quantity) || 1,
          snapshotName: li.snapshotName || '',
          snapshotSize: li.snapshotSize || null,
          snapshotPrice: Number(li.snapshotPrice) || 0,
        };
      }
      return null;
    })
    .filter(Boolean);
};

const QuotationFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, user } = useAuth();
  const isEdit = Boolean(id);
  const [lineItems, setLineItems] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const { items: allEvents } = useOrgCollection(COLLECTIONS.EVENTS);
  const { items: inventoryItems } = useOrgCollection(COLLECTIONS.INVENTORY);
  const events = useMemo(
    () => [...allEvents].sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || '')),
    [allEvents]
  );
  const { data: existing } = useDoc(COLLECTIONS.QUOTATIONS, id);
  const [picker, setPicker] = useState({ itemId: '', variantId: '', quantity: 1 });

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
      validUntil: '',
      status: 'DRAFT',
      notes: '',
    },
  });

  useEffect(() => {
    if (!existing) return;
    reset({
      clientName: existing.clientName,
      clientEmail: existing.clientEmail || '',
      clientPhone: existing.clientPhone || '',
      eventId: existing.eventId || '',
      validUntil: existing.validUntil || '',
      status: existing.status || 'DRAFT',
      notes: existing.notes || '',
    });
    setLineItems(normalizeExistingLines(existing.lineItems));
    setDiscountPercent(existing.discountPercent || 0);
    setTaxPercent(existing.taxPercent || 0);
  }, [existing, reset]);

  const totals = useMemo(
    () => computeQuotationTotals(lineItems, discountPercent, taxPercent),
    [lineItems, discountPercent, taxPercent]
  );

  const selectedInventoryItem = useMemo(
    () => inventoryItems.find((i) => i.id === picker.itemId),
    [inventoryItems, picker.itemId]
  );

  const addItemLine = () => {
    if (!selectedInventoryItem) {
      toast.error('Select an inventory item');
      return;
    }
    const variant = (selectedInventoryItem.variants || []).find(
      (v) => v.id === picker.variantId
    );
    if ((selectedInventoryItem.variants || []).length > 0 && !variant) {
      toast.error('Select a variant');
      return;
    }
    const qty = Number(picker.quantity) || 1;
    if (qty <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }
    const newLine = {
      id: uuidv4(),
      inventoryItemId: selectedInventoryItem.id,
      variantId: variant?.id || null,
      quantity: qty,
      snapshotName: selectedInventoryItem.name,
      snapshotSize: variant?.size || null,
      snapshotPrice: Number(variant?.pricePerUnit) || 0,
    };
    setLineItems((prev) => [...prev, newLine]);
    setPicker({ itemId: '', variantId: '', quantity: 1 });
  };

  const removeLine = (lid) => setLineItems((prev) => prev.filter((x) => x.id !== lid));

  const updateLineQuantity = (lid, qty) => {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return;
    setLineItems((prev) =>
      prev.map((x) => (x.id === lid ? { ...x, quantity: n } : x))
    );
  };

  const onSubmit = async (data) => {
    if (lineItems.length === 0) {
      toast.error('Add at least one inventory item to the quotation');
      return;
    }
    const validLines = lineItems
      .filter((l) => l.inventoryItemId && l.quantity > 0)
      .map((l) => ({
        id: l.id,
        inventoryItemId: l.inventoryItemId,
        variantId: l.variantId || null,
        quantity: Number(l.quantity),
        snapshotName: l.snapshotName,
        snapshotSize: l.snapshotSize || null,
        snapshotPrice: Number(l.snapshotPrice) || 0,
      }));

    if (validLines.length === 0) {
      toast.error('At least one line item is required');
      return;
    }

    if (isEdit) {
      const updates = {
        clientName: data.clientName,
        clientEmail: data.clientEmail || '',
        clientPhone: data.clientPhone || '',
        eventId: data.eventId || null,
        validUntil: data.validUntil,
        status: data.status,
        notes: data.notes || '',
        lineItems: validLines,
        ...totals,
        discountPercent: Number(discountPercent) || 0,
        taxPercent: Number(taxPercent) || 0,
        updatedBy: user?.uid,
      };
      await updateDocFields(COLLECTIONS.QUOTATIONS, id, updates);
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'UPDATED',
        entityType: 'QUOTATION',
        entityId: id,
        entityName: existing?.quotationNumber,
        details: `Updated quotation ${existing?.quotationNumber}`,
      });
      toast.success('Quotation updated');
      navigate('/quotations');
    } else {
      const quotationNumber = await getNextNumber('QUO', currentOrg.id);
      const newId = await createDoc(COLLECTIONS.QUOTATIONS, {
        quotationNumber,
        organizationId: currentOrg.id,
        eventId: data.eventId || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail || '',
        clientPhone: data.clientPhone || '',
        lineItems: validLines,
        ...totals,
        discountPercent: Number(discountPercent) || 0,
        taxPercent: Number(taxPercent) || 0,
        status: data.status,
        validUntil: data.validUntil,
        notes: data.notes || '',
        createdBy: user?.uid,
        convertedToInvoiceId: null,
      });
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'CREATED',
        entityType: 'QUOTATION',
        entityId: newId,
        entityName: quotationNumber,
        details: `Created quotation ${quotationNumber}`,
      });
      toast.success('Quotation created');
      navigate('/quotations');
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title={isEdit ? `Edit ${existing?.quotationNumber || 'Quotation'}` : 'New Quotation'}
        subtitle="Build a quotation from your inventory items."
        actions={
          <div className="flex gap-2">
            <Link to="/quotations">
              <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
            </Link>
            {isEdit && existing && existing.status !== 'CONVERTED' && (
              <Link to={`/invoices/new?fromQuotation=${existing.id}`}>
                <Button leftIcon={<ArrowRightCircle size={16} />}>
                  Convert to Invoice
                </Button>
              </Link>
            )}
          </div>
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
            <Select
              label="Link to Event (optional)"
              {...register('eventId')}
              options={events.map((e) => ({
                value: e.id,
                label: `${e.title} (${e.scheduledDate})`,
              }))}
              placeholder="None"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} />
            <h2 className="text-lg font-display font-semibold">Items</h2>
          </div>

          {inventoryItems.length === 0 ? (
            <p className="text-sm text-app-text-muted text-center py-6">
              No inventory items available. Add inventory first to build a quotation.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-xl bg-app-bg-tertiary">
                <div className="md:col-span-5">
                  <Select
                    value={picker.itemId}
                    onChange={(e) =>
                      setPicker((p) => ({ ...p, itemId: e.target.value, variantId: '' }))
                    }
                    placeholder="Choose item"
                    options={inventoryItems.map((i) => ({ value: i.id, label: i.name }))}
                  />
                </div>
                <div className="md:col-span-3">
                  {selectedInventoryItem && (selectedInventoryItem.variants || []).length > 0 ? (
                    <Select
                      value={picker.variantId}
                      onChange={(e) => setPicker((p) => ({ ...p, variantId: e.target.value }))}
                      placeholder="Size / variant"
                      options={(selectedInventoryItem.variants || []).map((v) => ({
                        value: v.id,
                        label: `${v.size || 'Default'} — ${formatCurrency(v.pricePerUnit)}`,
                      }))}
                    />
                  ) : (
                    <Input value="" placeholder="(No variants)" disabled />
                  )}
                </div>
                <div className="md:col-span-2">
                  <Input
                    type="number"
                    min="1"
                    value={picker.quantity}
                    onChange={(e) => setPicker((p) => ({ ...p, quantity: e.target.value }))}
                    placeholder="Qty"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button
                    type="button"
                    onClick={addItemLine}
                    className="w-full"
                    leftIcon={<Plus size={14} />}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {lineItems.length > 0 ? (
                <div className="rounded-xl border border-app-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-app-bg-tertiary">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Size</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Unit Price</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-app-text-secondary">Line Total</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((l) => (
                        <tr key={l.id} className="border-t border-app-border">
                          <td className="px-3 py-2 font-medium">{l.snapshotName || '—'}</td>
                          <td className="px-3 py-2 text-app-text-secondary">{l.snapshotSize || '—'}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={l.quantity}
                              onChange={(e) => updateLineQuantity(l.id, e.target.value)}
                              className="w-16 text-right rounded-md border border-app-border bg-app-bg-secondary px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-app-accent"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{formatCurrency(l.snapshotPrice)}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold">
                            {formatCurrency((Number(l.snapshotPrice) || 0) * (Number(l.quantity) || 0))}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeLine(l.id)}
                              className="p-1 rounded hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-danger"
                              aria-label="Remove"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-app-border bg-app-bg-tertiary">
                        <td colSpan="4" className="px-3 py-2 text-right font-medium">Subtotal</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(totals.subtotal)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-app-text-muted text-center py-4">
                  No items added yet. Pick an item above and click Add.
                </p>
              )}
            </div>
          )}
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
            <Input label="Valid Until" type="date" {...register('validUntil')} error={errors.validUntil?.message} />
            <Select
              label="Status"
              {...register('status')}
              options={QUOTATION_STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="mt-3">
            <Textarea label="Notes / Terms" {...register('notes')} />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/quotations">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Quotation'}
          </Button>
        </div>
      </form>
    </PageTransition>
  );
};

export default QuotationFormPage;
