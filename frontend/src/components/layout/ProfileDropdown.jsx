import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, KeyRound, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui';

const ProfileDropdown = ({ children }) => {
  const { user, signOut, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  if (!user) return null;

  const displayName = user.displayName || user.email || 'User';
  const email = user.email || '';

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword(email);
      toast.success(`Password reset email sent to ${email}`);
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    }
  };

  const handleProfile = () => {
    setOpen(false);
    navigate(`/users/${user.id || user.uid}`);
  };

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {children}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-app-bg-secondary border border-app-border rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-app-border">
              <p className="text-sm font-semibold text-app-text-primary truncate">{displayName}</p>
              <p className="text-xs text-app-text-muted truncate">{email}</p>
              <div className="mt-1.5">
                <Badge status={user.role || 'STAFF'} className="text-[10px]" />
              </div>
            </div>

            <div className="p-1.5">
              <button
                onClick={handleProfile}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-app-text-secondary hover:bg-app-bg-tertiary hover:text-app-text-primary transition"
              >
                <User size={16} />
                View Profile
              </button>
              <button
                onClick={handleResetPassword}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-app-text-secondary hover:bg-app-bg-tertiary hover:text-app-text-primary transition"
              >
                <KeyRound size={16} />
                Reset Password
              </button>
            </div>

            <div className="p-1.5 border-t border-app-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-app-danger hover:bg-app-bg-tertiary transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
