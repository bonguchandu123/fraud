import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import ConnectionError from '../components/ConnectionError';
import PredictionBar from '../components/PredictionBar';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const PredictionPage = ({ modelStatus, connectionStatus }) => {
  const [transaction, setTransaction] = useState({
    amount: 100,
    hour: 14,
    device: 'Mobile',
    merchant_risk: 0.3,
    merchant_category: 'Electronics',
    transaction_type: 'Online',
    cardholder_age: 35,
  });

  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const { user } = useAuth();

  const handlePredict = async () => {
    if (
      (!modelStatus.quantum_model_trained && !modelStatus.classical_models_trained) ||
      connectionStatus !== 'connected'
    ) {
      alert('Please ensure at least one model is trained and connection is active');
      return;
    }

    setPredicting(true);
    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(transaction),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPrediction(data);

      // Auto-save prediction
      await savePrediction('traditional', transaction, data);
    } catch (error) {
      console.error('Prediction failed:', error);
      alert(`Prediction failed: ${error.message}`);
    } finally {
      setPredicting(false);
    }
  };

  const savePrediction = async (type, input, result) => {
    try {
      await fetch(`${API_BASE}/save-prediction`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          prediction_type: type,
          input_data: input,
          result: result,
          username: user?.username || 'anonymous',
        }),
      });
    } catch (error) {
      console.error('Failed to save prediction:', error);
    }
  };

  if (connectionStatus === 'disconnected') {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-purple-400" />
        <h1 className="text-3xl font-bold text-white">Traditional Fraud Prediction</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Transaction Details</h3>

          <div className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Amount ($)</label>
              <input
                type="number"
                value={transaction.amount}
                onChange={(e) =>
                  setTransaction({ ...transaction, amount: parseFloat(e.target.value) })
                }
                disabled={connectionStatus !== 'connected'}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 disabled:opacity-50"
              />
            </div>

            {/* Hour */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Hour (0-23)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={transaction.hour}
                onChange={(e) =>
                  setTransaction({ ...transaction, hour: parseInt(e.target.value) })
                }
                disabled={connectionStatus !== 'connected'}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 disabled:opacity-50"
              />
            </div>

            {/* Device */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Device</label>
              <select
                value={transaction.device}
                onChange={(e) => setTransaction({ ...transaction, device: e.target.value })}
                disabled={connectionStatus !== 'connected'}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 disabled:opacity-50"
              >
                <option value="Mobile">Mobile</option>
                <option value="Desktop">Desktop</option>
                <option value="ATM">ATM</option>
              </select>
            </div>

            {/* Merchant Risk */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Merchant Risk (0-1)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={transaction.merchant_risk}
                onChange={(e) =>
                  setTransaction({ ...transaction, merchant_risk: parseFloat(e.target.value) })
                }
                disabled={connectionStatus !== 'connected'}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 disabled:opacity-50"
              />
            </div>

            {/* Merchant Category */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Merchant Category</label>
              <select
                value={transaction.merchant_category}
                onChange={(e) =>
                  setTransaction({ ...transaction, merchant_category: e.target.value })
                }
                disabled={connectionStatus !== 'connected'}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 disabled:opacity-50"
              >
                <option value="Electronics">Electronics</option>
                <option value="Grocery">Grocery</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Transaction Type</label>
              <select
                value={transaction.transaction_type}
                onChange={(e) =>
                  setTransaction({ ...transaction, transaction_type: e.target.value })
                }
                disabled={connectionStatus !== 'connected'}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 disabled:opacity-50"
              >
                <option value="Online">Online</option>
                <option value="In-Person">In-Person</option>
                <option value="ATM">ATM</option>
              </select>
            </div>

            {/* Cardholder Age */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Cardholder Age</label>
              <input
                type="number"
                value={transaction.cardholder_age}
                onChange={(e) =>
                  setTransaction({ ...transaction, cardholder_age: parseInt(e.target.value) })
                }
                disabled={connectionStatus !== 'connected'}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 disabled:opacity-50"
              />
            </div>

            {/* Predict Button */}
            <button
              onClick={handlePredict}
              disabled={
                predicting ||
                (!modelStatus.quantum_model_trained && !modelStatus.classical_models_trained) ||
                connectionStatus !== 'connected'
              }
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium
                hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center space-x-2"
            >
              {predicting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Predicting...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Predict Fraud</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prediction Results */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Prediction Results</h3>

          {prediction ? (
            <div className="space-y-4">
              {/* Final Result */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  prediction.is_fraud
                    ? 'bg-red-900/50 border-red-500'
                    : 'bg-green-900/50 border-green-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {prediction.is_fraud ? (
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      {prediction.is_fraud ? 'FRAUD DETECTED' : 'LEGITIMATE TRANSACTION'}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Hybrid Confidence: {(prediction.hybrid_prediction * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Model Predictions */}
              <div className="space-y-3">
                <PredictionBar label="Quantum Model" value={prediction.quantum_prediction} color="purple" />
                <PredictionBar label="Random Forest" value={prediction.classical_rf_prediction} color="blue" />
                <PredictionBar label="Logistic Regression" value={prediction.classical_lr_prediction} color="green" />
                <PredictionBar
                  label="Hybrid (Final)"
                  value={prediction.hybrid_prediction}
                  color="orange"
                  bold
                  isFraud={prediction.is_fraud}
                />
              </div>

              <div className="bg-slate-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400">Prediction automatically saved to your history</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Enter transaction details and click predict to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;
