import React, { useState, useEffect } from 'react';
import { FileText, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import StatusCard from '../../components/common/StatusCard';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { API_BASE } from '../../utils/constants';

const COLORS = ['#22c55e', '#ef4444']; // green = Safe, red = Fraud

export const AnalysisPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary] = useState({ total: 0, fraud: 0, safe: 0 });

  const clearAnalysis = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      if (window.confirm('Are you sure you want to clear all saved predictions?')) {
        // TODO: replace with API call if backend supports bulk delete
        setPredictions([]);
        setSummary({ total: 0, fraud: 0, safe: 0 });
        localStorage.removeItem('saved_predictions');
      }
    } catch (error) {
      console.error('Error clearing predictions:', error);
    }
  };

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`${API_BASE}/saved-predictions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.predictions && data.predictions.length > 0) {
            const allPredictions = [];
            data.predictions.forEach((pred) => {
              if (pred.result?.predictions) {
                allPredictions.push(...pred.result.predictions);
              }
            });

            setPredictions(allPredictions);

            const fraudCount = allPredictions.filter((row) => row.is_fraud).length;
            const safeCount = allPredictions.length - fraudCount;
            setSummary({
              total: allPredictions.length,
              fraud: fraudCount,
              safe: safeCount,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching predictions:', error);
      }
    };

    fetchPredictions();
  }, []);

  if (!predictions || predictions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Fraud Analysis Dashboard</h1>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center">
          <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">
            No analysis data found. Please upload and predict transactions first.
          </p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Safe', value: summary.safe },
    { name: 'Fraud', value: summary.fraud },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Fraud Analysis Dashboard</h1>
        </div>
        <button
          onClick={clearAnalysis}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Clear Analysis
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard title="Total Transactions" value={summary.total.toString()} icon={Activity} color="blue" />
        <StatusCard title="Fraud Transactions" value={summary.fraud.toString()} icon={AlertTriangle} color="red" />
        <StatusCard title="Safe Transactions" value={summary.safe.toString()} icon={CheckCircle} color="green" />
      </div>

      {/* Pie Chart */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Fraud vs Safe Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Predictions Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-white">Transaction Analysis</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead className="bg-slate-700 sticky top-0 z-10">
              <tr>
                {Object.keys(predictions[0]).map((key) => (
                  <th key={key} className="px-2 py-1 text-left text-gray-300 font-semibold">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {predictions.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b ${
                    row.is_fraud ? 'bg-red-900/50' : 'bg-green-900/50'
                  }`}
                >
                  {Object.values(row).map((val, vidx) => (
                    <td key={vidx} className="px-2 py-1">
                      {typeof val === 'boolean'
                        ? val
                          ? '⚠️ Fraud'
                          : '✅ Safe'
                        : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
