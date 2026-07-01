import { v4 as uuidv4 } from 'uuid';
import { serverTimestamp } from 'firebase/firestore';

export const getPaymentsForEvent = (event) => event?.payments || [];

export const getTotalPaid = (event) => {
  if (!event?.payments) return 0;
  return event.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
};

export const getBalance = (event) => {
  const charged = Number(event?.totalPrice || 0);
  return Math.max(0, charged - getTotalPaid(event));
};

export const computePaymentStatus = (event) => {
  if (!event?.totalPrice) return 'UNPAID';
  const paid = getTotalPaid(event);
  if (paid <= 0) return 'UNPAID';
  if (paid >= Number(event.totalPrice)) return 'PAID';
  return 'PARTIAL';
};

export const getChargedPrice = (event) => Number(event?.totalPrice || 0);

export const buildPaymentSummary = (event) => {
  const charged = getChargedPrice(event);
  const paid = getTotalPaid(event);
  const balance = Math.max(0, charged - paid);
  const status = computePaymentStatus(event);
  const percent = charged > 0 ? Math.min(100, Math.round((paid / charged) * 100)) : 0;
  return { charged, paid, balance, status, percent, count: event?.payments?.length || 0 };
};

export const buildNewPayment = ({ amount, date, note, recordedBy }) => ({
  id: uuidv4(),
  amount: Number(amount),
  date: date || new Date().toISOString().slice(0, 10),
  note: note || '',
  recordedBy: recordedBy || '',
  createdAt: serverTimestamp(),
});
