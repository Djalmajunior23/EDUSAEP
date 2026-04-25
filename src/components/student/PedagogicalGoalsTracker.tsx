import { useState, useEffect } from 'react';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  Plus, 
  TrendingUp,
  Clock
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export function PedagogicalGoalsTracker({ userId }: { userId: string }) {
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'smart_goals'), where('userId', '==', userId)),
      (snap) => {
        setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsub();
  }, [userId]);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Target size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Minhas Metas</h3>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Controle de Progresso</p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <Plus size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="py-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
            <p className="text-sm font-bold text-gray-500">Sem metas ativas.</p>
            <p className="text-[10px] text-gray-400">Arraste metas sugeridas pela IA para começar.</p>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${goal.status === 'completed' ? 'text-emerald-500' : 'text-gray-300'}`}>
                    {goal.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </div>
                  <span className={`text-sm font-bold ${goal.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                    {goal.title}
                  </span>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  +{goal.xpAward || 50} XP
                </span>
              </div>
              
              <div className="flex items-center justify-between pl-8">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${goal.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">{goal.progress}%</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                  <Clock size={10} />
                  Faltam {goal.daysLeft || 5} dias
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-gray-50 dark:border-gray-700">
        <div className="bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Ritmo de Conclusão: Ótimo</span>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline">Ver Histórico</button>
        </div>
      </div>
    </div>
  );
}
