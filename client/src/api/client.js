import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    const base = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('guru_bk_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error Detail:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('guru_bk_token');
      localStorage.removeItem('guru_bk_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    let message = 'Terjadi kesalahan pada sistem.';
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.errors) {
      message = error.response.data.errors.map((e) => e.message).join(', ');
    } else if (error.response?.status) {
      message = `Server Error (${error.response.status}): ${typeof error.response.data === 'string' ? error.response.data.slice(0, 80) : 'Gagal memproses request'}`;
    } else if (error.message) {
      message = `Koneksi Error: ${error.message}`;
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
