import React from 'react';

export const PredictionBar = ({ label, value, color, bold = false, isFraud = null }) => {
  const colorClasses = {
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
  };

  return (
    <div className={`p-3 rounded-lg ${bold ? "bg-slate-700 border border-slate-600" : "bg-slate-700/50"}`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-sm ${bold ? "font-semibold text-white" : "text-gray-300"}`}>
          {label}
        </span>
        <span className={`text-sm font-medium ${bold ? "text-white" : "text-gray-300"}`}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-slate-600 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${value * 100}%` }}
        ></div>
      </div>

      {/* FRAUD / LEGIT label */}
      {isFraud !== null && (
        <div className={`text-center font-bold text-lg mt-2 ${isFraud ? "text-red-500" : "text-green-500"}`}>
          {isFraud ? "FRAUD" : "LEGIT"}
        </div>
      )}
    </div>
  );
};