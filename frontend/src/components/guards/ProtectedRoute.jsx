import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/config';
import { ensureUserProfile } from '../../utils/userProfile';
import { Button } from '../ui';

const ProtectedRoute = ({ children }) => {
  const ctx = useAuth();
  const location = useLocation();
  const [recovering, setRecovering] = useState(false);

  if (!ctx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg-primary">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const { firebaseUser, user: profile, loading, isEmailVerified, signOut } = ctx;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg-primary">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!profile) {
    const handleRecover = async () => {
      if (!auth.currentUser) return;
      setRecovering(true);
      try {
        await ensureUserProfile(auth.currentUser);
        toast.success('Profile created — reloading…');
        window.location.reload();
      } catch (err) {
        toast.error(err.message?.replace('Firebase: ', '') || 'Could not create profile');
        setRecovering(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg-primary p-4">
        <div className="max-w-md w-full rounded-2xl border border-app-border bg-app-bg-secondary p-8 text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 items-center justify-center mb-4">
            <AlertTriangle size={20} />
          </div>
          <h2 className="font-display text-xl font-semibold text-app-text-primary mb-2">
            Profile missing
          </h2>
          <p className="text-sm text-app-text-secondary mb-3">
            We couldn&apos;t find your profile document. Click below to create it.
          </p>
          <p className="text-xs text-app-text-muted mb-6">
            Signed-in as{' '}
            <strong>{firebaseUser.email}</strong>
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleRecover} loading={recovering} leftIcon={<RefreshCw size={16} />}>
              Create profile now
            </Button>
            <Button onClick={signOut} variant="ghost" leftIcon={<LogOut size={16} />}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

