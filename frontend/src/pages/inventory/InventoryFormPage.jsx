import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrgCollection, useDoc } from '../../hooks/useOrgCollection';
import {
  PageHeader,
  Card,
  Input,
  Textarea,
  Button,
  Select,
} from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { COLLECTIONS } from '../../firebase/collections';
import { createDoc, updateDocFields } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';
import { v4 as uuidv4 } from 'uuid';
import { INVENTORY_UNITS } from '../../utils/business';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string(),
  category: yup.string().required('Category is required'),
  unit: yup.string().required('Unit is required'),
});

const emptyVariant = () => ({
  id: uuidv4(),
  size: '',
  pricePerUnit: '',
  quantityInStock: '',
});

const InventoryFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg, user } = useAuth();
  const isEdit = Boolean(id);
  const [variants, setVariants] = useState([emptyVariant()]);
  const { items: allItems } = useOrgCollection(COLLECTIONS.INVENTORY);
  const { data: existing } = useDoc(COLLECTIONS.INVENTORY, id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: '', description: '', category: '', unit: 'piece' },
  });

  const existingCategories = useMemo(
    () => Array.from(new Set(allItems.map((i) => i.category).filter(Boolean))).sort(),
    [allItems]
  );

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description || '',
        category: existing.category || '',
        unit: existing.unit || 'piece',
      });
      setVariants(
        (existing.variants || []).map((v) => ({
          id: v.id || uuidv4(),
          size: v.size || '',
          pricePerUnit: v.pricePerUnit,
          quantityInStock: v.quantityInStock,
        }))
      );
    }
  }, [existing, reset]);

  const addVariant = () => setVariants((v) => [...v, emptyVariant()]);
  const removeVariant = (vid) => setVariants((v) => v.filter((x) => x.id !== vid));
  const updateVariant = (vid, key, val) =>
    setVariants((v) => v.map((x) => (x.id === vid ? { ...x, [key]: val } : x)));

  const onSubmit = async (data) => {
    if (!currentOrg) return;
    if (variants.length === 0) {
      toast.error('At least one variant is required');
      return;
    }
    const validVariants = variants
      .filter(
        (v) =>
          v.pricePerUnit !== '' &&
          v.quantityInStock !== '' &&
          !isNaN(v.pricePerUnit) &&
          !isNaN(v.quantityInStock)
      )
      .map((v) => ({
        id: v.id || uuidv4(),
        size: v.size || null,
        pricePerUnit: Number(v.pricePerUnit),
        quantityInStock: Number(v.quantityInStock),
      }));

    if (validVariants.length === 0) {
      toast.error('At least one variant with price and stock is required');
      return;
    }

    if (isEdit) {
      await updateDocFields(COLLECTIONS.INVENTORY, id, {
        ...data,
        variants: validVariants,
        updatedBy: user?.uid,
      });
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'UPDATED',
        entityType: 'INVENTORY_ITEM',
        entityId: id,
        entityName: data.name,
        details: `Updated inventory item ${data.name}`,
      });
      toast.success('Item updated');
    } else {
      const newId = await createDoc(COLLECTIONS.INVENTORY, {
        organizationId: currentOrg.id,
        name: data.name,
        description: data.description || '',
        category: data.category,
        unit: data.unit,
        variants: validVariants,
        createdBy: user?.uid,
      });
      await writeAuditLog({
        organizationId: currentOrg.id,
        userId: user?.uid,
        userName: user?.displayName,
        action: 'CREATED',
        entityType: 'INVENTORY_ITEM',
        entityId: newId,
        entityName: data.name,
        details: `Created inventory item ${data.name}`,
      });
      toast.success('Item created');
    }
    navigate('/inventory');
  };

  return (
    <PageTransition>
      <PageHeader
        title={isEdit ? 'Edit Inventory Item' : 'New Inventory Item'}
        subtitle="Add an item with size/price variants to attach to events."
        actions={
          <Link to="/inventory">
            <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back</Button>
          </Link>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <h2 className="text-lg font-display font-semibold mb-4">Details</h2>
          <div className="space-y-4">
            <Input label="Name" {...register('name')} error={errors.name?.message} placeholder="Frame Tent" />
            <Textarea label="Description" {...register('description')} placeholder="Heavy-duty aluminium frame marquee tent" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Input
                  label="Category"
                  {...register('category')}
                  error={errors.category?.message}
                  placeholder="Tents"
                  list="cat-list"
                />
                <datalist id="cat-list">
                  {existingCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <Select
                label="Unit"
                {...register('unit')}
                error={errors.unit?.message}
                placeholder="Choose unit"
                options={INVENTORY_UNITS.map((u) => ({ value: u, label: u }))}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Variants</h2>
            <Button type="button" size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={addVariant}>
              Add Variant
            </Button>
          </div>
          <div className="space-y-3">
            {variants.map((v) => (
              <div
                key={v.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-xl border border-app-border bg-app-bg-primary"
              >
                <div className="md:col-span-4">
                  <Input
                    placeholder="Size (e.g. 6m x 9m)"
                    value={v.size}
                    onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price / unit"
                    value={v.pricePerUnit}
                    onChange={(e) => updateVariant(v.id, 'pricePerUnit', e.target.value)}
                  />
                </div>
                <div className="md:col-span-4">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Qty in stock"
                    value={v.quantityInStock}
                    onChange={(e) => updateVariant(v.id, 'quantityInStock', e.target.value)}
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    disabled={variants.length === 1}
                    className="w-full md:w-auto p-2.5 rounded-xl border border-app-border hover:bg-app-bg-tertiary disabled:opacity-40"
                    aria-label="Remove variant"
                  >
                    <X size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/inventory">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Item'}
          </Button>
        </div>
      </form>
    </PageTransition>
  );
};

export default InventoryFormPage;
