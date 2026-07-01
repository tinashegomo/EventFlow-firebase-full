import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Bell } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../firebase/collections';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../ui/NotificationPanel';
import ProfileDropdown from './ProfileDropdown';

const titleMap = {
  '/dashboard': 'Dashboard',
  '/organization': 'Organization',
  '/event-types': 'Event Types',
  '/inventory': 'Inventory',
  '/events': 'Events',
  '/quotations': 'Quotations',
  '/invoices': 'Invoices',
  '/users': 'Team',
  '/audit-log': 'Audit Log',
};

const Topbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, currentOrg } = useAuth();
  const location = useLocation();
  const [panelOpen, setPanelOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!currentOrg) {
      setUnread(0);
      return;
    }
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('organizationId', '==', currentOrg.id),
      where('isRead', '==', false),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setUnread(snap.size),
      () => setUnread(0),
    );
    return () => unsub();
  }, [currentOrg]);

  const matched = Object.keys(titleMap).find((p) => location.pathname.startsWith(p));
  const title = titleMap[matched] || 'EventFlow';

  const initials = user?.displayName
    ? user.displayName.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b border-app-border bg-app-bg-secondary flex-shrink-0">
        <h1 className="text-base md:text-lg font-display font-semibold text-app-text-primary truncate">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPanelOpen(true)}
            className="relative p-2 rounded-xl hover:bg-app-bg-tertiary text-app-text-secondary hover:text-app-text-primary transition"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-app-danger text-white text-[10px] font-semibold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-app-bg-tertiary text-app-text-secondary hover:text-app-text-primary transition"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <ProfileDropdown>
            <div className="w-9 h-9 rounded-full bg-app-accent-light text-app-accent-dark flex items-center justify-center font-semibold text-sm hover:ring-2 hover:ring-app-accent/30 transition">
              {initials}
            </div>
          </ProfileDropdown>
        </div>
      </header>
      <NotificationPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
};

export default Topbar;
