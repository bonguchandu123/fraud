import React from 'react';

export const StatusCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    green: 'border-green-500 bg-green-900/20',
    red: 'border-red-500 bg-red-900/20',
    blue: 'border-blue-500 bg-blue-900/20',
    purple: 'border-purple-500 bg-purple-900/20',
    yellow: 'border-yellow-500 bg-yellow-900/20',
    orange: 'border-orange-500 bg-orange-900/20'
  };

  const iconColors = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400'
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border ${colorClasses[color] || 'border-slate-700'}`}>
      <div className="flex items-center space-x-4">
        <Icon className={`w-8 h-8 ${iconColors[color] || 'text-gray-400'}`} />
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-white text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};