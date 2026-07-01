import { format, formatDistanceToNow, parseISO, differenceInCalendarDays, isAfter, startOfDay } from 'date-fns';

const normalize = (val) => {
  if (!val) return null;
  if (typeof val.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') return parseISO(val);
  if (typeof val === 'number') return new Date(val);
  if (val.seconds) return new Date(val.seconds * 1000);
  return null;
};

export const formatDate = (val) => {
  const d = normalize(val);
  if (!d) return '';
  try {
    return format(d, 'd MMM yyyy');
  } catch {
    return typeof val === 'string' ? val : '';
  }
};

export const formatDateTime = (val) => {
  const d = normalize(val);
  if (!d) return '';
  try {
    return format(d, 'd MMM yyyy, HH:mm');
  } catch {
    return typeof val === 'string' ? val : '';
  }
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  return timeString;
};

export const daysUntil = (val) => {
  const d = normalize(val);
  if (!d) return null;
  try {
    return differenceInCalendarDays(startOfDay(d), startOfDay(new Date()));
  } catch {
    return null;
  }
};

export const isToday = (val) => daysUntil(val) === 0;

export const isTomorrow = (val) => daysUntil(val) === 1;

export const isPast = (val) => {
  const d = normalize(val);
  if (!d) return false;
  try {
    return !isAfter(d, startOfDay(new Date()));
  } catch {
    return false;
  }
};

export const formatRelative = (val) => {
  const d = normalize(val);
  if (!d) return '';
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '';
  }
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export const getCountdownLabel = (val) => {
  const days = daysUntil(val);
  if (days === null) return '';
  if (days < 0) return 'Past';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
};
