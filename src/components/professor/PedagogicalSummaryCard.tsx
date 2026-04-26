import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, ArrowRight, BookOpen } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export function PedagogicalSummaryCard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    pendingActions: 0,
    criticalRisks: 0,
    topAction: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const decisionsSnap = await getDocs(query(collection(db, 'pedagogicalDecisions'), orderBy('createdAt', 'desc')));
        const risksSnap = await getDocs(collection(db, 'studentRiskScores'));
        
        const critical = risksSnap.docs.filter(d => d.data().level === 'HIGH' || d.data().riskLevel === 'Crítico').length;
        
        setSummary({
          pendingActions: decisionsSnap.size,
          criticalRisks: critical,
          topAction: decisionsSnap.docs.length > 0 ? decisionsSnap.docs[0].data().title : 'Nenhuma ação pendente'
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="bg-white p-6 rounded-3xl animate-pulse h-40"></div>;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 group">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Resumo Pedagógico</h3>
        <button onClick={() => navigate('/observatory')} className="text-xs font-bold text-indigo-600 flex items-center gap-1">
          Observatório <ArrowRight size={14} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-rose-50 p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-rose-600" />
            <p className="text-[10px] font-bold text-rose-700 uppercase">Riscos</p>
          </div>
          <p className="text-xl font-black text-rose-900">{summary.criticalRisks}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-indigo-600" />
            <p className="text-[10px] font-bold text-indigo-700 uppercase">Ações</p>
          </div>
          <p className="text-xl font-black text-indigo-900">{summary.pendingActions}</p>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 font-medium truncate">
        Próxima ação: {summary.topAction}
      </div>
    </div>
  );
}
