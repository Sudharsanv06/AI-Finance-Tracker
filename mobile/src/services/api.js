import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://eventfi-server.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token and disable HTTP caching for GET requests on mobile
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  const userStr = await AsyncStorage.getItem('user');
  let userId = '';
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      userId = u._id || '';
    } catch (e) {}
  }
  
  const setHeader = (name, value) => {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set(name, value);
    } else if (config.headers) {
      config.headers[name] = value;
    }
  };

  const deleteHeader = (name) => {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete(name);
    } else if (config.headers) {
      delete config.headers[name];
    }
  };

  if (token) {
    setHeader('Authorization', `Bearer ${token}`);
  } else {
    deleteHeader('Authorization');
  }

  // Prevent cache on all GET requests
  if (config.method?.toLowerCase() === 'get') {
    setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    setHeader('Pragma', 'no-cache');
    setHeader('Expires', '0');
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    if (userId) {
      config.params._uid = userId;
    }
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;