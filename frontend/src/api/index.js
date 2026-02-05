import axios from 'axios';

// Configuration de base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Instance axios configurée
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs (ex: token expiré)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas rediriger si c'est une erreur d'authentification sur les routes auth
    const isAuthRoute = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      // Token invalide ou expiré (pas sur les routes d'auth)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// Auth
// =============================================================================

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (data) =>
    api.post('/auth/register', data),

  me: () =>
    api.get('/auth/me'),
};

// =============================================================================
// Users
// =============================================================================

export const usersAPI = {
  getAll: () =>
    api.get('/users'),

  getById: (id) =>
    api.get(`/users/${id}`),

  updateProfile: (id, data) =>
    api.put(`/users/${id}/profile`, data),

  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAvatar: (id) =>
    api.delete(`/users/${id}/avatar`),

  updateEmail: (id, data) =>
    api.put(`/users/${id}/email`, data),

  updatePassword: (id, data) =>
    api.put(`/users/${id}/password`, data),
};

// =============================================================================
// Accounts
// =============================================================================

export const accountsAPI = {
  getByUser: (userId) =>
    api.get(`/users/${userId}/accounts`),

  getById: (id) =>
    api.get(`/accounts/${id}`),

  getDashboard: (accountId) =>
    api.get(`/accounts/${accountId}/dashboard`),

  create: (data) =>
    api.post('/accounts', data),

  update: (id, data) =>
    api.put(`/accounts/${id}`, data),

  delete: (id) =>
    api.delete(`/accounts/${id}`),
};

// =============================================================================
// Transactions
// =============================================================================

export const transactionsAPI = {
  getByAccount: (accountId, params = {}) =>
    api.get(`/accounts/${accountId}/transactions`, { params }),

  getByUser: (userId, params = {}) =>
    api.get(`/users/${userId}/transactions`, { params }),

  getById: (id) =>
    api.get(`/transactions/${id}`),

  create: (data) =>
    api.post('/transactions', data),

  update: (id, data) =>
    api.put(`/transactions/${id}`, data),

  delete: (id) =>
    api.delete(`/transactions/${id}`),
};

// =============================================================================
// Categories
// =============================================================================

export const categoriesAPI = {
  getAll: (userId = null) =>
    api.get('/categories', { params: { user_id: userId } }),

  create: (data) =>
    api.post('/categories', data),

  update: (id, data) =>
    api.put(`/categories/${id}`, data),

  delete: (id) =>
    api.delete(`/categories/${id}`),
};

// =============================================================================
// Recurring Transactions
// =============================================================================

export const recurringAPI = {
  getByUser: (userId) =>
    api.get(`/users/${userId}/recurring`),

  getById: (id) =>
    api.get(`/recurring/${id}`),

  create: (data) =>
    api.post('/recurring', data),

  update: (id, data) =>
    api.put(`/recurring/${id}`, data),

  delete: (id) =>
    api.delete(`/recurring/${id}`),
};

// =============================================================================
// Budgets
// =============================================================================

export const budgetsAPI = {
  getByUser: (userId) =>
    api.get(`/users/${userId}/budgets`),

  create: (data) =>
    api.post('/budgets', data),

  update: (id, data) =>
    api.put(`/budgets/${id}`, data),

  delete: (id) =>
    api.delete(`/budgets/${id}`),

  // Met à jour l'ordre d'affichage des budgets
  updateOrder: (userId, budgetIds) =>
    api.put(`/users/${userId}/budgets/order`, { budget_ids: budgetIds }),

  // Vérifie si une dépense dépasserait le budget
  checkExceeded: (userId, categoryId, amount) =>
    api.post(`/users/${userId}/budgets/check`, { category_id: categoryId, amount }),

  // Récupère les catégories disponibles pour créer un budget enfant
  getAvailableCategories: (budgetId, userId) =>
    api.get(`/budgets/${budgetId}/available-categories`, { params: { user_id: userId } }),
};

// =============================================================================
// Stats / Analytics
// =============================================================================

export const statsAPI = {
  getSummary: (userId) =>
    api.get(`/users/${userId}/stats/summary`),

  getExpensesByCategory: (userId, params = {}) =>
    api.get(`/users/${userId}/stats/expenses-by-category`, { params }),

  getMonthlyEvolution: (userId, params = {}) =>
    api.get(`/users/${userId}/stats/monthly-evolution`, { params }),
};

// =============================================================================
// Advances (Money lent awaiting reimbursement)
// =============================================================================

export const advancesAPI = {
  getByUser: (userId, params = {}) =>
    api.get('/advances', { params: { user_id: userId, ...params } }),

  getSummary: (userId, direction = null) => {
    // Mapper les valeurs frontend vers les valeurs backend
    const directionMap = { to_me: 'given', from_me: 'received' }
    const backendDirection = direction ? directionMap[direction] || direction : null
    return api.get('/advances/summary', { params: { user_id: userId, direction: backendDirection } })
  },

  create: (data) =>
    api.post('/advances', data),

  update: (id, data) =>
    api.put(`/advances/${id}`, data),

  delete: (id) =>
    api.delete(`/advances/${id}`),

  addPayment: (id, amount, skipTransaction = false) =>
    api.post(`/advances/${id}/payment`, { amount, skip_transaction: skipTransaction }),

  // Crée les catégories pour les avances (Avances, Remboursements, Emprunts, Remboursement d'emprunt)
  createCategories: (userId) =>
    api.post('/advances/create-categories', null, { params: { user_id: userId } }),
};

// =============================================================================
// Icons
// =============================================================================

export const iconsAPI = {
  getDefaults: () =>
    api.get('/icons/default'),

  getByUser: (userId) =>
    api.get(`/users/${userId}/icons`),

  upload: (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/users/${userId}/icons/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: (userId, iconName) =>
    api.delete(`/users/${userId}/icons/${iconName}`),
};

export default api;
