import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '../../firebase/config';
import { createUserProfile } from '../../utils/userProfile';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const schema = yup.object({
  fullName: yup.string().min(2, 'Name must be at least 2 characters').required('Full name is required'),
  orgName: yup.string().min(2, 'Organization name is required').required('Organization name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.fullName });
      await createUserProfile(cred.user, data.fullName, data.orgName);
      await sendEmailVerification(cred.user);
      toast.success('Account created! Check your email to verify.');
      navigate('/verify-email', { replace: true });
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-app-accent text-white items-center justify-center mb-4">
            <UserPlus size={24} />
          </div>
          <h1 className="font-display text-3xl font-bold text-app-text-primary">
            Create your account
          </h1>
          <p className="text-app-text-secondary mt-2">Start managing your events in minutes</p>
        </div>

        <div className="rounded-2xl border border-app-border bg-app-bg-secondary p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              placeholder="Jane Doe"
              leftIcon={<User size={16} />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Organization name"
              placeholder="Acme Events"
              leftIcon={<Building2 size={16} />}
              error={errors.orgName?.message}
              {...register('orgName')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 6 characters"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-app-text-muted hover:text-app-text-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              autoComplete="new-password"
              {...register('password')}
            />
            <Input
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              {...register('confirmPassword')}
            />

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
            <p className="text-xs text-app-text-muted text-center">
              We&apos;ll send a verification link to your email.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-app-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-app-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
