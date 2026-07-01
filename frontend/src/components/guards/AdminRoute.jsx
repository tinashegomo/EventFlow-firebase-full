import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, getDocFromServer } from 'firebase/firestore';
import { AlertTriangle, Lock, LogOut, RefreshCw, Bug } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../firebase/config';
import { COLLECTIONS } from '../../firebase/collections';
import { ensureUserProfile } from '../../utils/userProfile';
import { Button } from '../ui';

const AdminRoute = ({ children }) => {
  const ctx = useAuth();
  const [recovering, setRecovering] = useState(false);
  const [diagnostic, setDiagnostic] = useState(null);
  const [diagnosing, setDiagnosing] = useState(false);

  if (!ctx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg-primary">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const { isAdmin, user: profile, loading, firebaseUser, profileError, signOut } = ctx;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg-primary">
        <div className="animate-spin w-8 h-8 border-2 border-app-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile && firebaseUser) {
    if (profileError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-app-bg-primary p-4">
          <div className="max-w-md w-full rounded-2xl border border-app-danger/30 bg-app-bg-secondary p-8 text-center">
            <div className="inline-flex w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 items-center justify-center mb-4">
              <Lock size={20} />
            </div>
            <h2 className="font-display text-xl font-semibold text-app-text-primary mb-2">
              Profile unreadable
            </h2>
            <p className="text-sm text-app-text-secondary mb-3">
              Your account is signed in, but the app can&apos;t read your user
              document from Firestore.
            </p>
            <p className="text-xs text-app-text-muted mb-1">
              Signed-in UID:{' '}
              <code className="text-xs bg-app-bg-tertiary px-1.5 py-0.5 rounded break-all">
                {firebaseUser.uid}
              </code>
            </p>
            <p className="text-xs text-app-text-muted mb-1">
              Expected doc path:{' '}
              <code className="text-xs bg-app-bg-tertiary px-1.5 py-0.5 rounded">
                users/{firebaseUser.uid}
              </code>
            </p>
            <p className="text-xs text-app-text-muted mt-2 mb-1">
              Most likely cause: <strong>Firestore security rules</strong> are
              blocking reads. Update the rules in Firebase Console →
              Firestore → Rules.
            </p>
            <p className="text-xs text-app-text-muted mt-2 mb-6">
              Error code: <code className="text-xs bg-app-bg-tertiary px-1.5 py-0.5 rounded">{profileError.code || 'unknown'}</code>
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.reload()} leftIcon={<RefreshCw size={16} />}>
                Retry
              </Button>
              <Button onClick={signOut} variant="ghost" leftIcon={<LogOut size={16} />}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      );
    }

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

    const runDiagnostic = async () => {
      if (!auth.currentUser) return;
      setDiagnosing(true);
      try {
        const userRef = doc(db, COLLECTIONS.USERS, auth.currentUser.uid);
        const snap = await getDocFromServer(userRef);
        if (snap.exists()) {
          setDiagnostic({
            ok: true,
            projectId: db.app.options.projectId,
            uid: auth.currentUser.uid,
            data: snap.data(),
          });
        } else {
          setDiagnostic({
            ok: false,
            reason: 'doc-missing',
            projectId: db.app.options.projectId,
            uid: auth.currentUser.uid,
            path: `users/${auth.currentUser.uid}`,
          });
        }
      } catch (err) {
        setDiagnostic({
          ok: false,
          reason: 'error',
          code: err.code,
          message: err.message,
          projectId: db.app.options.projectId,
          uid: auth.currentUser.uid,
        });
      } finally {
        setDiagnosing(false);
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
            We couldn&apos;t find a profile document for{' '}
            <strong>{firebaseUser.email}</strong> in Firestore.
          </p>
          <p className="text-xs text-app-text-muted mb-1">
            Signed-in UID:{' '}
            <code className="text-xs bg-app-bg-tertiary px-1.5 py-0.5 rounded break-all">
              {firebaseUser.uid}
            </code>
          </p>
          <p className="text-xs text-app-text-muted mb-6">
            Expected doc path:{' '}
            <code className="text-xs bg-app-bg-tertiary px-1.5 py-0.5 rounded">
              users/{firebaseUser.uid}
            </code>
            . Click below to recreate it, or sign out and sign in again.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleRecover} loading={recovering} leftIcon={<RefreshCw size={16} />}>
              Create profile now
            </Button>
            <Button onClick={runDiagnostic} loading={diagnosing} variant="outline" leftIcon={<Bug size={16} />}>
              Run diagnostic
            </Button>
            <Button onClick={signOut} variant="ghost" leftIcon={<LogOut size={16} />}>
              Sign out
            </Button>
          </div>
          {diagnostic && (
            <div className="mt-6 text-left rounded-xl border border-app-border bg-app-bg-primary p-4 text-xs space-y-2">
              <p className="font-semibold text-app-text-primary">
                {diagnostic.ok ? 'Diagnostic: doc found' : `Diagnostic: ${diagnostic.reason}`}
              </p>
              <p className="text-app-text-muted">
                Project: <code className="bg-app-bg-tertiary px-1 py-0.5 rounded">{diagnostic.projectId}</code>
              </p>
              <p className="text-app-text-muted break-all">
                UID: <code className="bg-app-bg-tertiary px-1 py-0.5 rounded">{diagnostic.uid}</code>
              </p>
              {diagnostic.reason === 'error' && (
                <>
                  <p className="text-app-danger">
                    Code: <code className="bg-app-bg-tertiary px-1 py-0.5 rounded">{diagnostic.code}</code>
                  </p>
                  <p className="text-app-text-muted break-all">{diagnostic.message}</p>
                </>
              )}
              {diagnostic.reason === 'doc-missing' && (
                <p className="text-app-text-muted">
                  Path <code className="bg-app-bg-tertiary px-1 py-0.5 rounded">{diagnostic.path}</code> returned no document.
                </p>
              )}
              {diagnostic.ok && (
                <pre className="text-app-text-muted overflow-auto max-h-40 whitespace-pre-wrap break-all">
                  {JSON.stringify(diagnostic.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
