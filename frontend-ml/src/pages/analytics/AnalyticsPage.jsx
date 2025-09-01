// src/pages/analytics/AnalyticsPage.jsx
import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp } from "lucide-react";

import ConnectionError from "../../components/common/ConnectionError";
import PerformanceCard from "../../components/common/PerformanceCard";
import { API_BASE, getHeaders } from "../../utils/api";

const AnalyticsPage = ({ modelStatus, connectionStatus }) => {
  const [analytics, setAnalytics] = useState(null);
  const [creditCardAnalytics, setCreditCardAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("traditional");

  const fetchAnalytics = async () => {
    if (
      !modelStatus.quantum_model_trained ||
      !modelStatus.classical_models_trained ||
      connectionStatus !== "connected"
    ) {
      alert("Please train the traditional models first and ensure connection is active");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/analytics`, {
        headers: getHeaders(false),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Analytics fetch failed:", error);
      alert(`Analytics fetch failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditCardAnalytics = async () => {
    if (
      !modelStatus.creditcard_quantum_model_trained ||
      !modelStatus.creditcard_classical_models_trained ||
      connectionStatus !== "connected"
    ) {
      alert("Please train the credit card models first and ensure connection is active");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/creditcard-analytics`, {
        headers: getHeaders(false),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setCreditCardAnalytics(data);
    } catch (error) {
      console.error("Credit card analytics fetch failed:", error);
      alert(`Credit card analytics fetch failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      activeTab === "traditional" &&
      modelStatus.quantum_model_trained &&
      modelStatus.classical_models_trained &&
      connectionStatus === "connected"
    ) {
      fetchAnalytics();
    }
    if (
      activeTab === "creditcard" &&
      modelStatus.creditcard_quantum_model_trained &&
      modelStatus.creditcard_classical_models_trained &&
      connectionStatus === "connected"
    ) {
      fetchCreditCardAnalytics();
    }
  }, [modelStatus, connectionStatus, activeTab]);

  if (connectionStatus === "disconnected") {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  const currentAnalytics = activeTab === "traditional" ? analytics : creditCardAnalytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
        </div>
        <button
          onClick={activeTab === "traditional" ? fetchAnalytics : fetchCreditCardAnalytics}
          disabled={loading || connectionStatus !== "connected"}
          className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium
            hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Tab Selection */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab("traditional")}
          className={`py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === "traditional"
              ? "bg-purple-600 text-white"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          Traditional Fraud
        </button>
        <button
          onClick={() => setActiveTab("creditcard")}
          className={`py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === "creditcard"
              ? "bg-purple-600 text-white"
              : "bg-slate-700 text-gray-300 hover:bg-slate-600"
          }`}
        >
          Credit Card Fraud
        </button>
      </div>

      {currentAnalytics ? (
        <>
          {/* Model Performance */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Model Performance (AUC Score)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PerformanceCard
                title="Quantum Model"
                score={currentAnalytics.model_performance.quantum_auc}
                color="purple"
              />
              <PerformanceCard
                title="Random Forest"
                score={currentAnalytics.model_performance.random_forest_auc}
                color="blue"
              />
              <PerformanceCard
                title="Logistic Regression"
                score={currentAnalytics.model_performance.logistic_regression_auc}
                color="green"
              />
            </div>
          </div>

          {/* Feature Importance */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Feature Importance</h3>
            <div className="space-y-3">
              {Object.entries(currentAnalytics.feature_importance).map(
                ([feature, importance]) => (
                  <div key={feature} className="flex items-center space-x-4">
                    <div className="w-32 text-gray-300 text-sm">{feature}</div>
                    <div className="flex-1 bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${importance * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-gray-300 text-sm text-right">
                      {(importance * 100).toFixed(1)}%
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Confusion Matrix */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Confusion Matrix ({activeTab === "traditional" ? "Traditional" : "Credit Card"} Quantum Model)
            </h3>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">
                  {currentAnalytics.confusion_matrix[0][0]}
                </div>
                <div className="text-sm text-gray-300">True Negative</div>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-400">
                  {currentAnalytics.confusion_matrix[0][1]}
                </div>
                <div className="text-sm text-gray-300">False Positive</div>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-400">
                  {currentAnalytics.confusion_matrix[1][0]}
                </div>
                <div className="text-sm text-gray-300">False Negative</div>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">
                  {currentAnalytics.confusion_matrix[1][1]}
                </div>
                <div className="text-sm text-gray-300">True Positive</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center">
          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="text-gray-300">Loading analytics...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <BarChart3 className="w-16 h-16 text-gray-500" />
              <p className="text-gray-400">
                Train the {activeTab === "traditional" ? "traditional" : "credit card"} models to
                view analytics
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
