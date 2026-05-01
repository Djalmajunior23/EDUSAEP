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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
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

            {plan.recursos_necessarios && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Recursos Necessários</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-300 mb-1">Materiais/Insumos</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.recursos_necessarios.materiais.map((m, i) => (
                        <span key={i} className="px-2 py-1 bg-white/10 rounded-lg text-xs">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-300 mb-1">Digitais/Softwares</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.recursos_necessarios.digitais.map((d, i) => (
                        <span key={i} className="px-2 py-1 bg-white/10 rounded-lg text-xs">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {plan.plano_avaliacao && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Avaliação Tríplice</h4>
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div>
                    <p className="text-[10px] font-black text-emerald-300">DIAGNÓSTICA</p>
                    <p className="text-xs">{plan.plano_avaliacao.diagnostica}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-300">FORMATIVA</p>
                    <p className="text-xs">{plan.plano_avaliacao.formativa}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-300">SOMATIVA</p>
                    <p className="text-xs">{plan.plano_avaliacao.somativa}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {plan.cronograma_detalhado && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Cronograma Detalhado</h4>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-white/10 text-emerald-200">
                        <th className="p-3 text-left">Tempo</th>
                        <th className="p-3 text-left">Atividade</th>
                        <th className="p-3 text-left">Ação Professor</th>
                        <th className="p-3 text-left">Ação Aluno</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {plan.cronograma_detalhado.map((item, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="p-3 font-bold">{item.tempo}</td>
                          <td className="p-3">{item.atividade}</td>
                          <td className="p-3 text-emerald-100">{item.acao_professor}</td>
                          <td className="p-3 text-emerald-100">{item.acao_aluno}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Atividades Práticas Sugeridas</h4>
              <ul className="space-y-3">
                {plan.practicalActivities?.map((act, i) => (
                  <li key={i} className="p-4 bg-white/10 rounded-2xl text-sm flex flex-col gap-1 border border-white/5 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-white/20 rounded-xl text-xs font-bold">{i + 1}</div>
                      <span className="font-bold">{act.name}</span>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-md ml-auto">{act.duration}</span>
                    </div>
                    <p className="text-xs text-emerald-100 mb-2">{act.description}</p>
                    {onUpdateActivityNote && (
                      <textarea
                        placeholder="Adicionar observações para esta atividade..."
                        className="w-full p-3 text-xs bg-black/20 rounded-xl border border-white/10 focus:ring-1 focus:ring-emerald-400 outline-none text-white"
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
