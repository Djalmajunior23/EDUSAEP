import React from 'react';
import { AlertTriangle, TrendingDown, Info } from 'lucide-react';

export const RiskAlertCard: React.FC<{ 
  score: number, 
  reasons: string[], 
  pace?: string, 
  workloadAdjustment?: string 
}> = ({ score, reasons, pace, workloadAdjustment }) => {
  if (score < 30) return null; // Only show if risk is meaningful

  const isHighRisk = score >= 70;

  return (
    <div className={`p-4 rounded-xl border ${isHighRisk ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} shadow-sm`}>
      <div className="flex items-center gap-3 mb-2">
        <AlertTriangle className={`w-5 h-5 ${isHighRisk ? 'text-red-600' : 'text-amber-600'}`} />
        <h3 className={`font-bold ${isHighRisk ? 'text-red-900' : 'text-amber-900'}`}>
          Índice de Risco: {score}/100
        </h3>
      </div>
      <p className="text-sm mb-3">Justificativas:</p>
      <ul className="text-xs list-disc pl-4 space-y-1 mb-4">
        {reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
      
      {/* Pace and Workload Info */}
      <div className="mt-4 pt-4 border-t border-black/10">
        <p className="text-sm font-semibold mb-1">Ritmo: <span className="capitalize">{pace || 'Não definido'}</span></p>
        <p className="text-xs text-gray-700">Sugestão: {workloadAdjustment || 'Mantenha o ritmo atual.'}</p>
      </div>
    </div>
  );
};
