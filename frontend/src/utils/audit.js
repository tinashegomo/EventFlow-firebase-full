import { createDoc } from '../firebase/db';
import { COLLECTIONS } from '../firebase/collections';

export const writeAuditLog = async ({
  organizationId,
  userId,
  userName,
  action,
  entityType,
  entityId,
  entityName,
  details,
  diff,
}) => {
  await createDoc(COLLECTIONS.AUDIT_LOGS, {
    organizationId,
    userId,
    userName,
    action,
    entityType,
    entityId,
    entityName,
    details: details || '',
    diff: diff || null,
  });
};
