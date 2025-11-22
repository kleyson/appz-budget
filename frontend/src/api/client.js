import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Expense endpoints
export const expensesApi = {
  getAll: (params = {}) => apiClient.get('/api/expenses', { params }),
  getById: (id) => apiClient.get(`/api/expenses/${id}`),
  create: (data) => apiClient.post('/api/expenses', data),
  update: (id, data) => apiClient.put(`/api/expenses/${id}`, data),
  delete: (id) => apiClient.delete(`/api/expenses/${id}`),
};

// Category endpoints
export const categoriesApi = {
  getAll: () => apiClient.get('/api/categories'),
  getById: (id) => apiClient.get(`/api/categories/${id}`),
  create: (data) => apiClient.post('/api/categories', data),
  update: (id, data) => apiClient.put(`/api/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/api/categories/${id}`),
  getSummary: (period = null) => 
    apiClient.get('/api/categories/summary', { params: period ? { period } : {} }),
};

// Period endpoints
export const periodsApi = {
  getAll: () => apiClient.get('/api/periods'),
  getById: (id) => apiClient.get(`/api/periods/${id}`),
  create: (data) => apiClient.post('/api/periods', data),
  update: (id, data) => apiClient.put(`/api/periods/${id}`, data),
  delete: (id) => apiClient.delete(`/api/periods/${id}`),
};

// Import endpoint
export const importApi = {
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
