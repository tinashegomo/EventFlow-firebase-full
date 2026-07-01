import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

const VerifyEmailPage = () => {
  const { firebaseUser, isEmailVerified, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }
  if (isEmailVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleResend = async () => {
    setSending(true);
    try {
      await sendEmailVerification(firebaseUser);
      toast.success('Verification email sent!');
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      await refreshUser();
      if (firebaseUser.emailVerified) {
        toast.success('Email verified!');
        navigate('/dashboard', { replace: true });
      } else {
        toast.error('Email not verified yet. Please check your inbox.');
      }
    } catch {
      toast.error('Failed to check status');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg-primary p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-app-accent text-white items-center justify-center mb-6">
          <Mail size={28} />
        </div>
        <h1 className="font-display text-3xl font-bold text-app-text-primary mb-3">
          Verify your email
        </h1>
        <p className="text-app-text-secondary mb-2">
          We sent a verification link to
        </p>
        <p className="font-medium text-app-text-primary mb-8">{firebaseUser.email}</p>
        <p className="text-sm text-app-text-muted mb-8">
          Click the link in the email to activate your account, then come back here.
        </p>

        <div className="rounded-2xl border border-app-border bg-app-bg-secondary p-6 space-y-3">
          <Button onClick={handleCheck} loading={checking} className="w-full">
            I&apos;ve verified my email
          </Button>
          <Button
            onClick={handleResend}
            loading={sending}
            variant="outline"
            className="w-full"
            leftIcon={<RefreshCw size={16} />}
          >
            Resend verification email
          </Button>
          <button
            onClick={signOut}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-app-text-secondary hover:text-app-text-primary hover:bg-app-bg-tertiary transition"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
