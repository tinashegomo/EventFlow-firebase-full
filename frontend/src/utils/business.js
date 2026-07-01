export const computeQuotationTotals = (lineItems, discountPercent = 0, taxPercent = 0) => {
  const subtotal = (lineItems || []).reduce(
    (sum, li) => sum + (Number(li.quantity) || 0) * (Number(li.unitPrice) || 0),
    0
  );
  const discountAmount = subtotal * (Number(discountPercent) || 0) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (Number(taxPercent) || 0) / 100;
  const totalAmount = taxableAmount + taxAmount;
  return {
    subtotal: round2(subtotal),
    discountAmount: round2(discountAmount),
    taxAmount: round2(taxAmount),
    totalAmount: round2(totalAmount),
  };
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const EVENT_TYPE_SUGGESTIONS = [
  { name: 'Wedding', icon: 'Heart', color: '#E91E8C' },
  { name: 'Traditional Wedding', icon: 'Heart', color: '#8B4513' },
  { name: 'Birthday', icon: 'Cake', color: '#F59E0B' },
  { name: 'Funeral', icon: 'Flower2', color: '#1F2937' },
  { name: 'Memorial', icon: 'Flower2', color: '#374151' },
  { name: 'Graduation', icon: 'GraduationCap', color: '#1D4ED8' },
  { name: 'Corporate Function', icon: 'Briefcase', color: '#0F766E' },
  { name: 'Baby Shower', icon: 'Baby', color: '#EC4899' },
  { name: 'Kitchen Party', icon: 'Coffee', color: '#B45309' },
  { name: 'Anniversary', icon: 'Star', color: '#7C3AED' },
];

export const EVENT_TYPE_ICONS = [
  'Heart', 'Cake', 'Star', 'GraduationCap', 'Music', 'Briefcase',
  'Baby', 'Flower2', 'Coffee', 'Sun', 'Globe', 'Users2',
];

export const EVENT_TYPE_COLORS = [
  '#E91E8C', '#F59E0B', '#1D4ED8', '#0F766E', '#7C3AED',
  '#B45309', '#1F2937', '#EC4899', '#0EA5E9', '#16A34A',
];

export const INVENTORY_UNITS = ['piece', 'set', 'meter', 'roll', 'box', 'pair'];

export const EVENT_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const QUOTATION_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'];
export const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
export const EVENT_PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID'];
