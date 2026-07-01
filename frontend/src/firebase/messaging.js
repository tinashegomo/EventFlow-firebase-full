import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from './config';

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messaging = null;

function getMessagingInstance() {
  if (messaging) return messaging;
  try {
    messaging = getMessaging(app);
  } catch {
    return null;
  }
  return messaging;
}

export async function getFcmToken() {
  if (!vapidKey) return null;
  if (!('Notification' in window)) return null;
  if (Notification.permission === 'denied') return null;

  const ms = getMessagingInstance();
  if (!ms) return null;

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return null;

    const token = await getToken(ms, { vapidKey });
    return token;
  } catch {
    return null;
  }
}

export function onForegroundMessage(callback) {
  const ms = getMessagingInstance();
  if (!ms) return () => {};
  return onMessage(ms, callback);
}
