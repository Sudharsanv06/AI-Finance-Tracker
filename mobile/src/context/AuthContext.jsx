import { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
          try {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser && typeof parsedUser === 'object' && parsedUser._id) {
              setToken(savedToken);
              setUser(parsedUser);
            } else {
              await AsyncStorage.multiRemove(['token', 'user']);
            }
          } catch (e) {
            await AsyncStorage.multiRemove(['token', 'user']);
          }
        }
      } catch (err) {
        console.log('Error loading auth context:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const payload = res?.data || res;
    const t = payload?.token;
    const u = payload?.user;
    if (!t || !u) {
      throw new Error(res?.message || 'Login failed: Invalid token or user data received from server');
    }
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
    const payload = res?.data || res;
    const t = payload?.token;
    const u = payload?.user;
    if (!t || !u) {
      throw new Error(res?.message || 'Registration failed: Invalid token or user data received from server');
    }
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
          if (nextUser) {
            AsyncStorage.setItem('user', JSON.stringify(nextUser)).catch((err) => {
              console.log('AsyncStorage user set error:', err);
            });
          }
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F0EDE5', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#004643" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: Boolean(token && user && user._id),
      login, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};