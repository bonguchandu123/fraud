import React, { useState, useEffect } from 'react';
import { 
  Home, Activity, Cpu, Brain, CreditCard, Database, Upload, Shield,
  CheckCircle, XCircle
} from 'lucide-react';
import { StatusCard, QuickActionCard } from '../../components/common/index.js';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Legend, Cell } from '../../components/charts/ChartComponents.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiService } from '../../utils/api.js';
import { CONNECTION_STATUS, COLORS } from '../../utils/constants.js';

export const DashboardPage = ({ modelStatus, connectionStatus }) => {
  const [systemHealth, setSystemHealth] = useState(null);
  const { user } = useAuth();

  // Sample data for charts
  const barData = [
    { name: 'Traditional Quantum', trained: modelStatus.quantum_model_trained ? 1 : 0 },
    { name: 'Traditional Classical', trained: modelStatus.classical_models_trained ? 1 : 0 },
    { name: 'Credit Card Quantum', trained: modelStatus.creditcard_quantum_model_trained ? 1 : 0 },
    { name: 'Credit Card Classical', trained: modelStatus.creditcard_classical_models_trained ? 1 : 0 },
  ];

  const totalModels = 4;
  const trainedModels = [
    modelStatus.quantum_model_trained,
    modelStatus.classical_models_trained,
    modelStatus.creditcard_quantum_model_trained,
    modelStatus.creditcard_classical_models_trained
  ].filter(Boolean).length;

  const pieData = [
    { name: 'Trained', value: trainedModels },
    { name: 'Not Trained', value: totalModels - trainedModels },
  ];

  useEffect(() => {
    const checkHealth = async () => {
      if (connectionStatus !== CONNECTION_STATUS.CONNECTED) return;
      try {
        const data = await apiService.getHealth();
        setSystemHealth(data);
      } catch (error) {
        console.error('Health check failed:', error);
        setSystemHealth(null);
      }
    };
    checkHealth();
  }, [connectionStatus]);

  if (connectionStatus === CONNECTION_STATUS.DISCONNECTED) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-red-500/50 text-center">
        <p className="text-red-400">Connection Error - Unable to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Home className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>
        <div className="text-gray-300">
          Welcome back, <span className="text-white font-semibold">{user?.username}</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatusCard
          title="System Health"
          value={systemHealth?.status || (connectionStatus === CONNECTION_STATUS.CONNECTED ? 'Healthy' : 'Checking...')}
          icon={Activity}
          color={systemHealth?.status === 'healthy' ? 'green' : 'yellow'}
        />
        <StatusCard
          title="Traditional Quantum"
          value={modelStatus.quantum_model_trained ? 'Trained' : 'Not Trained'}
          icon={Cpu}
          color={modelStatus.quantum_model_trained ? 'green' : 'red'}
        />
        <StatusCard
          title="Traditional Classical"
          value={modelStatus.classical_models_trained ? 'Trained' : 'Not Trained'}
          icon={Brain}
          color={modelStatus.classical_models_trained ? 'green' : 'red'}
        />
        <StatusCard
          title="Credit Card Quantum"
          value={modelStatus.creditcard_quantum_model_trained ? 'Trained' : 'Not Trained'}
          icon={CreditCard}
          color={modelStatus.creditcard_quantum_model_trained ? 'green' : 'red'}
        />
        <StatusCard
          title="Credit Card Classical"
          value={modelStatus.creditcard_classical_models_trained ? 'Trained' : 'Not Trained'}
          icon={Database}
          color={modelStatus.creditcard_classical_models_trained ? 'green' : 'red'}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard title="Upload Data" description="Upload CSV data for training" icon={Upload} color="purple" />
          <QuickActionCard title="Train Models" description="Train quantum and classical models" icon={Brain} color="blue" />
          <QuickActionCard title="Traditional Prediction" description="Predict traditional fraud" icon={Shield} color="green" />
          <QuickActionCard title="Credit Card Analysis" description="Analyze credit card transactions" icon={CreditCard} color="orange" />
        </div>
      </div>

      {/* Model Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traditional Models */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Traditional Fraud Detection</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Quantum Model</span>
              {modelStatus.quantum_model_trained ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Classical Models</span>
              {modelStatus.classical_models_trained ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Available models: {modelStatus.available_models?.join(', ') || 'None'}
            </div>
          </div>
        </div>

        {/* Credit Card Models */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Credit Card Fraud Detection</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Data Loaded</span>
              {modelStatus.creditcard_data_loaded ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Quantum Model</span>
              {modelStatus.creditcard_quantum_model_trained ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Classical Models</span>
              {modelStatus.creditcard_classical_models_trained ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Available models: {modelStatus.available_creditcard_models?.join(', ') || 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Model Training Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" />
              <Bar dataKey="trained" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Overall Training Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#82ca9d"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};