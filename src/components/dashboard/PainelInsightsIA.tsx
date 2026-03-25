// src/components/dashboard/PainelInsightsIA.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export function PainelInsightsIA() {
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    const fetchInsights = async () => {
      const q = query(collection(db, 'insights_ia'), orderBy('data_geracao', 'desc'), limit(5));
      const snapshot = await getDocs(q);
      setInsights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchInsights();
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
      <h3 className="text-lg font-bold mb-4">Insights da IA</h3>
      <div className="space-y-4">
        {insights.map(insight => (
          <div key={insight.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-medium text-gray-900">{insight.resumo}</p>
            <p className="text-sm text-gray-500">{new Date(insight.data_geracao).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
