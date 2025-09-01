import React from 'react';
import { 
  Upload, Brain, Shield, BarChart3, Zap, CheckCircle, XCircle, Activity,
  Home, CreditCard, FileText, History, Wifi, WifiOff
} from 'lucide-react';
import { CONNECTION_STATUS } from '../../utils/constants.js';

export const Sidebar = ({ currentPage, setCurrentPage, modelStatus, connectionStatus }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'training', label: 'Model Training', icon: Brain },
    { id: 'prediction', label: 'Traditional Fraud', icon: Shield },
    { id: 'creditcard', label: 'Credit Card Fraud', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'simulation', label: 'Simulation', icon: Activity },
    { id: 'analysis', label: 'Analysis', icon: FileText },
    { id: 'history', label: 'Prediction History', icon: History }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <Zap className="w-8 h-8 text-purple-400" />
          <h1 className="text-xl font-bold text-white">Quantum Fraud</h1>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isDisabled = connectionStatus !== CONNECTION_STATUS.CONNECTED && item.id !== 'dashboard';
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && setCurrentPage(item.id)}
                disabled={isDisabled}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-purple-600 text-white'
                    : isDisabled
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Connection Status */}
        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Connection</h3>
          <div className="flex items-center space-x-2">
            {connectionStatus === CONNECTION_STATUS.CONNECTED ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : connectionStatus === CONNECTION_STATUS.CONNECTING ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-gray-300 capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Enhanced Model Status */}
        <div className="mt-4 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Model Status</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {modelStatus.quantum_model_trained ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-gray-300">Traditional Quantum</span>
            </div>
            <div className="flex items-center space-x-2">
              {modelStatus.classical_models_trained ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-gray-300">Traditional Classical</span>
            </div>
            <div className="flex items-center space-x-2">
              {modelStatus.creditcard_quantum_model_trained ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-gray-300">Credit Card Quantum</span>
            </div>
            <div className="flex items-center space-x-2">
              {modelStatus.creditcard_classical_models_trained ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-gray-300">Credit Card Classical</span>
            </div>
            <div className="flex items-center space-x-2">
              {modelStatus.creditcard_data_loaded ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className="text-xs text-gray-300">Credit Card Data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};