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

export const getPendingUsersCount = async () => {
    const response = await api.get('/auth/admin/pending-count');
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

export const getDashboardData = async (startDate = null, endDate = null) => {
    const response = await api.get('/data/dashboard', {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
}

export const getVk11Details = async (startDate = null, endDate = null) => {
    const response = await api.get('/data/dashboard/details/vk11', {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
}

export const getInconsistenciasData = async (category, page = 1, size = 20, sort_by = null, order = 'desc', startDate = null, endDate = null) => {
    const response = await api.get(`/data/dashboard/inconsistencies/${category}`, {
        params: { 
            page, 
            size, 
            sort_by, 
            order,
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
}

export const exportRelatorioZaju = async (startDate, endDate) => {
    const response = await api.get('/data/export/zaju', {
        params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
}

export const exportRelatorioCgElegiveis = async (startDate, endDate, filter_month) => {
    const response = await api.get('/data/export/cg-elegiveis', {
        params: { start_date: startDate, end_date: endDate, filter_month }
    });
    return response.data;
}

export const exportRelatorioSellinDetalhado = async (startDate, endDate) => {
    const response = await api.get('/data/export/sellin-detalhado', {
        params: { start_date: startDate, end_date: endDate },
        responseType: 'blob'
    });
    return response.data;
}

export const exportRelatorioClientesDetalhado = async (startDate, endDate) => {
    const response = await api.get('/data/export/clientes-detalhado', {
        params: { start_date: startDate, end_date: endDate },
        responseType: 'blob'
    });
    return response.data;
}

export const exportRelatorioSaldos = async (startDate, endDate) => {
    const response = await api.get('/data/export/saldos', {
        params: { start_date: startDate, end_date: endDate },
        responseType: 'blob'
    });
    return response.data;
}

export const exportStyledData = async (data, title) => {
    // Se data já for o objeto completo com sheets, espalha ele. 
    // Caso contrário, trata como dados de aba única via fallback 'data'.
    const payload = (data && data.sheets) ? { ...data, title } : { data, title };
    const response = await api.post('/data/export/styled', payload, {
        responseType: 'blob'
    });
    return response.data;
}
