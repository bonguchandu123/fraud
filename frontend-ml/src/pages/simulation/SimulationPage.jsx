import React, { useState } from 'react';
import { Activity, Play } from 'lucide-react';
import ConnectionError from '../../components/common/ConnectionError';
import { API_BASE, getHeaders } from '../../utils/api';

const SimulationPage = ({ modelStatus, connectionStatus }) => {
  const [simulating, setSimulating] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [count, setCount] = useState(10);

  const runSimulation = async () => {
    if (
      !modelStatus.quantum_model_trained || 
      !modelStatus.classical_models_trained || 
      connectionStatus !== 'connected'
    ) {
      alert('Please train the traditional models first and ensure connection is active');
      return;
    }

    setSimulating(true);
    try {
      const response = await fetch(`${API_BASE}/simulate-transactions?count=${count}`, {
        method: 'POST',
        headers: getHeaders(false),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Simulation failed:', error);
      alert(`Simulation failed: ${error.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (connectionStatus === 'disconnected') {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Transaction Simulation</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-gray-300 text-sm">Count:</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="100"
              disabled={connectionStatus !== 'connected'}
              className="w-20 bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 disabled:opacity-50"
            />
          </div>
          <button
            onClick={runSimulation}
            disabled={simulating || !modelStatus.quantum_model_trained || !modelStatus.classical_models_trained || connectionStatus !== 'connected'}
            className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium
              hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center space-x-2"
          >
            {simulating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {transactions.length > 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-xl font-semibold text-white">Simulation Results</h3>
            <p className="text-gray-400 text-sm mt-1">
              {transactions.filter(t => t.is_fraud).length} fraudulent transactions detected out of {transactions.length}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  {['ID','Amount','Time','Device','Risk','Quantum','RF','Hybrid','Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-gray-300">{transaction.id}</td>
                    <td className="px-4 py-3 text-gray-300">${transaction.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">{transaction.hour}:00</td>
                    <td className="px-4 py-3 text-gray-300">{transaction.device}</td>
                    <td className="px-4 py-3 text-gray-300">{transaction.merchant_risk}</td>
                    <td className="px-4 py-3 text-gray-300">{transaction.quantum_prediction}</td>
                    <td className="px-4 py-3 text-gray-300">{transaction.rf_prediction}</td>
                    <td className="px-4 py-3 text-gray-300">{transaction.hybrid_prediction}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.is_fraud 
                          ? 'bg-red-900 text-red-300 border border-red-700'
                          : 'bg-green-900 text-green-300 border border-green-700'
                      }`}>
                        {transaction.is_fraud ? 'FRAUD' : 'SAFE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center">
          <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Run a simulation to generate and analyze random transactions</p>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
