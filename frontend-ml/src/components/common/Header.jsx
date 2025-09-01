import React from 'react';
import { Wifi, WifiOff, User, LogOut } from 'lucide-react';
import { CONNECTION_STATUS } from '../../utils/constants.js';

export const Header = ({ connectionStatus, onRetry, user, onLogout }) => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Quantum Fraud Detection System</h2>
        <div className="flex items-center space-x-4">
          {connectionStatus === CONNECTION_STATUS.DISCONNECTED && (
            <button
              onClick={onRetry}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
            >
              Retry Connection
            </button>
          )}
          <div className="flex items-center space-x-2 text-gray-300">
            {connectionStatus === CONNECTION_STATUS.CONNECTED ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-sm">System Online</span>
              </>
            ) : connectionStatus === CONNECTION_STATUS.CONNECTING ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                <span className="text-sm">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-sm">Connection Failed</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 text-gray-300">
            <User className="w-4 h-4" />
            <span className="text-sm">{user?.username}</span>
            <button
              onClick={onLogout}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};