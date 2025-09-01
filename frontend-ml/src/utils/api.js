import { API_BASE } from './constants.js';


export const getHeaders = (includeContentType = true) => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
  };
  
  const token = localStorage.getItem('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const apiService = {

  login: async (credentials) => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  generateQuantumPassword: async (config = { length: 12, include_special: true }) => {
    const response = await fetch(`${API_BASE}/generate-quantum-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });
    return response.json();
  },

  // Model status
  getModelStatus: async () => {
    const response = await fetch(`${API_BASE}/model-status`, {
      headers: getHeaders(false)
    });
    return response.json();
  },

  // Training endpoints
  trainQuantumModel: async (config) => {
    const response = await fetch(`${API_BASE}/train-quantum`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });
    return response.json();
  },

  trainClassicalModels: async () => {
    const response = await fetch(`${API_BASE}/train-classical`, {
      method: 'POST',
      headers: getHeaders(false),
    });
    return response.json();
  },

  trainCreditCardQuantum: async (config) => {
    const response = await fetch(`${API_BASE}/train-creditcard-quantum`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });
    return response.json();
  },

  trainCreditCardClassical: async () => {
    const response = await fetch(`${API_BASE}/train-creditcard-classical`, {
      method: 'POST',
      headers: getHeaders(false),
    });
    return response.json();
  },

  // Prediction endpoints
  predictTraditional: async (transaction) => {
    const response = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(transaction),
    });
    return response.json();
  },

  predictCreditCard: async (transaction) => {
    const response = await fetch(`${API_BASE}/predict-creditcard`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });
    return response.json();
  },

  // Upload endpoints
  uploadTraditionalCSV: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/upload-csv`, {
      method: "POST",
      headers: { "ngrok-skip-browser-warning": "true" },
      body: formData,
    });
    return response.json();
  },

  uploadCreditCardCSV: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/upload-creditcard-csv`, {
      method: "POST",
      headers: { "ngrok-skip-browser-warning": "true" },
      body: formData,
    });
    return response.json();
  },

  // Analytics endpoints
  getAnalytics: async () => {
    const response = await fetch(`${API_BASE}/analytics`, {
      headers: getHeaders(false)
    });
    return response.json();
  },

  getCreditCardAnalytics: async () => {
    const response = await fetch(`${API_BASE}/creditcard-analytics`, {
      headers: getHeaders(false)
    });
    return response.json();
  },

  // Simulation endpoint
  simulateTransactions: async (count) => {
    const response = await fetch(`${API_BASE}/simulate-transactions?count=${count}`, {
      method: 'POST',
      headers: getHeaders(false),
    });
    return response.json();
  },

  // Prediction management
  savePrediction: async (predictionData) => {
    const response = await fetch(`${API_BASE}/save-prediction`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(predictionData),
    });
    return response.json();
  },

  getSavedPredictions: async () => {
    const response = await fetch(`${API_BASE}/saved-predictions`, {
      headers: getHeaders(false)
    });
    return response.json();
  },

  deletePrediction: async (predictionId) => {
    const response = await fetch(`${API_BASE}/saved-predictions/${predictionId}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    });
    return response.json();
  },

  exportPredictions: async () => {
    const response = await fetch(`${API_BASE}/export-predictions`, {
      headers: getHeaders(false)
    });
    return response.json();
  },

  // User stats
  getUserStats: async () => {
    const response = await fetch(`${API_BASE}/user-stats`, {
      headers: getHeaders(false)
    });
    return response.json();
  },

  // Health check
  getHealth: async () => {
    const response = await fetch(`${API_BASE}/health`, { 
      headers: getHeaders(false) 
    });
    return response.json();
  }
};