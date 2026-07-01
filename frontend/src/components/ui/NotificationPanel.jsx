import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck } from 'lucide-react';
import { createPortal } from 'react-dom';
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../firebase/collections';
import { useAuth } from '../../context/AuthContext';
import { formatRelative } from '../../utils/dateHelpers';

const NotificationPanel = ({ isOpen, onClose }) => {
  const { currentOrg } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isOpen || !currentOrg) {
      setNotifications([]);
      return;
    }
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('organizationId', '==', currentOrg.id),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setNotifications([]),
    );
    return () => unsub();
  }, [isOpen, currentOrg]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleMarkAll = async () => {
    if (!currentOrg) return;
    const batch = writeBatch(db);
    notifications.filter((n) => !n.isRead).forEach((n) => {
      batch.update(doc(db, COLLECTIONS.NOTIFICATIONS, n.id), { isRead: true, readAt: new Date().toISOString() });
    });
    await batch.commit();
  };

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, n.id), { isRead: true, readAt: new Date().toISOString() });
      } catch {
        // ignore
      }
    }
    if (n.eventId) {
      onClose();
      navigate(`/events/${n.eventId}`);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-96 bg-app-bg-secondary border-l border-app-border shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between p-5 border-b border-app-border">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-app-accent" />
                <h2 className="text-base font-semibold text-app-text-primary">
                  Notifications
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMarkAll}
                  className="p-1.5 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-text-primary transition"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-text-primary transition"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-sm text-app-text-muted">
                  <Bell size={28} className="mb-2 opacity-50" />
                  You're all caught up.
                </div>
              ) : (
                <ul className="divide-y divide-app-border">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`p-4 cursor-pointer hover:bg-app-bg-tertiary transition ${
                        !n.isRead ? 'bg-app-accent-light/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              !n.isRead
                                ? 'text-app-text-primary'
                                : 'text-app-text-secondary'
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="mt-1 text-xs text-app-text-secondary line-clamp-2">
                            {n.message}
                          </p>
                          <p className="mt-2 text-xs text-app-text-muted">
                            {formatRelative(n.createdAt)}
                          </p>
                        </div>
                        {!n.isRead && (
                          <span className="mt-1 w-2 h-2 rounded-full bg-app-accent flex-shrink-0" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default NotificationPanel;
