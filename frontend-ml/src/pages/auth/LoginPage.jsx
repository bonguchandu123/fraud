import React, { useState } from 'react';
import { Zap, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiService } from '../../utils/api.js';

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = isLogin 
        ? { username: formData.username, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password };

      const data = isLogin 
        ? await apiService.login(payload)
        : await apiService.register(payload);

      if (isLogin) {
        if (data.access_token) {
          login(data.access_token, data.username);
        } else {
          throw new Error(data.detail || 'Login failed');
        }
      } else {
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateQuantumPassword = async () => {
    setGeneratingPassword(true);
    console.log('Attempting to generate quantum password...');
    
    try {
      const data = await apiService.generateQuantumPassword({
        length: 12,
        include_special: true
      });

      console.log('Response data:', data);

      if (data.success) {
        setGeneratedPassword(data.password);
        setPasswordStrength(data.strength);
        setFormData({...formData, password: data.password});
      } else {
        setError('Failed to generate quantum password: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating password:', error);
      setError('Error generating password: ' + error.message);
    } finally {
      setGeneratingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700 w-full max-w-md">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Zap className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Quantum Fraud</h1>
        </div>

        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
              isLogin ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
              !isLogin ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 pr-12"
                required
              />
              {!isLogin && (
                <button
                  type="button"
                  onClick={() => setShowPasswordGenerator(!showPasswordGenerator)}
                  className="absolute right-2 top-2 p-1 text-purple-400 hover:text-purple-300"
                  title="Generate Quantum Password"
                >
                  <Zap className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {!isLogin && showPasswordGenerator && (
              <div className="mt-3 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-300">Quantum Password Generator</h4>
                  <button
                    type="button"
                    onClick={generateQuantumPassword}
                    disabled={generatingPassword}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-1"
                  >
                    {generatingPassword ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    <span>{generatingPassword ? 'Generating...' : 'Generate'}</span>
                  </button>
                </div>
                
                {generatedPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Generated Password:</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        passwordStrength === 'Very Strong' ? 'bg-green-900 text-green-300' :
                        passwordStrength === 'Strong' ? 'bg-blue-900 text-blue-300' :
                        passwordStrength === 'Good' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {passwordStrength}
                      </span>
                    </div>
                    <div className="bg-slate-800 p-2 rounded text-sm text-white font-mono break-all">
                      {generatedPassword}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, password: generatedPassword})}
                      className="w-full text-xs bg-slate-600 text-white py-1 rounded hover:bg-slate-500"
                    >
                      Use This Password
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                {isLogin ? <Lock className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isLogin ? 'Login' : 'Register'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};