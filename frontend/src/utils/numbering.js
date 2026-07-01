import { getOrgItems } from './storage';

export const getNextNumber = (key, prefix, organizationId) => {
  const items = getOrgItems(key, organizationId);
  const year = new Date().getFullYear();
  const fieldName = `${prefix.toLowerCase()}Number`;
  const yearItems = items.filter((i) =>
    i[fieldName]?.startsWith(`${prefix}-${year}`)
  );
  const next = String(yearItems.length + 1).padStart(4, '0');
  return `${prefix}-${year}-${next}`;
};
