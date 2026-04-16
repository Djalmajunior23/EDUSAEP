import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  ArrowRight,
  Brain,
  Target
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function CorrectionPlanView({ studentId }: { studentId: string }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const q = query(collection(db, 'correction_plans'), where('studentId', '==', studentId));
    const unsub = onSnapshot(q, (snap) => {
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [studentId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Planos de Acerto</h3>
          <p className="text-sm text-gray-500">Trilhas de recuperação baseadas em seus erros específicos.</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
          <FileText size={24} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-gray-50 p-12 rounded-3xl border-2 border-dashed border-gray-100 text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-gray-300">
            <CheckCircle2 size={32} />
          </div>
          <p className="text-gray-500 font-medium">Você não possui planos de acerto pendentes. Excelente!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <motion.div 
              key={plan.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  plan.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {plan.status === 'PENDING' ? 'Pendente' : 'Concluído'}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">
                  {plan.createdAt?.seconds ? new Date(plan.createdAt.seconds * 1000).toLocaleDateString() : 'Hoje'}
                </span>
              </div>

              <h4 className="font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                Recuperação: {plan.examTitle || 'SImulado Geral'}
              </h4>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                   <AlertCircle size={14} className="text-red-500" />
                   <span>{plan.wrongQuestionsKeys?.length || 0} questões para revisar</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                   <Target size={14} className="text-emerald-500" />
                   <span>{plan.competenciesToRetake?.length || 0} competências críticas</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-6">
                 <div className="flex items-center gap-2 text-[10px] font-black text-amber-700 uppercase mb-1">
                   <Brain size={12} /> Sugestão da IA
                 </div>
                 <p className="text-[10px] text-amber-800 line-clamp-2 italic">{plan.aiExplanations}</p>
              </div>

              <button className="w-full py-3 bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-700 transition-all shadow-lg shadow-amber-100">
                Iniciar Plano <ArrowRight size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
