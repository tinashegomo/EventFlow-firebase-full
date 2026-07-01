import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';

export const coll = (name) => collection(db, name);

export const orgQuery = (collectionName, orgId, ...constraints) => {
  const q = query(
    collection(db, collectionName),
    where('organizationId', '==', orgId),
    ...constraints,
  );
  return q;
};

export const fetchOrgCollection = async (collectionName, orgId) => {
  const snap = await getDocs(orgQuery(collectionName, orgId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const fetchDoc = async (collectionName, id) => {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const createDoc = async (collectionName, data) => {
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, collectionName), payload);
  return ref.id;
};

export const setDocWithId = async (collectionName, id, data) => {
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, collectionName, id), payload);
  return id;
};

export const updateDocFields = async (collectionName, id, data) => {
  const payload = { ...data, updatedAt: serverTimestamp() };
  await updateDoc(doc(db, collectionName, id), payload);
};

export const deleteDocById = async (collectionName, id) => {
  await deleteDoc(doc(db, collectionName, id));
};

export const subscribeToOrgCollection = (
  collectionName,
  orgId,
  callback,
  errorCallback,
) => {
  return onSnapshot(
    orgQuery(collectionName, orgId),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    errorCallback,
  );
};

export const subscribeToDoc = (collectionName, id, callback, errorCallback) => {
  return onSnapshot(
    doc(db, collectionName, id),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    errorCallback,
  );
};

export const getNextNumber = async (prefix, orgId) => {
  const year = new Date().getFullYear();
  const counterId = `${orgId}_${prefix}_${year}`;
  const counterRef = doc(db, COLLECTIONS.COUNTERS, counterId);

  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? snap.data().value || 0 : 0;
    const newValue = current + 1;
    tx.set(counterRef, {
      value: newValue,
      prefix,
      organizationId: orgId,
      year,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return newValue;
  });

  const padded = String(next).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
};
