import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Receipt,
  Menu,
  X,
  Tag,
  Package,
  Building2,
  Users,
  ClipboardList,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import InstallButton from '../InstallButton';

const mainLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: FileText, label: 'Quotes', path: '/quotations' },
  { icon: Receipt, label: 'Invoices', path: '/invoices' },
];

const moreLinks = [
  { icon: Tag, label: 'Event Types', path: '/event-types' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: Building2, label: 'Organization', path: '/organization' },
  { icon: Users, label: 'Team', path: '/users', adminOnly: true },
  { icon: ClipboardList, label: 'Audit Log', path: '/audit-log', adminOnly: true },
];

const MobileNav = () => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  const filteredMoreLinks = moreLinks.filter((l) => !l.adminOnly || user.role === ROLES.ADMIN);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-app-bg-secondary/95 backdrop-blur-md border-t border-app-border flex items-center justify-around h-16 px-1 shadow-lg">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-app-accent'
                    : 'text-app-text-muted hover:text-app-text-primary'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.5} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-[10px] font-medium text-app-text-muted hover:text-app-text-primary transition-all duration-200"
        >
          <Menu size={20} strokeWidth={1.5} />
          <span>More</span>
        </button>
      </nav>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-app-bg-secondary border-l border-app-border flex flex-col shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center justify-between p-5 border-b border-app-border bg-app-bg-secondary/50 backdrop-blur-sm">
                <h2 className="text-lg font-semibold">Navigation</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-app-surface text-app-text-muted hover:text-app-text-primary transition-all duration-200"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {filteredMoreLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-app-accent-light text-app-accent-dark shadow-sm'
                            : 'text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary'
                        }`
                      }
                    >
                      <Icon size={18} strokeWidth={1.5} />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </div>
              <div className="p-4 border-t border-app-border bg-app-surface/50">
                <div className="flex items-center gap-3 px-3 py-2">
                  <InstallButton />
                  <span className="text-xs text-app-text-muted">Install app</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
