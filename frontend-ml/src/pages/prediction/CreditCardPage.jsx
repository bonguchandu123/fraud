import React, { useState } from "react";
import { CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ConnectionError from "../../components/common/ConnectionError";
import PredictionBar from "../../components/common/PredictionBar";
import CreditCardInput from "../../components/forms/CreditCardInput";
import { API_BASE, getHeaders } from "../../utils/api";

const CreditCardPage = ({ connectionStatus }) => {
  const [transaction, setTransaction] = useState({
    V1: -1.359807, V2: -0.072781, V3: 2.536347, V4: 1.378155, V5: -0.338321,
    V6: 0.462388, V7: 0.239599, V8: 0.098698, V9: 0.363787, V10: 0.090794,
    V11: -0.551600, V12: -0.617801, V13: -0.991390, V14: -0.311169, V15: 1.468177,
    V16: -0.470401, V17: 0.207971, V18: 0.025791, V19: 0.403993, V20: 0.251412,
    V21: -0.018307, V22: 0.277838, V23: -0.110474, V24: 0.066928, V25: 0.128539,
    V26: -0.189115, V27: 0.133558, V28: -0.021053,
    Time: 0, Amount: 149.62,
  });

  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const { user } = useAuth();

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const response = await fetch(`${API_BASE}/predict-creditcard`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPrediction(data);

      // Auto-save prediction
      await savePrediction("creditcard", transaction, data);
    } catch (error) {
      console.error("Prediction failed:", error);
      alert(`Prediction failed: ${error.message}`);
    } finally {
      setPredicting(false);
    }
  };

  const savePrediction = async (type, input, result) => {
    try {
      const response = await fetch(`${API_BASE}/save-prediction`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          prediction_type: type,
          input_data: input,
          result: result,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save prediction");
      }
      console.log("Prediction saved successfully");
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  if (connectionStatus === "disconnected") {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <CreditCard className="w-8 h-8 text-purple-400" />
        <h1 className="text-3xl font-bold text-white">
          Credit Card Fraud Detection
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <CreditCardInput
          transaction={transaction}
          setTransaction={setTransaction}
          predicting={predicting}
          handlePredict={handlePredict}
          connectionStatus={connectionStatus}
        />

        {/* Results */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">
            Analysis Results
          </h3>

          {prediction ? (
            <div className="space-y-4">
              {/* Final Result */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  prediction.is_fraud
                    ? "bg-red-900/50 border-red-500"
                    : "bg-green-900/50 border-green-500"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {prediction.is_fraud ? (
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      {prediction.is_fraud
                        ? "FRAUD DETECTED"
                        : "LEGITIMATE TRANSACTION"}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Confidence: {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Model Predictions */}
              <div className="space-y-3">
                <PredictionBar
                  label="Quantum Model"
                  value={prediction.quantum_prediction}
                  color="purple"
                />
                <PredictionBar
                  label="Random Forest"
                  value={prediction.classical_rf_prediction}
                  color="blue"
                />
                <PredictionBar
                  label="Logistic Regression"
                  value={prediction.classical_lr_prediction}
                  color="green"
                />
                <PredictionBar
                  label="Hybrid (Final)"
                  value={prediction.hybrid_prediction}
                  color="orange"
                  bold
                  isFraud={prediction.is_fraud}
                />
                <button
                  onClick={() =>
                    savePrediction("Quantum vs Classical", transaction, prediction)
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Save Prediction
                </button>
              </div>

              {/* Transaction Details */}
              <div className="bg-slate-700 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                  Transaction Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                  <div>Amount: ${transaction.Amount}</div>
                  <div>Time: {transaction.Time}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                Enter transaction details and click analyze to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditCardPage;
