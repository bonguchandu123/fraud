import React, { useState } from 'react';

export const CreditCardInput = () => {
  const [transaction, setTransaction] = useState({
    V1: 0, V2: 0, V3: 0, V4: 0, V5: 0, V6: 0, V7: 0, V8: 0, V9: 0, V10: 0,
    V11: 0, V12: 0, V13: 0, V14: 0, V15: 0, V16: 0, V17: 0, V18: 0, V19: 0, V20: 0,
    V21: 0, V22: 0, V23: 0, V24: 0, V25: 0, V26: 0, V27: 0, V28: 0,
    Time: 0, Amount: 100
  });

  const handleInputChange = (field, value) => {
    setTransaction(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div>
        <label className="block text-gray-300 text-xs font-medium mb-1">Time</label>
        <input
          type="number"
          value={transaction.Time}
          onChange={(e) => handleInputChange('Time', e.target.value)}
          className="w-full bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 text-sm"
        />
      </div>
      <div>
        <label className="block text-gray-300 text-xs font-medium mb-1">Amount</label>
        <input
          type="number"
          value={transaction.Amount}
          onChange={(e) => handleInputChange('Amount', e.target.value)}
          className="w-full bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 text-sm"
        />
      </div>
      {Array.from({length: 28}, (_, i) => i + 1).map(num => (
        <div key={num}>
          <label className="block text-gray-300 text-xs font-medium mb-1">V{num}</label>
          <input
            type="number"
            step="0.000001"
            value={transaction[`V${num}`]}
            onChange={(e) => handleInputChange(`V${num}`, e.target.value)}
            className="w-full bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 text-sm"
          />
        </div>
      ))}
    </div>
  );
};