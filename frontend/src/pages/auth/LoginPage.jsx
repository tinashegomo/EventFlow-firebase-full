import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '../../firebase/config';
import { ensureUserProfile } from '../../utils/userProfile';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const redirectAfterAuth = () => {
    const dest = location.state?.from?.pathname || '/dashboard';
    navigate(dest, { replace: true });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      await ensureUserProfile(cred.user);
      if (!cred.user.emailVerified) {
        navigate('/verify-email', { replace: true });
        return;
      }
      toast.success('Welcome back!');
      redirectAfterAuth();
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Enter your email above first');
      return;
    }
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Failed to send reset email');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-app-accent text-white items-center justify-center mb-4">
            <LogIn size={24} />
          </div>
          <h1 className="font-display text-3xl font-bold text-app-text-primary">
            Welcome back
          </h1>
          <p className="text-app-text-secondary mt-2">Sign in to your EventFlow account</p>
        </div>

        <div className="rounded-2xl border border-app-border bg-app-bg-secondary p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />
            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
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
                autoComplete="current-password"
                {...register('password')}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetting}
                className="text-xs text-app-accent hover:underline disabled:opacity-50"
              >
                {resetting ? 'Sending...' : 'Forgot password?'}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-app-text-secondary mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-app-accent font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
