import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import toast from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.jsx';

registerSW({
  onNeedRefresh() {
    toast('A new version is available. Refresh to update.', {
      duration: Infinity,
      style: { borderRadius: '12px', background: '#9333EA', color: '#fff', fontSize: '14px' },
    });
  },
  onOfflineReady() {
    toast('EventFlow is ready for offline use.', {
      icon: '✓',
      style: { borderRadius: '12px', fontSize: '14px' },
    });
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
