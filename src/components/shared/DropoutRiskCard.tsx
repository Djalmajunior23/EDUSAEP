import React from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DropoutRiskCardProps {
  score: number;
  level: string;
  justifications: string[];
  isStudentView?: boolean;
}

export function DropoutRiskCard({ score, level, justifications, isStudentView = false }: DropoutRiskCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  const getColors = () => {
    if (score >= 80 || level === 'Crítico') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500', accent: 'bg-red-500' };
    if (score >= 50 || level === 'Alto') return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-500', accent: 'bg-rose-500' };
    if (score >= 30 || level === 'Médio') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500', accent: 'bg-amber-500' };
    return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', accent: 'bg-emerald-500' };
  };

  const colors = getColors();

  if (score < 30 && isStudentView) return null; // Don't scare the student if it's low

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${colors.bg} ${colors.border} border rounded-3xl p-6 shadow-sm relative overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 w-2 h-full ${colors.accent}`} />
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`${colors.bg} border-2 ${colors.border} p-3 rounded-2xl`}>
            {score > 60 ? <AlertTriangle className={colors.icon} size={28} /> : <AlertCircle className={colors.icon} size={28} />}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${colors.text}`}>
              {isStudentView ? 'Atenção ao seu Ritmo de Aprendizado' : `Risco de Evasão: ${level}`}
            </h3>
            <p className="text-sm opacity-80 font-medium">
              {isStudentView 
                ? 'Detectamos uma queda no seu engajamento. Vamos recuperar?' 
                : 'Analise os motivos técnicos identificados pela IA.'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-4xl font-black ${colors.text}`}>{score}%</span>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Dropout Risk Index</p>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-2 text-xs font-bold ${colors.text} hover:opacity-70 transition-opacity`}
        >
          <Info size={14} /> 
          Ver Justificativas Técnicas
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ul className="mt-4 space-y-2">
                {justifications.map((j, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-white/50 p-3 rounded-xl border border-white/20">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors.accent}`} />
                    {j}
                  </li>
                ))}
              </ul>
              {isStudentView && (
                <div className="mt-4 p-4 bg-white/40 rounded-2xl text-xs text-gray-600 italic">
                  <strong>Sugestão da IA:</strong> Aumente sua frequência de acesso e tente completar as atividades pendentes para reduzir este índice e melhorar seu desempenho.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
