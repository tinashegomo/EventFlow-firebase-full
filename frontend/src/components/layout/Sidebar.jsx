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
      className={`hidden md:flex md:flex-col h-screen bg-app-bg-secondary border-r border-app-border flex-shrink-0 transition-all duration-200 ${
        collapsed ? 'w-[68px]' : 'w-60 lg:w-64'
      }`}
    >
      <div className={`p-4 border-b border-app-border flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        {!collapsed && (
          <>
            {currentOrg?.logoBase64 ? (
              <img
                src={currentOrg.logoBase64}
                alt="Logo"
                className="w-9 h-9 rounded-xl object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-app-accent-light text-app-accent-dark flex items-center justify-center font-display font-semibold text-sm">
                {orgInitials}
              </div>
            )}
            <p className="text-sm font-semibold text-app-text-primary truncate flex-1">
              {currentOrg?.name || 'EventFlow'}
            </p>
          </>
        )}
        {collapsed && (
          currentOrg?.logoBase64 ? (
            <img
              src={currentOrg.logoBase64}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-app-accent-light text-app-accent-dark flex items-center justify-center font-display font-semibold text-xs">
              {orgInitials}
            </div>
          )
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl text-sm font-medium transition ${
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-app-accent-light text-app-accent-dark'
                    : 'text-app-text-secondary hover:bg-app-bg-tertiary hover:text-app-text-primary'
                }`
              }
              title={collapsed ? link.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1 bottom-1 w-1 bg-app-accent rounded-r"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={18} />
                  {!collapsed && <span>{link.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className={`p-2 border-t border-app-border flex items-center ${collapsed ? 'flex-col gap-1' : 'justify-between'}`}>
        {!collapsed && <InstallButton />}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-xl hover:bg-app-bg-tertiary text-app-text-muted hover:text-app-text-primary transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        {collapsed && <InstallButton />}
      </div>
    </aside>
  );
};

export default Sidebar;
