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
      <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b border-app-border bg-app-bg-secondary/80 backdrop-blur-md flex-shrink-0 shadow-sm">
        <h1 className="text-base md:text-lg font-display font-semibold text-app-text-primary truncate">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPanelOpen(true)}
            className="relative p-2.5 rounded-xl hover:bg-app-surface text-app-text-secondary hover:text-app-text-primary transition-all duration-200 hover:shadow-sm"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.5} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-4 px-1.5 rounded-full bg-app-danger text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-app-surface text-app-text-secondary hover:text-app-text-primary transition-all duration-200 hover:shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />}
          </button>

          <ProfileDropdown>
            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-app-accent-light to-purple-100 text-app-accent-dark flex items-center justify-center font-semibold text-sm hover:ring-2 hover:ring-app-accent/30 transition-all duration-200 hover:scale-105 shadow-sm">
              {initials}
            </button>
          </ProfileDropdown>
        </div>
      </header>
      <NotificationPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
};

export default Topbar;
