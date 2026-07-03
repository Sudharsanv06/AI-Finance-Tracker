import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser  = await AsyncStorage.getItem('user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { token: t, user: u } = res.data;
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (e) {}
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user',  JSON.stringify(u));
    setToken(t);
    setUser(u);
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    const { token: t, user: u } = res.data;
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (e) {}
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user',  JSON.stringify(u));
    setToken(t);
    setUser(u);
    return res;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (e) {}
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updatedUserOrFunc) => {
    try {
      if (typeof updatedUserOrFunc === 'function') {
        setUser((prevUser) => {
          const nextUser = updatedUserOrFunc(prevUser);
          AsyncStorage.setItem('user', JSON.stringify(nextUser)).catch((err) => {
            console.log('AsyncStorage user set error:', err);
          });
          return nextUser;
        });
      } else {
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserOrFunc));
        setUser(updatedUserOrFunc);
      }
    } catch (err) {
      console.log('updateUser error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token,
      login, register, logout, updateUser,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};