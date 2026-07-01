import { useEffect } from 'react';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import OfflineBanner from '../OfflineBanner';
import NotificationPermission from '../NotificationPermission';
import InstallPrompt from '../InstallPrompt';
import { onForegroundMessage } from '../../firebase/messaging';

const AppShell = ({ children }) => {
  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      if (payload.notification) {
        toast(payload.notification.body || payload.notification.title, {
          icon: '🔔',
          duration: 5000,
        });
      }
    });
    return unsub;
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg-primary">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <OfflineBanner />
        <NotificationPermission />
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
      <InstallPrompt />
    </div>
  );
};

export default AppShell;
