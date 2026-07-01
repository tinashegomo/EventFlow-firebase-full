import { query, where, getDocs, writeBatch, doc, serverTimestamp, collection, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';

export const checkAndUpdateOverdueInvoices = async (orgId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, COLLECTIONS.INVOICES),
    where('organizationId', '==', orgId),
    where('status', 'in', ['UNPAID', 'PARTIAL']),
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  let updated = 0;
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.dueDate) {
      const due = data.dueDate.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
      if (due < today) {
        batch.update(doc(db, COLLECTIONS.INVOICES, d.id), {
          status: 'OVERDUE',
          updatedAt: serverTimestamp(),
        });
        updated++;
      }
    }
  });
  if (updated > 0) await batch.commit();
  return updated;
};

export const markInvoiceAsPaid = async (invoiceId, userId) => {
  await updateDoc(doc(db, COLLECTIONS.INVOICES, invoiceId), {
    status: 'PAID',
    paidAt: serverTimestamp(),
    paidBy: userId || null,
    updatedAt: serverTimestamp(),
  });
};
