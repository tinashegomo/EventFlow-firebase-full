import { query, where, getDocs, writeBatch, doc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';

const QUOTATION_ACTIVE_STATUSES = ['DRAFT', 'SENT'];

export const markExpiredQuotations = async (orgId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, COLLECTIONS.QUOTATIONS),
    where('organizationId', '==', orgId),
    where('status', 'in', QUOTATION_ACTIVE_STATUSES),
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  let updated = 0;
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.validUntil) {
      const validUntil = data.validUntil.toDate ? data.validUntil.toDate() : new Date(data.validUntil);
      if (validUntil < today) {
        batch.update(doc(db, COLLECTIONS.QUOTATIONS, d.id), {
          status: 'EXPIRED',
          updatedAt: serverTimestamp(),
        });
        updated++;
      }
    }
  });
  if (updated > 0) await batch.commit();
  return updated;
};
