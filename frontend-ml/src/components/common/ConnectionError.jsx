import React from 'react';
import { WifiOff } from 'lucide-react';

export const ConnectionError = ({ onRetry }) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-red-500/50 text-center">
    <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">Connection Error</h3>
    <p className="text-gray-400 mb-4">Unable to connect to the backend API</p>
    <button
      onClick={onRetry}
      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
    >
      Retry Connection
    </button>
  </div>
);