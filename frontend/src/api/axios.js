import axios from 'axios';

const api = axios.create({
  // Override per environment with VITE_API_URL (e.g. in .env.local)
  baseURL: import.meta.env.VITE_API_URL || "http://10.57.117.49:3000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
