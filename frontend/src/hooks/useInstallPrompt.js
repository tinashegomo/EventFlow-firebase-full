import { useState, useEffect, useCallback } from 'react';

let deferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event('ef_install_ready'));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event('ef_app_installed'));
  });
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(() => deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const onReady = () => setInstallPrompt(deferredPrompt);
    const onInstalled = () => setIsInstalled(true);
    window.addEventListener('ef_install_ready', onReady);
    window.addEventListener('ef_app_installed', onInstalled);
    return () => {
      window.removeEventListener('ef_install_ready', onReady);
      window.removeEventListener('ef_app_installed', onInstalled);
    };
  }, []);

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      deferredPrompt = null;
      setInstallPrompt(null);
    }
  }, []);

  return {
    canInstall: !!installPrompt,
    isInstalled,
    isIOS,
    triggerInstall,
  };
}
