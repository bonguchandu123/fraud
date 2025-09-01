import React from 'react';

export const PerformanceCard = ({ title, score, color }) => {
  const getScoreColor = (score) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.8) return 'text-yellow-400';
    return 'text-red-400';
  };

  const colorClasses = {
    purple: 'border-purple-500',
    blue: 'border-blue-500',
    green: 'border-green-500'
  };

  return (
    <div className={`bg-slate-700 rounded-lg p-6 border ${colorClasses[color]}`}>
      <h4 className="text-white font-medium mb-2">{title}</h4>
      <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
        {score.toFixed(4)}
      </div>
      <div className="mt-2">
        <div className="w-full bg-slate-600 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
            style={{ width: `${score * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};