import React from 'react';
import { BookOpen, CheckCircle2, Clock, Target } from 'lucide-react';

interface PathStep {
  title: string;
  description: string;
  duration: string;
  type: string;
}

interface Props {
  steps: PathStep[];
  title: string;
}

export function EduJarvisLearningPath({ steps, title }: Props) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <BookOpen size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{title}</h4>
          <p className="text-[10px] text-gray-500 font-medium tracking-wide">TRILHA INTELIGENTE RECOMENDADA</p>
        </div>
      </div>

      <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-indigo-100 dark:before:bg-gray-700">
        {steps.map((step, idx) => (
          <div key={idx} className="relative pl-10">
            <div className="absolute left-0 top-1 w-10 h-10 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-4 border-indigo-500 z-10" />
            </div>
            <div className="bg-white dark:bg-gray-800/80 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{step.type}</span>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Clock size={10} />
                  {step.duration}
                </div>
              </div>
              <h5 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">{step.title}</h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-emerald-500" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Objetivo: Aprovação no Simulado</span>
        </div>
        <CheckCircle2 size={16} className="text-gray-300" />
      </div>
    </div>
  );
}
