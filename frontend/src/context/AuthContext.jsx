import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  reload,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';
import { updateDocFields } from '../firebase/db';
import { ensureUserProfile } from '../utils/userProfile';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadOrg = async (orgId) => {
      if (!orgId) {
        setOrganization(null);
        return;
      }
      const orgRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
      try {
        const snap = await getDocFromServer(orgRef);
        if (cancelled) return;
        if (snap.exists()) {
          setOrganization({ id: snap.id, ...snap.data() });
        } else {
          setOrganization(null);
        }
      } catch {
        if (cancelled) return;
        setOrganization(null);
      }
    };

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      setFirebaseUser(user);
      setProfile(null);
      setOrganization(null);
      setProfileError(null);

      if (!user) {
        setLoading(false);
        return;
      }

      const userRef = doc(db, COLLECTIONS.USERS, user.uid);

      const fetchProfile = async () => {
        try {
          // Force token refresh so Firestore sees a fully-valid auth context.
          // onAuthStateChanged gives us the user object before the ID token
          // is necessarily ready for outbound calls; without this, the read
          // can return exists() === false on cold start even when the doc
          // is there (the diagnostic from the same browser, seconds later,
          // returns it fine).
          await user.getIdToken(/* forceRefresh */ true);

          let snap = await getDocFromServer(userRef);
          if (!snap.exists()) {
            // Cold-start race: server said missing, but the doc should be
            // there. ensureUserProfile is idempotent — no-op if it exists,
            // creates it if it really is missing — then re-read.
            const createdProfile = await ensureUserProfile(user);
            if (cancelled) return;

            // Brief delay to let Firestore propagate the write
            await new Promise((r) => setTimeout(r, 500));
            snap = await getDocFromServer(userRef);

            // If the re-read still fails, use the profile returned by
            // ensureUserProfile directly (it was just written successfully).
            if (!snap.exists() && createdProfile) {
              if (cancelled) return;
              const data = { id: user.uid, ...createdProfile };
              setProfile(data);
              loadOrg(data.organizationId);
              return;
            }
          }

          if (cancelled) return;
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() };
            setProfile(data);
            loadOrg(data.organizationId);
          } else {
            setProfile(null);
            setOrganization(null);
          }
        } catch (err) {
          if (cancelled) return;
          setProfileError(err);
          setProfile(null);
          setOrganization(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      fetchProfile();
    });

    return () => {
      cancelled = true;
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    if (profile && profile.emailVerified === firebaseUser.emailVerified) return;
    updateDocFields(COLLECTIONS.USERS, firebaseUser.uid, {
      emailVerified: !!firebaseUser.emailVerified,
    }).catch(() => {
      // Non-fatal: the field is best-effort metadata, not an auth gate.
    });
  }, [firebaseUser, profile]);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      try {
        await reload(auth.currentUser);
      } catch {
        // Non-fatal: reload() can fail transiently (e.g. INVALID_ID_TOKEN / 400
        // from identitytoolkit during session refresh). The local User object's
        // emailVerified flag will resync on the next onAuthStateChanged tick.
      }
      setFirebaseUser({ ...auth.currentUser });
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email || firebaseUser?.email);
  }, [firebaseUser?.email]);

  const value = {
    firebaseUser,
    user: profile,
    organization,
    currentOrg: organization,
    loading,
    profileError,
    isAuthenticated: !!firebaseUser,
    isEmailVerified: !!firebaseUser?.emailVerified,
    isAdmin: profile?.role === 'ADMIN',
    signOut,
    refreshUser,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
