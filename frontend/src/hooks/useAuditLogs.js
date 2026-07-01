import { useEffect, useState } from 'react';
import { query, where, orderBy, limit, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../firebase/collections';

export const useAuditLogs = ({ orgId, userId, entityType, entityId, max = 50 } = {}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orgId && !userId) {
      setLogs([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);

    const constraints = [];
    if (orgId) constraints.push(where('organizationId', '==', orgId));
    if (userId) constraints.push(where('userId', '==', userId));
    if (entityType) constraints.push(where('entityType', '==', entityType));
    if (entityId) constraints.push(where('entityId', '==', entityId));
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(max));

    const unsub = onSnapshot(
      query(collection(db, COLLECTIONS.AUDIT_LOGS), ...constraints),
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [orgId, userId, entityType, entityId, max]);

  return { logs, loading, error };
};
