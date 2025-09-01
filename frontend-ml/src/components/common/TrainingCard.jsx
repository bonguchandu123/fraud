import React from 'react';
import { Play } from 'lucide-react';
import { CONNECTION_STATUS } from '../../utils/constants.js';

export const TrainingCard = ({ title, description, icon: Icon, color, isTraining, result, onTrain, connectionStatus }) => {
  const colorMap = {
    purple: 'bg-purple-600 hover:bg-purple-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700'
  };

  const iconColorMap = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400'
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className={`w-6 h-6 ${iconColorMap[color]}`} />
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      
      <p className="text-gray-400 mb-4">{description}</p>
      
      <button
        onClick={onTrain}
        disabled={isTraining || connectionStatus !== CONNECTION_STATUS.CONNECTED}
        className={`w-full text-white py-3 px-4 rounded-lg font-medium
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors flex items-center justify-center space-x-2 ${colorMap[color]}`}
      >
        {isTraining ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Training...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>Train Model</span>
          </>
        )}
      </button>

      {result && (
        <div className={`mt-6 p-5 rounded-xl shadow-lg ${
          result.success
            ? "bg-green-900/40 border border-green-700"
            : "bg-red-900/40 border border-red-700"
        }`}>
          <p className={`font-semibold text-lg ${
            result.success ? "text-green-300" : "text-red-300"
          }`}>
            {result.message}
          </p>

          {result.metrics && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-gray-800/40 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-sm">AUC</p>
                <p className="text-lg font-bold text-white">
                  {result.metrics.auc?.toFixed(4) ||
                   result.metrics.random_forest_auc?.toFixed(4) ||
                   result.metrics.logistic_regression_auc?.toFixed(4) || 
                   'N/A'}
                </p>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-sm">F1 Score</p>
                <p className="text-lg font-bold text-white">
                  {result.metrics.f1?.toFixed(4) ||
                   result.metrics.random_forest_f1?.toFixed(4) ||
                   result.metrics.logistic_regression_f1?.toFixed(4) || 
                   'N/A'}
                </p>
              </div>
              <div className="bg-gray-800/40 p-3 rounded-lg text-center">
                <p className="text-gray-400 text-sm">Accuracy</p>
                <p className="text-lg font-bold text-white">
                  {result.metrics.test_accuracy?.toFixed(4) ||
                   result.metrics.random_forest_accuracy?.toFixed(4) ||
                   result.metrics.logistic_regression_accuracy?.toFixed(4) || 
                   'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};