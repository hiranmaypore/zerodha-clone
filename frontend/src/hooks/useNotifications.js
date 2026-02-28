import { useState, useEffect, useCallback, useRef } from 'react';
import { connectSocket, joinUserRoom } from '../services/socket';

const MAX_NOTIFICATIONS = 50;

/**
 * Listens for WebSocket order events and maintains a local notification list.
 * Returns { notifications, unreadCount, markAllRead, clear }
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const seqRef = useRef(0);

  const push = useCallback((type, data) => {
    const id = ++seqRef.current;
    const entry = { id, type, data, read: false, time: new Date() };
    setNotifications(prev =>
      [entry, ...prev].slice(0, MAX_NOTIFICATIONS)
    );
  }, []);

  useEffect(() => {
    const socket = connectSocket();

    if (userId) joinUserRoom(userId);

    const handlers = {
      order_executed:      (d) => push('order_executed',      d),
      order_cancelled:     (d) => push('order_cancelled',     d),
      stop_loss_triggered: (d) => push('stop_loss_triggered', d),
      bracket_entry:       (d) => push('bracket_entry',       d),
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
