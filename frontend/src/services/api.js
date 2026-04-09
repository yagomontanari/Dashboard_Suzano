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

// Interceptor de resposta para tratar erros globais (ex: 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- AUTH ---

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const registerRequest = async (nome, email) => {
  const response = await api.post('/auth/register', { nome, email });
  return response.data;
};

export const changePassword = async (old_password, new_password, token) => {
  const response = await api.post('/auth/change-password', 
    { old_password, new_password },
    { params: { token } }
  );
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

// --- ADMIN ---

export const getAdminUsers = async () => {
    const response = await api.get('/auth/admin/users');
    return response.data;
}

export const updateUser = async (userId, data) => {
    const response = await api.put(`/auth/admin/users/${userId}`, data);
    return response.data;
}

export const approveUser = async (userId) => {
    const response = await api.post(`/auth/admin/users/${userId}/approve`);
    return response.data;
}

export const rejectUser = async (userId) => {
    const response = await api.post(`/auth/admin/users/${userId}/reject`);
    return response.data;
}

export const resetUserPassword = async (userId) => {
    const response = await api.post(`/auth/admin/users/${userId}/reset-password`);
    return response.data;
}

export const unlockUser = async (userId) => {
    const response = await api.post(`/auth/admin/users/${userId}/unlock`);
    return response.data;
}

// --- DATA ---

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

export const exportRelatorioZaju = async (startDate, endDate) => {
    const response = await api.get('/data/export/zaju', {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
}
