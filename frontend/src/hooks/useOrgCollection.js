import { useEffect, useState, useCallback } from 'react';
import { subscribeToOrgCollection, subscribeToDoc } from '../firebase/db';
import { useAuth } from '../context/AuthContext';

export const useOrgCollection = (collectionName) => {
  const { currentOrg } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentOrg?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToOrgCollection(
      collectionName,
      currentOrg.id,
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [collectionName, currentOrg?.id]);

  const refresh = useCallback(() => {}, []);
  return { items, loading, error, refresh, setItems };
};

export const useDoc = (collectionName, docId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!docId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToDoc(
      collectionName,
      docId,
      (d) => {
        setData(d);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [collectionName, docId]);

  return { data, loading, error };
};
