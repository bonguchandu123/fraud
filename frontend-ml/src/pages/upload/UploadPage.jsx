// src/pages/upload/UploadPage.jsx
import React, { useState } from "react";
import { Upload } from "lucide-react";
import ConnectionError from "../../components/common/ConnectionError";
import { API_BASE, getHeaders } from "../../utils/api";

const UploadPage = ({ connectionStatus }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [predicting, setPredicting] = useState(false);
  const [uploadType, setUploadType] = useState("traditional"); 

  const handleFileUpload = async () => {
    if (!file || connectionStatus !== "connected") return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const endpoint =
        uploadType === "creditcard" ? "/upload-creditcard-csv" : "/upload-csv";

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
        body: formData,
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setUploadResult(data);

      if (uploadType === "traditional" && data.preview) {
        await handlePredict(data.preview);
      }
    } catch (error) {
      setUploadResult({ success: false, message: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handlePredict = async (rows) => {
    setPredicting(true);
    const preds = [];

    for (const row of rows) {
      try {
        const res = await fetch(`${API_BASE}/predict`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            amount: row.amount,
            hour: row.time,
            device: row.device,
            merchant_risk: row.merchant_risk,
            merchant_category: row.merchant_category,
            transaction_type: row.transaction_type,
            cardholder_age: row.cardholder_age,
          }),
        });
        const pred = await res.json();
        preds.push({ ...row, is_fraud: pred.is_fraud });
      } catch (err) {
        console.error("Prediction failed for row:", row, err);
      }
    }

    setPredictions(preds);
    setPredicting(false);
  };

  const handleSavePredictions = async () => {
    if (!predictions.length) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please login first");
        return;
      }

      const response = await fetch(`${API_BASE}/save-prediction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          prediction_type: uploadType,
          input_data: {
            file_name: file.name,
            upload_type: uploadType,
            total_records: predictions.length,
          },
          result: {
            predictions: predictions,
            summary: {
              total: predictions.length,
              fraud: predictions.filter((p) => p.is_fraud).length,
              safe: predictions.filter((p) => !p.is_fraud).length,
            },
          },
        }),
      });

      if (response.ok) {
        alert("Predictions saved successfully!");
      } else {
        alert("Failed to save predictions");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving predictions");
    }
  };

  if (connectionStatus === "disconnected") {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Upload className="w-8 h-8 text-purple-400" />
        <h1 className="text-3xl font-bold text-white">Upload Data</h1>
      </div>

      {/* Upload Type Selection */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          Select Dataset Type
        </h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setUploadType("traditional")}
            className={`py-2 px-4 rounded-lg font-medium transition-colors ${
              uploadType === "traditional"
                ? "bg-purple-600 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            Traditional Fraud Data
          </button>
          <button
            onClick={() => setUploadType("creditcard")}
            className={`py-2 px-4 rounded-lg font-medium transition-colors ${
              uploadType === "creditcard"
                ? "bg-purple-600 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            Credit Card Dataset
          </button>
        </div>
      </div>

      {/* Upload Panel */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          {uploadType === "creditcard"
            ? "Credit Card CSV Upload"
            : "Traditional CSV Data Upload"}
        </h3>

        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">
              {uploadType === "creditcard"
                ? "Upload credit card dataset (creditcard.csv with V1-V28, Time, Amount, Class columns)"
                : "Upload your CSV file with transaction data"}
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              disabled={connectionStatus !== "connected"}
              className="block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-purple-600 file:text-white
                hover:file:bg-purple-700
                disabled:file:bg-gray-600 disabled:file:cursor-not-allowed"
            />
          </div>

          {/* File Info */}
          {file && (
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="text-gray-300">Selected file: {file.name}</p>
              <p className="text-gray-400 text-sm">
                Size: {(file.size / 1024).toFixed(2)} KB
              </p>
              <p className="text-gray-400 text-sm">
                Type:{" "}
                {uploadType === "creditcard"
                  ? "Credit Card Dataset"
                  : "Traditional Fraud Data"}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleFileUpload}
            disabled={!file || uploading || connectionStatus !== "connected"}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium
              hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            {uploading
              ? "Uploading..."
              : `Upload ${
                  uploadType === "creditcard" ? "Credit Card" : "Traditional"
                } Data`}
          </button>

          {/* Save Button for Traditional Data */}
          {uploadType === "traditional" &&
            predictions.length > 0 &&
            !predicting && (
              <button
                onClick={handleSavePredictions}
                className="w-full mt-2 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Save Predictions Locally
              </button>
            )}
        </div>

        {/* Upload Result Message */}
        {uploadResult && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              uploadResult.success
                ? "bg-green-900/50 border border-green-700"
                : "bg-red-900/50 border border-red-700"
            }`}
          >
            <p
              className={`font-medium ${
                uploadResult.success ? "text-green-300" : "text-red-300"
              }`}
            >
              {uploadResult.message}
            </p>
            {uploadResult.success && uploadType === "creditcard" && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-300">
                <div>Fraud: {uploadResult.fraud_count}</div>
                <div>Legitimate: {uploadResult.legitimate_count}</div>
                <div>
                  Fraud Rate: {uploadResult.fraud_percentage?.toFixed(2)}%
                </div>
                <div>Total: {uploadResult.shape?.[0]}</div>
              </div>
            )}
          </div>
        )}

        {/* Predictions Table for Traditional Data */}
        {uploadType === "traditional" && predictions.length > 0 && (
          <div className="mt-6 overflow-x-auto max-h-96 overflow-y-auto border border-gray-700 rounded-lg">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-gray-800 sticky top-0">
                <tr>
                  {Object.keys(predictions[0]).map((key) => (
                    <th
                      key={key}
                      className="px-2 py-1 text-left text-gray-300 font-semibold"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictions.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b ${
                      row.is_fraud ? "bg-red-900/50" : "bg-green-900/50"
                    }`}
                  >
                    {Object.values(row).map((val, vidx) => (
                      <td key={vidx} className="px-2 py-1">
                        {typeof val === "boolean"
                          ? val
                            ? "⚠️ Fraud"
                            : "✅ Safe"
                          : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
