import { memo } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const InstallButton = memo(() => {
  const { canInstall, isInstalled, isIOS, triggerInstall } = useInstallPrompt();

  if (isInstalled) return null;

  if (canInstall) {
    return (
      <button
        onClick={triggerInstall}
        className="p-1.5 rounded-lg hover:bg-app-bg-secondary text-app-text-muted hover:text-app-accent transition"
        title="Install app"
      >
        <Download size={16} />
      </button>
    );
  }

  if (isIOS) {
    return (
      <button
        className="p-1.5 rounded-lg text-app-text-muted cursor-default"
        title="Tap Share → Add to Home Screen"
      >
        <Smartphone size={16} />
      </button>
    );
  }

  return null;
});

InstallButton.displayName = 'InstallButton';
export default InstallButton;
