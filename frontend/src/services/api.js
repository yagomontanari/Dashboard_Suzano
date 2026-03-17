import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// Real data fetch via backend
export const getDashboardData = async () => {
    const response = await api.get('/data/dashboard');
    return response.data;
}

export const getInconsistenciasData = async (category, page = 1, size = 20, sort_by = null, order = 'desc') => {
    const response = await api.get(`/data/dashboard/inconsistencies/${category}`, {
        params: { page, size, sort_by, order }
    });
    return response.data;
}
