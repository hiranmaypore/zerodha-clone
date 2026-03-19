import { useState, useEffect, useCallback, useRef } from 'react';
import { connectSocket, joinUserRoom } from '../services/socket';
import { toast } from 'react-hot-toast';

const MAX_NOTIFICATIONS = 50;

/**
 * Listens for WebSocket order events and maintains a local notification list.
 * Returns { notifications, unreadCount, markAllRead, clear }
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const seqRef = useRef(0);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const triggerNativeNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico', 
      });
    }
  };

  const push = useCallback((type, data) => {
    const id = ++seqRef.current;
    const entry = { id, type, data, read: false, time: new Date() };
    setNotifications(prev =>
      [entry, ...prev].slice(0, MAX_NOTIFICATIONS)
    );

    // Also trigger toast for instant feedback and Native Push
    if (type === 'order_executed') {
      const msg = `${data.type} filled: ${data.quantity} × ${data.stock} @ ₹${data.price?.toFixed(2)}`;
      toast.success(msg, { icon: '✅', duration: 4000 });
      triggerNativeNotification('Order Executed', msg);
    } else if (type === 'price_alert') {
       const msg = data.message || 'Price Alert Triggered';
       toast(msg, { icon: '🔔', duration: 5000 });
       triggerNativeNotification('Price Alert Triggered', msg);
    } else if (type === 'mis_squaredoff') {
       const msg = `${data.stock} MIS position squared off automatically.`;
       toast.error(msg, { icon: '⚡', duration: 5000 });
       triggerNativeNotification('MIS Auto Square-off', msg);
    }
  }, []);

  useEffect(() => {
    const socket = connectSocket();

    if (userId) joinUserRoom(userId);

    const handlers = {
      order_executed:      (d) => push('order_executed',      d),
      order_cancelled:     (d) => push('order_cancelled',     d),
      stop_loss_triggered: (d) => push('stop_loss_triggered', d),
      bracket_entry:       (d) => push('bracket_entry',       d),
      mis_warning:         (d) => push('mis_warning',         d),
      mis_squaredoff:      (d) => push('mis_squaredoff',      d),
      notification:        (d) => push('price_alert',         d),
      ai_signal:           (d) => { push('price_alert', { message: `AI Signal: ${d.trend} on ${d.symbol}` }); } // Add AI Signal push
    };

    Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn));
    return () => Object.entries(handlers).forEach(([ev, fn]) => socket.off(ev, fn));
  }, [userId, push]);

  const markAllRead = useCallback(() =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true }))),
  []);

  const markRead = useCallback((id) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)),
  []);

  const clear = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllRead, markRead, clear };
}
