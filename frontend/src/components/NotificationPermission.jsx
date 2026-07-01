import { memo, useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFcmToken } from '../firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const DISMISSED_KEY = 'ef_notification_dismissed';

const NotificationPermission = memo(() => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) return;

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleEnable = async () => {
    const token = await getFcmToken();
    if (token && user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
      } catch {
        // token save failure is non-critical
      }
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -32, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-2 px-4 py-1.5 bg-app-accent/10 text-app-accent-dark text-xs font-medium border-b border-app-accent/20"
        >
          <Bell size={14} />
          <span>Enable push notifications for event updates.</span>
          <button
            onClick={handleEnable}
            className="ml-2 px-2.5 py-1 rounded-md bg-app-accent text-white text-[11px] font-semibold hover:opacity-90"
          >
            Enable
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-app-bg-tertiary text-app-text-muted"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

NotificationPermission.displayName = 'NotificationPermission';
export default NotificationPermission;
