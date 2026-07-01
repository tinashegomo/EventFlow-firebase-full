import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X, Tag } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader,
  Card,
  Input,
  Textarea,
  Button,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { COLLECTIONS } from '../../firebase/collections';
import { useDoc } from '../../hooks/useOrgCollection';
import { createDoc, updateDocFields } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { v4 as uuidv4 } from 'uuid';
import {
  EVENT_TYPE_SUGGESTIONS,
  EVENT_TYPE_ICONS,
  EVENT_TYPE_COLORS,
} from '../../utils/business';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string(),
  icon: yup.string().required('Pick an icon'),
  color: yup.string().required('Pick a color'),
});

const emptyTier = () => ({
  id: uuidv4(),
  guestCount: '',
  price: '',
  description: '',
});

const EventTypeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, user } = useAuth();
  const isEdit = Boolean(id);
  const [tiers, setTiers] = useState([emptyTier()]);
  const { data: existing } = useDoc(COLLECTIONS.EVENT_TYPES, id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: '', description: '', icon: 'Heart', color: '#E91E8C' },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description || '',
        icon: existing.icon || 'Heart',
        color: existing.color || '#E91E8C',
      });
      setTiers(
        (existing.pricingTiers || []).map((t) => ({
          id: t.id || uuidv4(),
          guestCount: t.guestCount,
          price: t.price,
          description: t.description || '',
        }))
      );
    }
  }, [existing, reset]);

  const watchedIcon = watch('icon');
  const watchedColor = watch('color');
  const watchedName = watch('name');

  const addTier = () => setTiers((t) => [...t, emptyTier()]);
  const removeTier = (tid) => setTiers((t) => t.filter((x) => x.id !== tid));
  const updateTier = (tid, key, val) =>
    setTiers((t) => t.map((x) => (x.id === tid ? { ...x, [key]: val } : x)));

  const applySuggestion = (s) => {
    setValue('name', s.name, { shouldValidate: true });
    setValue('icon', s.icon, { shouldValidate: true });
    setValue('color', s.color, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    if (!currentOrg) return;
    if (tiers.length === 0) {
      toast.error('At least one pricing tier is required');
      return;
    }
    const validTiers = tiers.filter(
      (t) => t.guestCount !== '' && t.price !== '' && !isNaN(t.guestCount) && !isNaN(t.price)
    );
    if (validTiers.length === 0) {
      toast.error('At least one pricing tier with guest count and price is required');
      return;
    }
    const sortedTiers = validTiers
      .sort((a, b) => Number(a.guestCount) - Number(b.guestCount))
      .map((t) => ({
        id: t.id || uuidv4(),
        guestCount: Number(t.guestCount),
        price: Number(t.price),
        description: t.description || '',
      }));

    if (isEdit) {
      await updateDocFields(COLLECTIONS.EVENT_TYPES, id, {
        ...data,
        pricingTiers: sortedTiers,
        updatedBy: user?.uid,
      });
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'UPDATED',
        entityType: 'EVENT_TYPE',
        entityId: id,
        entityName: data.name,
        details: `Updated event type ${data.name}`,
      });
      toast.success('Event type updated');
    } else {
      const newId = await createDoc(COLLECTIONS.EVENT_TYPES, {
        organizationId: currentOrg.id,
        name: data.name,
        description: data.description || '',
        icon: data.icon,
        color: data.color,
        pricingTiers: sortedTiers,
        createdBy: user?.uid,
      });
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'CREATED',
        entityType: 'EVENT_TYPE',
        entityId: newId,
        entityName: data.name,
        details: `Created event type ${data.name}`,
      });
      toast.success('Event type created');
    }
    navigate('/event-types');
  };

  return (
    <PageTransition>
      <PageHeader
        title={isEdit ? 'Edit Event Type' : 'New Event Type'}
        subtitle="Configure a category of events with tiered pricing."
        actions={
          <Link to="/event-types">
            <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </Link>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Details</h2>
          <div className="space-y-4">
            <Input label="Name" {...register('name')} error={errors.name?.message} placeholder="Wedding" />
            <Textarea label="Description" {...register('description')} placeholder="Full wedding ceremony and reception management" />

            <div>
              <p className="block text-sm font-medium mb-2">Quick Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPE_SUGGESTIONS.map((s) => (
                  <button
                    type="button"
                    key={s.name}
                    onClick={() => applySuggestion(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      watchedName === s.name
                        ? 'bg-app-accent-light text-app-accent-dark border-app-accent'
                        : 'border-app-border hover:bg-app-bg-tertiary'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium mb-2">Icon</p>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {EVENT_TYPE_ICONS.map((name) => {
                  const Icon = LucideIcons[name] || Tag;
                  return (
                    <button
                      type="button"
                      key={name}
                      onClick={() => setValue('icon', name, { shouldValidate: true })}
                      className={`aspect-square flex items-center justify-center rounded-xl border transition ${
                        watchedIcon === name
                          ? 'border-app-accent bg-app-accent-light text-app-accent-dark'
                          : 'border-app-border hover:bg-app-bg-tertiary'
                      }`}
                    >
                      <Icon size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPE_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setValue('color', c, { shouldValidate: true })}
                    className={`w-9 h-9 rounded-xl border-2 transition ${
                      watchedColor === c
                        ? 'border-app-text-primary scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Pricing Tiers</h2>
            <Button type="button" size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={addTier}>
              Add Tier
            </Button>
          </div>
          <div className="space-y-3">
            {tiers.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-xl border border-app-border bg-app-bg-primary"
              >
                <div className="md:col-span-3">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Guest count"
                    value={t.guestCount}
                    onChange={(e) => updateTier(t.id, 'guestCount', e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price (USD)"
                    value={t.price}
                    onChange={(e) => updateTier(t.id, 'price', e.target.value)}
                  />
                </div>
                <div className="md:col-span-5">
                  <Input
                    placeholder="Description (e.g. Intimate)"
                    value={t.description}
                    onChange={(e) => updateTier(t.id, 'description', e.target.value)}
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeTier(t.id)}
                    disabled={tiers.length === 1}
                    className="w-full md:w-auto p-2.5 rounded-xl border border-app-border hover:bg-app-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Remove tier"
                  >
                    <X size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/event-types">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Event Type'}
          </Button>
        </div>
      </form>
    </PageTransition>
  );
};

export default EventTypeFormPage;
