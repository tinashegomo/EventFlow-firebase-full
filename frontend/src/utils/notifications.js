import { createDoc } from '../firebase/db';
import { COLLECTIONS } from '../firebase/collections';

export const generateEventNotifications = async () => {
};

export const writeNotification = async (orgId, notification) => {
  await createDoc(COLLECTIONS.NOTIFICATIONS, {
    organizationId: orgId,
    ...notification,
  });
};
