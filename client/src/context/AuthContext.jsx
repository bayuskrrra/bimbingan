import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('guru_bk_token');
      const savedUser = localStorage.getItem('guru_bk_user');

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          // ignore parsing error
        }
      }

      try {
        const res = await api.get('/auth/me');
        if (res.user) {
          setUser(res.user);
          localStorage.setItem('guru_bk_user', JSON.stringify(res.user));
        }
      } catch (err) {
        console.warn('Sesi login telah berakhir atau backend belum tersambung');
        // Jika token tidak valid / 401, bersihkan
        if (err.message && err.message.includes('401')) {
          localStorage.removeItem('guru_bk_token');
          localStorage.removeItem('guru_bk_user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.token && res.user) {
        localStorage.setItem('guru_bk_token', res.token);
        localStorage.setItem('guru_bk_user', JSON.stringify(res.user));
        setUser(res.user);
        return res;
      }
      throw new Error(res.message || 'Login gagal, periksa respon server');
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('guru_bk_token');
    localStorage.removeItem('guru_bk_user');
    setUser(null);
    window.location.href = '/login';
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
