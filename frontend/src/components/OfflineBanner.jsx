import { memo } from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineBanner = memo(() => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -32, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-app-warning/10 text-app-warning text-xs font-medium border-b border-app-warning/20"
        >
          <WifiOff size={14} />
          <span>You are offline. Changes will sync when reconnected.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

OfflineBanner.displayName = 'OfflineBanner';
export default OfflineBanner;
