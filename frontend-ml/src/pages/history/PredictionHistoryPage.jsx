import React, { useState, useEffect } from 'react';
import { History, Download, Activity, Shield, CreditCard, TrendingUp, XCircle, FileText } from 'lucide-react';
import { API_BASE } from '../../utils/constants';
import StatusCard from '../../components/common/StatusCard';
import ConnectionError from '../../components/common/ConnectionError';

// TODO: Replace with actual authentication context
import { useAuth } from '../../context/AuthContext';

// Temporary helper until you create utils/auth.js
const getHeaders = (isJson = true) => {
  const token = localStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`,
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    'ngrok-skip-browser-warning': 'true'
  };
};

const PredictionHistoryPage = ({ connectionStatus }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPredictions();
    fetchUserStats();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await fetch(`${API_BASE}/saved-predictions`, {
        headers: getHeaders(false),
      });
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions || []);
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/user-stats`, {
        headers: getHeaders(false),
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const deletePrediction = async (predictionId) => {
    try {
      const response = await fetch(`${API_BASE}/saved-predictions/${predictionId}`, {
        method: 'DELETE',
        headers: getHeaders(false),
      });
      if (response.ok) {
        setPredictions((prev) => prev.filter((p) => p._id !== predictionId));
        fetchUserStats();
      }
    } catch (error) {
      console.error('Failed to delete prediction:', error);
    }
  };

  const exportPredictions = async () => {
    try {
      const response = await fetch(`${API_BASE}/export-predictions`, {
        headers: getHeaders(false),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.csv_data) {
          const blob = new Blob([data.csv_data], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `predictions_${user?.username || 'export'}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Failed to export predictions:', error);
    }
  };

  if (connectionStatus === 'disconnected') {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <History className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Prediction History</h1>
        </div>
        <button
          onClick={exportPredictions}
          className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatusCard title="Total Predictions" value={stats.total_predictions.toString()} icon={Activity} color="blue" />
          <StatusCard title="Traditional Fraud" value={stats.prediction_counts?.traditional || '0'} icon={Shield} color="purple" />
          <StatusCard title="Credit Card" value={stats.prediction_counts?.creditcard || '0'} icon={CreditCard} color="green" />
          <StatusCard title="Recent Activity" value={stats.recent_predictions?.length?.toString() || '0'} icon={TrendingUp} color="yellow" />
        </div>
      )}

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-white">Saved Predictions</h3>
        </div>
        
        {predictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-300 font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-medium">Result</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-medium">Confidence</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((prediction) => (
                  <tr key={prediction._id} className="border-t border-slate-700 hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.prediction_type === 'creditcard' 
                          ? 'bg-green-900 text-green-300 border border-green-700'
                          : 'bg-purple-900 text-purple-300 border border-purple-700'
                      }`}>
                        {prediction.prediction_type === 'creditcard' ? 'Credit Card' : 'Traditional'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.result.is_fraud 
                          ? 'bg-red-900 text-red-300 border border-red-700'
                          : 'bg-green-900 text-green-300 border border-green-700'
                      }`}>
                        {prediction.result.is_fraud ? 'FRAUD' : 'SAFE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {prediction.result.confidence !== undefined
                        ? `${(prediction.result.confidence * 100).toFixed(1)}%`
                        : prediction.result.hybrid_prediction !== undefined
                          ? `${(prediction.result.hybrid_prediction * 100).toFixed(1)}%`
                          : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(prediction.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deletePrediction(prediction._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No predictions saved yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionHistoryPage;
