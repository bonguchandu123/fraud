import React, { useState } from 'react';
import { Brain, Cpu, CreditCard } from 'lucide-react';
import TrainingCard from '../components/TrainingCard';
import ConnectionError from '../components/ConnectionError';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const getHeaders = (isJson = true) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const TrainingPage = ({ onTrainingComplete, connectionStatus }) => {
  const { isAuthenticated } = useAuth();

  const [trainingQuantum, setTrainingQuantum] = useState(false);
  const [trainingClassical, setTrainingClassical] = useState(false);
  const [trainingCreditCardQuantum, setTrainingCreditCardQuantum] = useState(false);
  const [trainingCreditCardClassical, setTrainingCreditCardClassical] = useState(false);

  const [quantumResult, setQuantumResult] = useState(null);
  const [classicalResult, setClassicalResult] = useState(null);
  const [creditCardQuantumResult, setCreditCardQuantumResult] = useState(null);
  const [creditCardClassicalResult, setCreditCardClassicalResult] = useState(null);

  const [config, setConfig] = useState({
    epochs: 20,
    batch_size: 64,
    stepsize: 0.2,
    seed: 123,
  });

  // -------------------------
  // Training API Calls
  // -------------------------
  const trainQuantumModel = async () => {
    if (connectionStatus !== 'connected') return;
    setTrainingQuantum(true);
    try {
      const response = await fetch(`${API_BASE}/train-quantum`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setQuantumResult(data);
      if (data.success) onTrainingComplete();
    } catch (error) {
      setQuantumResult({ success: false, message: error.message });
    } finally {
      setTrainingQuantum(false);
    }
  };

  const trainClassicalModels = async () => {
    if (connectionStatus !== 'connected') return;
    setTrainingClassical(true);
    try {
      const response = await fetch(`${API_BASE}/train-classical`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setClassicalResult(data);
      if (data.success) onTrainingComplete();
    } catch (error) {
      setClassicalResult({ success: false, message: error.message });
    } finally {
      setTrainingClassical(false);
    }
  };

  const trainCreditCardQuantum = async () => {
    if (connectionStatus !== 'connected') return;
    setTrainingCreditCardQuantum(true);
    try {
      const response = await fetch(`${API_BASE}/train-creditcard-quantum`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setCreditCardQuantumResult(data);
      if (data.success) onTrainingComplete();
    } catch (error) {
      setCreditCardQuantumResult({ success: false, message: error.message });
    } finally {
      setTrainingCreditCardQuantum(false);
    }
  };

  const trainCreditCardClassical = async () => {
    if (connectionStatus !== 'connected') return;
    setTrainingCreditCardClassical(true);
    try {
      const response = await fetch(`${API_BASE}/train-creditcard-classical`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setCreditCardClassicalResult(data);
      if (data.success) onTrainingComplete();
    } catch (error) {
      setCreditCardClassicalResult({ success: false, message: error.message });
    } finally {
      setTrainingCreditCardClassical(false);
    }
  };

  // -------------------------
  // Render
  // -------------------------
  if (connectionStatus === 'disconnected') {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center text-white py-10">
        <p className="text-lg">Please log in to train models.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Brain className="w-8 h-8 text-purple-400" />
        <h1 className="text-3xl font-bold text-white">Model Training</h1>
      </div>

      {/* Training Configuration */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Training Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['epochs', 'batch_size', 'stepsize', 'seed'].map((field) => (
            <div key={field}>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                {field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </label>
              <input
                type={field === 'stepsize' ? 'number' : 'number'}
                step={field === 'stepsize' ? '0.1' : '1'}
                value={config[field]}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    [field]: field === 'stepsize' ? parseFloat(e.target.value) : parseInt(e.target.value),
                  })
                }
                disabled={connectionStatus !== 'connected'}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Traditional Models Section */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Traditional Fraud Detection Models</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrainingCard
            title="Traditional Quantum Model"
            description="Train the quantum neural network for traditional fraud detection"
            icon={Cpu}
            color="purple"
            isTraining={trainingQuantum}
            result={quantumResult}
            onTrain={trainQuantumModel}
            connectionStatus={connectionStatus}
          />
          <TrainingCard
            title="Traditional Classical Models"
            description="Train Random Forest and Logistic Regression for traditional fraud"
            icon={Brain}
            color="blue"
            isTraining={trainingClassical}
            result={classicalResult}
            onTrain={trainClassicalModels}
            connectionStatus={connectionStatus}
          />
        </div>
      </div>

      {/* Credit Card Models Section */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Credit Card Fraud Detection Models</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrainingCard
            title="Credit Card Quantum Model"
            description="Train quantum model for credit card fraud detection"
            icon={CreditCard}
            color="purple"
            isTraining={trainingCreditCardQuantum}
            result={creditCardQuantumResult}
            onTrain={trainCreditCardQuantum}
            connectionStatus={connectionStatus}
          />
          <TrainingCard
            title="Credit Card Classical Models"
            description="Train classical models for credit card fraud detection"
            icon={CreditCard}
            color="green"
            isTraining={trainingCreditCardClassical}
            result={creditCardClassicalResult}
            onTrain={trainCreditCardClassical}
            connectionStatus={connectionStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
