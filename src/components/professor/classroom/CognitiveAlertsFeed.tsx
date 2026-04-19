import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AlertCircle, Brain, Sparkles, Loader2 } from 'lucide-react';
import { getActionableAdvice, LoadStatus } from '../../../services/cognitiveService';

export function CognitiveAlertsFeed({ classId }: { classId: string }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [advice, setAdvice] = useState<Record<string, string>>({});
  const [loadingAdvice, setLoadingAdvice] = useState<Record<string, boolean>>({});

  const loadAdvice = async (alertId: string, status: LoadStatus, studentName: string) => {
    setLoadingAdvice(prev => ({ ...prev, [alertId]: true }));
    const actionableAdvice = await getActionableAdvice(status, studentName);
    setAdvice(prev => ({ ...prev, [alertId]: actionableAdvice }));
    setLoadingAdvice(prev => ({ ...prev, [alertId]: false }));
  };

  useEffect(() => {
    const q = query(collection(db, "cognitiveLoadChecks"), orderBy("timestamp", "desc"), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [classId]);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900">
        <Brain className="text-indigo-500" />
        Alertas de Carga Cognitiva
      </h3>
      {alerts.map(alert => (
        <div key={alert.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="text-sm font-bold text-amber-900">{alert.message}</p>
              <p className="text-xs text-amber-700">Aluno ID: {alert.studentId}</p>
            </div>
          </div>
          
          {advice[alert.id] ? (
            <div className="bg-white/50 p-2 rounded-lg border border-amber-200">
              <p className="text-xs font-medium text-amber-800 italic">💡 {advice[alert.id]}</p>
            </div>
          ) : (
            <button 
              onClick={() => loadAdvice(alert.id, alert.status, "Aluno")}
              disabled={loadingAdvice[alert.id]}
              className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
            >
              {loadingAdvice[alert.id] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Obter Sugestão de Intervenção
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
