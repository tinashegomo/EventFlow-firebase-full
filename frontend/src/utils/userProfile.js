import { doc, setDoc, serverTimestamp, getDocFromServer, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';

/**
 * Creates the user profile doc and a matching organization doc if they don't
 * already exist. Returns the profile (id included) on success.
 *
 * Idempotent: if a profile already exists, returns the existing data without
 * overwriting. Safe to call from any sign-in path.
 *
 * Used by RegisterPage (new user, new org) and LoginPage (defense in depth for
 * any user whose profile doc was deleted from Firestore).
 */
export const createUserProfile = async (firebaseUser, displayName, orgName) => {
  const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
  const userSnap = await getDocFromServer(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }

  const orgRef = doc(collection(db, COLLECTIONS.ORGANIZATIONS));
  const orgId = orgRef.id;
  await setDoc(orgRef, {
    name: orgName || 'My Organization',
    logo: '',
    ownerId: firebaseUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const profile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: displayName || firebaseUser.displayName || 'User',
    photoURL: firebaseUser.photoURL || '',
    organizationId: orgId,
    role: 'ADMIN',
    emailVerified: firebaseUser.emailVerified,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(userRef, profile);
  return { id: userRef.id, ...profile };
};

/**
 * Ensures the current user has both a profile and a valid org. If the
 * profile is missing, creates one with a default org derived from the email
 * domain. If it already exists, returns it unchanged.
 *
 * Designed to be called right after a Firebase Auth sign-in completes.
 */
export const ensureUserProfile = async (firebaseUser) => {
  const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
  const userSnap = await getDocFromServer(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  const fallbackOrg = (firebaseUser.email || 'user@example.com')
    .split('@')[1]
    ?.split('.')[0] || 'My Organization';
  return createUserProfile(firebaseUser, firebaseUser.displayName, fallbackOrg);
};
