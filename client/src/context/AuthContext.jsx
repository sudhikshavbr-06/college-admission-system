import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mit_token');
    if (!token) {
      setBooting(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('mit_token');
        localStorage.removeItem('mit_user');
      })
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('mit_token', res.data.token);
    localStorage.setItem('mit_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    localStorage.setItem('mit_token', res.data.token);
    localStorage.setItem('mit_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mit_token');
    localStorage.removeItem('mit_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, booting, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
