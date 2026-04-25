import React from 'react';
import { motion } from 'motion/react';
import { Target, ArrowRight, Zap, BookOpen, Clock } from 'lucide-react';

interface RecommendedActivity {
  title: string;
  type: string;
  link?: string;
  duration?: string;
}

interface PrioritizedTopic {
  topic: string;
  justification: string;
}

interface StudyPlan {
  title: string;
  description: string;
  prioritizedTopics: PrioritizedTopic[];
  recommendedActivities: RecommendedActivity[];
}

interface StudentLearningPathProps {
  plan: StudyPlan | null;
}

export function StudentLearningPath({ plan }: StudentLearningPathProps) {
  if (!plan) return null;

  const topics = plan.prioritizedTopics || (plan as any).priorityTopics || [];
  const activities = plan.recommendedActivities || (plan as any).recommendedExercises || (plan as any).activities || [];
  const description = plan.description || (plan as any).mensagem_motivacional || "Este é o seu plano de estudos personalizado para as próximas semanas.";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden shadow-lg shadow-emerald-50 dark:shadow-none my-8"
    >
      <div className="bg-emerald-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{plan.title || "Seu Plano de Estudos (IA)"}</h2>
            <p className="text-emerald-50 text-xs font-medium">IA Predict: Foco em lacunas de competência</p>
          </div>
        </div>
        <p className="text-sm text-emerald-50 leading-relaxed">{description}</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Tópicos Priorizados */}
        {topics.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-amber-500" />
              Tópicos Prioritários
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topics.map((item: any, idx: number) => (
                <div key={idx} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                  <p className="font-bold text-amber-900 text-sm mb-1">{item.topic}</p>
                  <p className="text-xs text-amber-700">{item.justification || item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Atividades Recomendadas */}
        {activities.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={14} className="text-emerald-600" />
              Atividades Recomendadas
            </h3>
            <div className="space-y-3">
              {activities.map((activity: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl group hover:border-emerald-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{activity.title || activity.name || activity.theme || activity.topic}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{activity.type || activity.competency || "Exercício"}</span>
                        {activity.duration && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock size={10} />
                            {activity.duration}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {activity.link ? (
                    <a 
                      href={activity.link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <ArrowRight size={20} />
                    </a>
                  ) : (
                    <button className="p-2 text-gray-300">
                      <ArrowRight size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
