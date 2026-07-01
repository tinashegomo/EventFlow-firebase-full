import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Tag,
  Package,
  FileText,
  Receipt,
  Building2,
  Users,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InstallButton from '../InstallButton';

const navLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Tag, label: 'Event Types', path: '/event-types' },
  { icon: Package, label: 'Inventory', path: '/inventory' },
  { icon: FileText, label: 'Quotations', path: '/quotations' },
  { icon: Receipt, label: 'Invoices', path: '/invoices' },
  { icon: Building2, label: 'Organization', path: '/organization' },
  { icon: Users, label: 'Team', path: '/users', adminOnly: true },
  { icon: ClipboardList, label: 'Audit Log', path: '/audit-log', adminOnly: true },
];

const Sidebar = () => {
  const { user, currentOrg, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('ef_sidebar_collapsed') === 'true';
  });

  if (!user) return null;

  const links = navLinks.filter(
    (l) => !l.adminOnly || isAdmin
  );

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem('ef_sidebar_collapsed', !prev);
      return !prev;
    });
  };

  const orgInitials = (currentOrg?.name || 'EF')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={`hidden md:flex md:flex-col h-screen bg-app-bg-secondary/95 backdrop-blur-md border-r border-app-border flex-shrink-0 transition-all duration-300 ${
        collapsed ? 'w-[68px] lg:w-[68px]' : 'w-64 lg:w-72'
      }`}
    >
      <div className={`p-4 border-b border-app-border flex items-center ${collapsed ? 'justify-center' : 'gap-3'} min-h-[64px]`}>
        {!collapsed && (
          <>
            {currentOrg?.logoBase64 ? (
              <div className="w-9 h-9 rounded-xl bg-white p-1.5 shadow-sm">
                <img
                  src={currentOrg.logoBase64}
                  alt="Logo"
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-app-accent to-purple-600 text-white flex items-center justify-center font-display font-semibold text-sm shadow-sm">
                {orgInitials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-app-text-primary truncate">
                {currentOrg?.name || 'EventFlow'}
              </p>
              <p className="text-xs text-app-text-muted truncate">
                {currentOrg?.plan || 'Free Tier'}
              </p>
            </div>
          </>
        )}
        {collapsed && (
          currentOrg?.logoBase64 ? (
            <div className="w-8 h-8 rounded-lg bg-white p-1 shadow-sm">
              <img
                src={currentOrg.logoBase64}
                alt="Logo"
                className="w-full h-full rounded-md object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-app-accent to-purple-600 text-white flex items-center justify-center font-display font-semibold text-xs shadow-sm">
              {orgInitials}
            </div>
          )
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'
                } ${
                  isActive
                    ? 'bg-app-accent-light text-app-accent-dark shadow-sm'
                    : 'text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary'
                }`
              }
              title={collapsed ? link.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-app-accent rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={20} strokeWidth={1.5} />
                  {!collapsed && <span>{link.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className={`p-3 border-t border-app-border bg-app-surface/50 ${collapsed ? 'flex flex-col gap-2 items-center' : 'flex justify-between items-center'}`}>
        {!collapsed && <InstallButton />}
        <motion.button
          onClick={toggleCollapse}
          className="p-2.5 rounded-xl hover:bg-app-surface text-app-text-muted hover:text-app-text-primary transition-all duration-200 hover:shadow-sm"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? <PanelLeftOpen size={20} strokeWidth={1.5} /> : <PanelLeftClose size={20} strokeWidth={1.5} />}
        </motion.button>
        {collapsed && <InstallButton />}
      </div>
    </aside>
  );
};

export default Sidebar;
