import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, X } from 'lucide-react';
import { LessonPlanResult } from '../../services/geminiService';

interface LessonPlanProps {
  plan: LessonPlanResult | null;
  onClose?: () => void;
  activityNotes?: Record<number, string>;
  onUpdateActivityNote?: (index: number, note: string) => void;
}

export function LessonPlan({ plan, onClose, activityNotes = {}, onUpdateActivityNote }: LessonPlanProps) {
  if (!plan) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl shadow-emerald-200 dark:shadow-none"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{plan.title}</h3>
              <p className="text-xs text-emerald-100 italic">Plano de aula remediador gerado por IA</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Objetivos</h4>
              <ul className="space-y-2">
                {plan.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 size={16} className="mt-1 flex-shrink-0" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Tópicos para Revisão</h4>
              <div className="flex flex-wrap gap-2">
                {plan.topicsToReview?.map((topic, i) => (
                  <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Atividades Sugeridas</h4>
              <ul className="space-y-3">
                {plan.practicalActivities?.map((act, i) => (
                  <li key={i} className="p-3 bg-white/10 rounded-2xl text-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/20 rounded-xl text-xs font-bold">{i + 1}</div>
                      <span className="font-bold">{act.name}</span>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-md">{act.duration}</span>
                    </div>
                    <p className="text-xs text-emerald-100 pl-10">{act.description}</p>
                    {onUpdateActivityNote && (
                      <textarea
                        placeholder="Adicionar observações para esta atividade..."
                        className="mt-2 w-full p-2 text-xs bg-white/10 rounded-lg border border-white/20 focus:ring-1 focus:ring-white outline-none"
                        value={activityNotes[i] || act.professor_notes || ''}
                        onChange={(e) => onUpdateActivityNote(i, e.target.value)}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
