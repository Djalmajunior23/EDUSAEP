import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, BookOpen, Target, Sparkles, Wand2, Download, ExternalLink, Calendar,
  CheckCircle2, Triangle, Lightbulb, ArrowRight, Save, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, query, where, getDocs, updateDoc, doc, limit, orderBy, onSnapshot, addDoc, serverTimestamp
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { generateContentWrapper, DEFAULT_CONFIG, safeParseJson } from '../../services/geminiService';
import { Type } from '@google/genai';

interface CorrectionPlanViewProps {
  studentId: string;
}

export function CorrectionPlanView({ studentId }: CorrectionPlanViewProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const q = query(
      collection(db, 'correction_plans'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'correction_plans');
    });
    return () => unsubscribe();
  }, [studentId]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
          <Wand2 size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Planos de Intervenção Ativa</h2>
          <p className="text-gray-500 dark:text-gray-400">Roteiros personalizados gerados por IA para correção de rotas pedagógicas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <motion.div 
            key={plan.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                {plan.competency}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                {new Date(plan.createdAt?.seconds * 1000).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-lg font-bold dark:text-white">Intervenção: {plan.title || 'Melhoria de Performance'}</h3>
            <div className="space-y-3">
              {(plan.actions || []).map((action: string, i: number) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={12} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{action}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        {plans.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <Sparkles className="mx-auto text-gray-200 dark:text-gray-700 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400 font-medium">A IA ainda não gerou planos de intervenção para você.</p>
            <p className="text-xs text-gray-400 mt-1">Conclua mais diagnósticos e simulados para disparar o motor de inteligência.</p>
          </div>
        )}
      </div>
    </div>
  );
}
