import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, DollarSign, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection, useDoc } from '../../hooks/useOrgCollection';
import { COLLECTIONS } from '../../firebase/collections';
import { EVENT_STATUSES } from '../../utils/business';
import {
  PageHeader,
  Card,
  Input,
  Textarea,
  Button,
  Select,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { createDoc, updateDocFields } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { v4 as uuidv4 } from 'uuid';
import { buildNewPayment } from '../../utils/paymentHelpers';
import { formatCurrency } from '../../utils/dateHelpers';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  eventTypeId: yup.string().required('Event type is required'),
  status: yup.string().required('Status is required'),
  clientName: yup.string().required('Client name is required'),
  clientPhone: yup.string(),
  clientEmail: yup.string().email('Invalid email'),
  venue: yup.string().required('Venue is required'),
  scheduledDate: yup.string().required('Date is required'),
  scheduledTime: yup.string().required('Time is required'),
  guestCount: yup.number().typeError('Enter a number').min(1, 'Min 1').required('Required'),
  priceMode: yup.string().oneOf(['TIER', 'CUSTOM']).required(),
  selectedPricingTierId: yup.string().nullable(),
  customPrice: yup.number().typeError('Enter a number').min(0, 'Cannot be negative'),
  initialDeposit: yup.number().typeError('Enter a number').min(0, 'Cannot be negative'),
});

const EventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, user } = useAuth();
  const isEdit = Boolean(id);
  const { items: eventTypes } = useOrgCollection(COLLECTIONS.EVENT_TYPES);
  const { items: inventoryItems } = useOrgCollection(COLLECTIONS.INVENTORY);
  const { data: existing } = useDoc(COLLECTIONS.EVENTS, id);
  const [attachedItems, setAttachedItems] = useState([]);
  const [picker, setPicker] = useState({ itemId: '', variantId: '', quantity: 1 });
  const [priceMode, setPriceMode] = useState('TIER');
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [customPrice, setCustomPrice] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      eventTypeId: '',
      status: 'SCHEDULED',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      venue: '',
      scheduledDate: '',
      scheduledTime: '',
      guestCount: 1,
      priceMode: 'TIER',
      selectedPricingTierId: null,
      customPrice: '',
      initialDeposit: '',
    },
  });

  useEffect(() => {
    if (!existing) return;
    const item = existing;
    if (item) {
      const initialPayments = Array.isArray(item.payments) ? item.payments : [];
      const initialPaid = initialPayments.reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0
      );
      const mode = item.priceMode || (item.customPrice != null ? 'CUSTOM' : 'TIER');
      const tier = item.selectedPricingTierId || null;
      const custom = item.customPrice != null ? String(item.customPrice) : '';
      reset({
        title: item.title,
        eventTypeId: item.eventTypeId || '',
        status: item.status || 'SCHEDULED',
        clientName: item.clientName || '',
        clientPhone: item.clientPhone || '',
        clientEmail: item.clientEmail || '',
        venue: item.venue || '',
        scheduledDate: item.scheduledDate || '',
        scheduledTime: item.scheduledTime || '',
        guestCount: item.guestCount || 1,
        priceMode: mode,
        selectedPricingTierId: tier,
        customPrice: custom,
        initialDeposit: isEdit ? '' : String(initialPaid || ''),
      });
      setPriceMode(mode);
      setSelectedTierId(tier);
      setCustomPrice(custom);
      setInitialDeposit(isEdit ? '' : String(initialPaid || ''));
      setAttachedItems(item.attachedItems || []);
    }
  }, [existing, isEdit, reset]);

  const watchedEventTypeId = watch('eventTypeId');
  const watchedGuestCount = watch('guestCount');

  const selectedType = useMemo(
    () => eventTypes.find((t) => t.id === watchedEventTypeId),
    [eventTypes, watchedEventTypeId]
  );

  const sortedTiers = useMemo(() => {
    if (!selectedType) return [];
    return [...(selectedType.pricingTiers || [])].sort(
      (a, b) => a.guestCount - b.guestCount
    );
  }, [selectedType]);

  const matchedTier = useMemo(() => {
    if (!selectedType || !watchedGuestCount) return null;
    const gc = Number(watchedGuestCount);
    const fit = sortedTiers.find((t) => t.guestCount >= gc);
    return fit || sortedTiers[sortedTiers.length - 1] || null;
  }, [selectedType, watchedGuestCount, sortedTiers]);

  useEffect(() => {
    if (priceMode !== 'TIER') return;
    if (selectedTierId) {
      const exists = sortedTiers.some((t) => t.id === selectedTierId);
      if (!exists) setSelectedTierId(matchedTier?.id || null);
    } else if (matchedTier) {
      setSelectedTierId(matchedTier.id);
    }
  }, [priceMode, matchedTier, sortedTiers, selectedTierId]);

  const selectedTier = useMemo(
    () => sortedTiers.find((t) => t.id === selectedTierId) || null,
    [sortedTiers, selectedTierId]
  );

  const chargedPrice = useMemo(() => {
    if (priceMode === 'CUSTOM') {
      const n = Number(customPrice);
      return Number.isFinite(n) ? n : 0;
    }
    return selectedTier ? Number(selectedTier.price) || 0 : matchedTier ? Number(matchedTier.price) || 0 : 0;
  }, [priceMode, customPrice, selectedTier, matchedTier]);

  const selectedInventoryItem = useMemo(
    () => inventoryItems.find((i) => i.id === picker.itemId),
    [inventoryItems, picker.itemId]
  );

  const addAttachment = () => {
    if (!selectedInventoryItem) {
      toast.error('Select an item');
      return;
    }
    const variant = (selectedInventoryItem.variants || []).find(
      (v) => v.id === picker.variantId
    );
    if (selectedInventoryItem.variants?.length > 0 && !variant) {
      toast.error('Select a variant');
      return;
    }
    const qty = Number(picker.quantity) || 1;
    const newAttach = {
      id: uuidv4(),
      inventoryItemId: selectedInventoryItem.id,
      variantId: variant?.id || null,
      quantity: qty,
      snapshotName: selectedInventoryItem.name,
      snapshotSize: variant?.size || null,
      snapshotPrice: variant?.pricePerUnit ?? 0,
    };
    setAttachedItems((prev) => [...prev, newAttach]);
    setPicker({ itemId: '', variantId: '', quantity: 1 });
  };

  const removeAttachment = (aid) =>
    setAttachedItems((prev) => prev.filter((a) => a.id !== aid));

  const totalItemCost = useMemo(
    () =>
      attachedItems.reduce(
        (sum, a) => sum + (a.snapshotPrice || 0) * a.quantity,
        0
      ),
    [attachedItems]
  );

  const onSubmit = async (data) => {
    if (!currentOrg) return;
    const numericDeposit = Number(data.initialDeposit) || 0;
    const initialPayments = !isEdit && numericDeposit > 0
      ? [buildNewPayment({
          amount: numericDeposit,
          date: new Date().toISOString().slice(0, 10),
          note: 'Initial deposit',
          recordedBy: user?.displayName,
        })]
      : [];

    const priceModeValue = data.priceMode || 'TIER';
    const tierId = priceModeValue === 'TIER'
      ? (selectedTier?.id || matchedTier?.id || null)
      : null;
    const customPriceValue = priceModeValue === 'CUSTOM'
      ? Number(data.customPrice) || 0
      : null;

    if (isEdit) {
      const updates = {
        title: data.title,
        eventTypeId: data.eventTypeId,
        status: data.status,
        clientName: data.clientName,
        clientPhone: data.clientPhone || '',
        clientEmail: data.clientEmail || '',
        venue: data.venue,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        guestCount: Number(data.guestCount),
        notes: data.notes || '',
        priceMode: priceModeValue,
        selectedPricingTierId: tierId,
        customPrice: customPriceValue,
        totalPrice: chargedPrice,
        attachedItems,
        updatedBy: user?.uid,
      };
      await updateDocFields(COLLECTIONS.EVENTS, id, updates);
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'UPDATED',
        entityType: 'EVENT',
        entityId: id,
        entityName: data.title,
        details: `Updated event ${data.title}`,
      });
      toast.success('Event updated');
      navigate(`/events/${id}`);
    } else {
      if (data.scheduledDate) {
        const today = new Date().toISOString().split('T')[0];
        if (data.scheduledDate < today) {
          toast.error('Date cannot be in the past');
          return;
        }
      }
      const newId = await createDoc(COLLECTIONS.EVENTS, {
        organizationId: currentOrg.id,
        title: data.title,
        eventTypeId: data.eventTypeId,
        clientName: data.clientName,
        clientPhone: data.clientPhone || '',
        clientEmail: data.clientEmail || '',
        venue: data.venue,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        guestCount: Number(data.guestCount),
        priceMode: priceModeValue,
        selectedPricingTierId: tierId,
        customPrice: customPriceValue,
        totalPrice: chargedPrice,
        status: data.status,
        attachedItems,
        notes: data.notes || '',
        payments: initialPayments,
        createdBy: user?.uid,
      });
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'CREATED',
        entityType: 'EVENT',
        entityId: newId,
        entityName: data.title,
        details: `Created event ${data.title}`,
      });
      if (numericDeposit > 0) {
        await writeAuditLog({
          organizationId: currentOrg.id,
          userId: user?.uid,
          userName: user?.displayName,
          action: 'PAYMENT_RECORDED',
          entityType: 'EVENT',
          entityId: newId,
          entityName: data.title,
          details: `Initial deposit of ${numericDeposit}`,
        });
      }
      toast.success('Event created');
      navigate(`/events/${newId}`);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title={isEdit ? 'Edit Event' : 'New Event'}
        subtitle={isEdit ? 'Update event details.' : 'Plan a new event for your client.'}
        actions={
          <Link to={isEdit ? `/events/${id}` : '/events'}>
            <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Event Details</h2>
          <div className="space-y-4">
            <Input label="Title" {...register('title')} error={errors.title?.message} placeholder="Moyo-Dube Wedding" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Event Type"
                {...register('eventTypeId')}
                error={errors.eventTypeId?.message}
                placeholder="Select type"
                options={eventTypes.map((t) => ({ value: t.id, label: t.name }))}
              />
              <Select
                label="Status"
                {...register('status')}
                error={errors.status?.message}
                options={EVENT_STATUSES.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Client Details</h2>
          <div className="space-y-4">
            <Input label="Client Name" {...register('clientName')} error={errors.clientName?.message} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Phone (optional)" {...register('clientPhone')} error={errors.clientPhone?.message} />
              <Input label="Email (optional)" type="email" {...register('clientEmail')} error={errors.clientEmail?.message} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Venue" {...register('venue')} error={errors.venue?.message} className="md:col-span-3" />
            <Input label="Date" type="date" {...register('scheduledDate')} error={errors.scheduledDate?.message} />
            <Input label="Time" type="time" {...register('scheduledTime')} error={errors.scheduledTime?.message} />
            <Input
              label="Guest Count"
              type="number"
              min="1"
              {...register('guestCount')}
              error={errors.guestCount?.message}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Tag size={18} /> Pricing
          </h2>
          <div className="space-y-4">
            <input type="hidden" {...register('priceMode')} value={priceMode} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriceMode('TIER')}
                className={`text-left p-4 rounded-xl border transition ${
                  priceMode === 'TIER'
                    ? 'border-app-accent bg-app-accent-light/40 ring-2 ring-app-accent/40'
                    : 'border-app-border hover:border-app-text-muted'
                }`}
              >
                <p className="font-medium text-sm">Use Pricing Tier</p>
                <p className="text-xs text-app-text-muted mt-1">
                  Pick one of this event type's pricing tiers.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPriceMode('CUSTOM')}
                className={`text-left p-4 rounded-xl border transition ${
                  priceMode === 'CUSTOM'
                    ? 'border-app-accent bg-app-accent-light/40 ring-2 ring-app-accent/40'
                    : 'border-app-border hover:border-app-text-muted'
                }`}
              >
                <p className="font-medium text-sm">Custom Price</p>
                <p className="text-xs text-app-text-muted mt-1">
                  Enter your own quoted amount for this event.
                </p>
              </button>
            </div>

            {priceMode === 'TIER' ? (
              <div className="space-y-3">
                {!selectedType ? (
                  <p className="text-sm text-app-text-muted">
                    Select an event type first to see its pricing tiers.
                  </p>
                ) : sortedTiers.length === 0 ? (
                  <p className="text-sm text-app-text-muted">
                    This event type has no pricing tiers. Switch to "Custom Price".
                  </p>
                ) : (
                  <Select
                    label="Pricing Tier"
                    value={selectedTierId || ''}
                    onChange={(e) => setSelectedTierId(e.target.value)}
                    options={sortedTiers.map((t) => ({
                      value: t.id,
                      label: `${t.guestCount} guests — ${t.description || 'Standard'} — ${formatCurrency(t.price)}`,
                    }))}
                  />
                )}
                {selectedTier && (
                  <p className="text-xs text-app-text-muted">
                    Tier price: <span className="font-mono text-app-text-primary">{formatCurrency(selectedTier.price)}</span>
                    {matchedTier && matchedTier.id === selectedTier.id && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Auto-matched for {watchedGuestCount} guests
                      </span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <Input
                label="Custom Price"
                type="number"
                min="0"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="0.00"
                leftIcon={<DollarSign size={16} />}
                hint="Enter the agreed price for this event."
              />
            )}

            <div className="pt-3 mt-1 border-t border-app-border flex items-center justify-between">
              <span className="text-sm text-app-text-muted">Total charged price</span>
              <span className="text-xl font-display font-semibold font-mono">
                {formatCurrency(chargedPrice)}
              </span>
            </div>
          </div>
        </Card>

        {!isEdit && (
          <Card>
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={18} /> Initial Deposit (optional)
            </h2>
            <Input
              label="Amount Paid Up Front"
              type="number"
              min="0"
              step="0.01"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
              placeholder="0.00"
              leftIcon={<DollarSign size={16} />}
              hint="If the client has already paid a deposit, record it here. You can record additional payments later from the event's detail page."
            />
          </Card>
        )}

        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Inventory Attachments</h2>
          {inventoryItems.length === 0 ? (
            <p className="text-sm text-app-text-muted">
              No inventory items available. Add inventory first.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-xl bg-app-bg-tertiary">
                <div className="md:col-span-5">
                  <Select
                    value={picker.itemId}
                    onChange={(e) => setPicker((p) => ({ ...p, itemId: e.target.value, variantId: '' }))}
                    placeholder="Choose item"
                    options={inventoryItems.map((i) => ({ value: i.id, label: i.name }))}
                  />
                </div>
                <div className="md:col-span-3">
                  {selectedInventoryItem && (selectedInventoryItem.variants || []).length > 0 ? (
                    <Select
                      value={picker.variantId}
                      onChange={(e) => setPicker((p) => ({ ...p, variantId: e.target.value }))}
                      placeholder="Size"
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
                  <Button type="button" onClick={addAttachment} className="w-full" leftIcon={<Plus size={14} />}>
                    Add
                  </Button>
                </div>
              </div>

              {attachedItems.length > 0 ? (
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
                      {attachedItems.map((a) => (
                        <tr key={a.id} className="border-t border-app-border">
                          <td className="px-3 py-2 font-medium">{a.snapshotName}</td>
                          <td className="px-3 py-2 text-app-text-secondary">{a.snapshotSize || '—'}</td>
                          <td className="px-3 py-2 text-right">{a.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatCurrency(a.snapshotPrice)}</td>
                          <td className="px-3 py-2 text-right font-mono font-medium">{formatCurrency(a.snapshotPrice * a.quantity)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeAttachment(a.id)}
                              className="p-1 rounded hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-danger"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-app-border bg-app-bg-tertiary">
                        <td colSpan="4" className="px-3 py-2 text-right font-medium">Total</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">{formatCurrency(totalItemCost)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-app-text-muted text-center py-4">
                  No items attached.
                </p>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Notes</h2>
          <Textarea
            {...register('notes')}
            placeholder="Any special instructions, color schemes, or details..."
          />
        </Card>

        <div className="flex justify-end gap-3">
          <Link to={isEdit ? `/events/${id}` : '/events'}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </form>
    </PageTransition>
  );
};

export default EventFormPage;
