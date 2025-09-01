import React from 'react';

export const QuickActionCard = ({ title, description, icon: Icon, color }) => {
  const colorClasses = {
    purple: 'hover:border-purple-500',
    blue: 'hover:border-blue-500',
    green: 'hover:border-green-500',
    orange: 'hover:border-orange-500'
  };

  return (
    <div className={`bg-slate-700 rounded-lg p-4 border border-slate-600 hover:bg-slate-600/50 transition-colors cursor-pointer ${colorClasses[color]}`}>
      <Icon className="w-6 h-6 text-purple-400 mb-2" />
      <h4 className="text-white font-medium mb-1">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};