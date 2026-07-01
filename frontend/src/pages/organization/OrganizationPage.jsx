import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Card, Input, Button } from '../../components/ui';
import PageTransition from '../../components/layout/PageTransition';
import { COLLECTIONS } from '../../firebase/collections';
import { updateDocFields } from '../../firebase/db';
import { writeAuditLog } from '../../utils/audit';

const schema = yup.object({
  name: yup.string().required('Organization name is required'),
});

const OrganizationPage = () => {
  const { currentOrg, user } = useAuth();
  const fileRef = useRef(null);
  const [logoBase64, setLogoBase64] = useState(currentOrg?.logo || null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: currentOrg?.name || '',
    },
  });

  useEffect(() => {
    if (currentOrg) {
      reset({ name: currentOrg.name });
      setLogoBase64(currentOrg.logo || null);
    }
  }, [currentOrg, reset]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > 1_000_000) {
      toast.error('Logo must be under 1MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    if (!currentOrg) return;
    const updates = { name: data.name, logo: logoBase64 || '' };
    await updateDocFields(COLLECTIONS.ORGANIZATIONS, currentOrg.id, updates);
    await writeAuditLog({
      organizationId: currentOrg.id,
      userId: user?.uid,
      userName: user?.displayName,
      action: 'UPDATED',
      entityType: 'ORGANIZATION',
      entityId: currentOrg.id,
      entityName: data.name,
      details: 'Updated organization profile',
    });
    toast.success('Organization updated');
  };

  const initials = (currentOrg?.name || 'EF')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <PageTransition>
      <PageHeader
        title="Organization"
        subtitle="Manage your company profile."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex flex-col items-center text-center">
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-app-border hover:border-app-accent flex items-center justify-center cursor-pointer bg-app-bg-tertiary mb-4 group"
            >
              {logoBase64 ? (
                <img src={logoBase64} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-display font-semibold text-app-text-muted">
                  {initials}
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                <Upload
                  size={20}
                  className="text-white opacity-0 group-hover:opacity-100 transition"
                />
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            <p className="text-sm font-medium">Click to upload logo</p>
            <p className="text-xs text-app-text-muted mt-1">PNG, JPG up to ~1MB</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLogoBase64(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="mt-3"
              disabled={!logoBase64}
            >
              Remove logo
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-display font-semibold mb-4">Profile Details</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Organization Name" {...register('name')} error={errors.name?.message} />
            <div className="flex justify-end gap-3">
              <Button type="submit" loading={isSubmitting} disabled={!isDirty && !logoBase64}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
};

export default OrganizationPage;
