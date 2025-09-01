// src/App.jsx
import React, { useState, useEffect } from 'react';
import { API_BASE } from './utils/constants';
import { getHeaders } from './utils/api';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';


import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UploadPage from './pages/upload/UploadPage';
import TrainingPage from './pages/training/TrainingPage';
import PredictionPage from './pages/prediction/PredictionPage';
import CreditCardPage from './pages/prediction/CreditCardPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import SimulationPage from './pages/simulation/SimulationPage';
import AnalysisPage from './pages/analysis/AnalysisPage';
import PredictionHistoryPage from './pages/history/PredictionHistoryPage';


const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};


const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return isAuthenticated ? <MainApp /> : <LoginPage />;
};


const MainApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [modelStatus, setModelStatus] = useState({
    quantum_model_trained: false,
    classical_models_trained: false,
    creditcard_quantum_model_trained: false,
    creditcard_classical_models_trained: false,
    creditcard_data_loaded: false,
    available_models: [],
    available_creditcard_models: []
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const { user, logout } = useAuth();

  const checkModelStatus = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch(`${API_BASE}/model-status`, {
        headers: getHeaders(false)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setModelStatus(data);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error checking model status:', error);
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    checkModelStatus();
    const interval = setInterval(checkModelStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const pages = {
    dashboard: <DashboardPage modelStatus={modelStatus} connectionStatus={connectionStatus} />,
    upload: <UploadPage modelStatus={modelStatus} connectionStatus={connectionStatus} />,
    training: <TrainingPage onTrainingComplete={checkModelStatus} connectionStatus={connectionStatus} />,
    prediction: <PredictionPage modelStatus={modelStatus} connectionStatus={connectionStatus} />,
    creditcard: <CreditCardPage connectionStatus={connectionStatus} />,
    analytics: <AnalyticsPage modelStatus={modelStatus} connectionStatus={connectionStatus} />,
    simulation: <SimulationPage modelStatus={modelStatus} connectionStatus={connectionStatus} />,
    analysis: <AnalysisPage modelStatus={modelStatus} connectionStatus={connectionStatus} />,
    history: <PredictionHistoryPage connectionStatus={connectionStatus} />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex">
      
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          modelStatus={modelStatus}
          connectionStatus={connectionStatus}
        />

      
        <div className="flex-1 ml-64">
          <Header
            connectionStatus={connectionStatus}
            onRetry={checkModelStatus}
            user={user}
            onLogout={logout}
          />
          <main className="p-6">
            {pages[currentPage]}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
