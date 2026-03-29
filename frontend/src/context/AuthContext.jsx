/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

import { login as loginAPI, signup as signupAPI, getProfile, updateProfile as updateProfileAPI } from '../services/api';
import { connectSocket, joinUserRoom, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);


export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(() => {
    const defaults = {
      showAlgoSignals: true,
      selectedStrategy: 'ALL',
      desktopNotifications: false,
      orderNotifications: true,
      priceAlerts: true,
      // Custom Algo Architect settings
      fastEMA: 9,
      slowEMA: 21,
      defaultSL: 2,     // 2% default stop loss
      defaultTarget: 5, // 5% default target
      theme: 'dark'     // 'dark' | 'light'
    };
    const saved = localStorage.getItem('preferences');
    if (!saved) return defaults;
    try {
      return { ...defaults, ...JSON.parse(saved) };
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = async (key, value) => {
    const newVal = value;
    setPreferences(prev => {
      const p = { ...prev, [key]: newVal };
      localStorage.setItem('preferences', JSON.stringify(p));
      return p;
    });

    if (user) {
      try {
        await updateProfileAPI({ preferences: { [key]: newVal } });
      } catch (err) {
        console.error('Failed to sync preference', err);
      }
    }
  };

  // ── Sync light/dark class with preferences ──
  useEffect(() => {
    if (preferences.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [preferences.theme]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsed);
        if (parsed.preferences) {
          setPreferences(prev => ({ ...prev, ...parsed.preferences }));
        }
        connectSocket();
        joinUserRoom(parsed._id);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await loginAPI({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    if (data.preferences) {
      setPreferences(prev => ({ ...prev, ...data.preferences }));
    }
    connectSocket();
    joinUserRoom(data._id);

    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await signupAPI({ name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    connectSocket();
    joinUserRoom(data._id);

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await getProfile();
      const updated = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      if (data.preferences) {
        setPreferences(prev => ({ ...prev, ...data.preferences }));
      }
    } catch {
      // ignore empty block
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, preferences, updatePreference }}>
      {children}
    </AuthContext.Provider>
  );
}
