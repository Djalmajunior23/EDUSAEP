// src/components/dashboard/PainelRecomendacoes.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { AlertCircle, BookOpen, Target } from 'lucide-react';

export function PainelRecomendacoes() {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const q = query(collection(db, 'recomendacoes_pedagogicas'), orderBy('data_geracao', 'desc'));
      const snapshot = await getDocs(q);
      setRecommendations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRecommendations();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'text-red-600 bg-red-50 border-red-200';
      case 'media': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Target className="text-indigo-600" />
        Recomendações Pedagógicas
      </h3>
      <div className="space-y-4">
        {recommendations.length === 0 && <p className="text-gray-500">Nenhuma recomendação pendente.</p>}
        {recommendations.map(rec => (
          <div key={rec.id} className={`p-4 rounded-lg border ${getPriorityColor(rec.prioridade)}`}>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5" />
              <div>
                <p className="font-bold uppercase text-xs mb-1">{rec.tipo_recomendacao}</p>
                <p className="font-medium">{rec.descricao}</p>
                <p className="text-xs mt-2 opacity-75">{new Date(rec.data_geracao).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
