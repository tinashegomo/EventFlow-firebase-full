import { memo } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useState } from 'react';

const IOS_INSTALL_KEY = 'ef_ios_install_dismissed';

const InstallPrompt = memo(() => {
  const { canInstall, isInstalled, isIOS, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled) return null;

  const handleDismiss = () => setDismissed(true);

  if (isIOS && !dismissed) {
    const alreadyDismissed = localStorage.getItem(IOS_INSTALL_KEY) === '1';
    if (alreadyDismissed) return null;

    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50"
      >
        <div className="rounded-2xl border border-app-border bg-app-bg-secondary shadow-lg p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-app-accent-light text-app-accent-dark flex items-center justify-center flex-shrink-0">
            <Share2 size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-app-text-primary">Install EventFlow</p>
            <p className="text-xs text-app-text-secondary mt-0.5">
              Tap the Share button then Add to Home Screen for the best experience.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.setItem(IOS_INSTALL_KEY, '1');
              handleDismiss();
            }}
            className="p-1.5 rounded-lg hover:bg-app-bg-tertiary text-app-text-muted"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  if (canInstall && !dismissed) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-20 md:bottom-6 right-4 z-50"
      >
        <div className="rounded-2xl border border-app-border bg-app-bg-secondary shadow-lg p-4 flex items-center gap-3 max-w-xs">
          <div className="w-10 h-10 rounded-xl bg-app-accent-light text-app-accent-dark flex items-center justify-center flex-shrink-0">
            <Download size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-app-text-primary">Install EventFlow</p>
            <p className="text-xs text-app-text-secondary mt-0.5">Add to your home screen for quick access.</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={triggerInstall}
                className="px-3 py-1.5 rounded-lg bg-app-accent text-white text-xs font-medium hover:bg-app-accent-dark transition"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg text-xs text-app-text-muted hover:text-app-text-primary hover:bg-app-bg-tertiary transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
});

InstallPrompt.displayName = 'InstallPrompt';
export default InstallPrompt;
