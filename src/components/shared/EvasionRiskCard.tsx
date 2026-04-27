import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { calculateEvasionRisk } from '../../services/evasionRiskService';

export function EvasionRiskCard({ studentId }: { studentId: string }) {
  const [risk, setRisk] = useState<{ score: number; justification: string } | null>(null);

  useEffect(() => {
    calculateEvasionRisk(studentId).then(setRisk);
  }, [studentId]);

  if (!risk) return null;

  return (
    <div className={`p-4 rounded-2xl border ${risk.score > 70 ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={18} className={risk.score > 70 ? 'text-rose-600' : 'text-amber-600'} />
        <h3 className="font-bold text-gray-900">Risco de Evasão: {risk.score}/100</h3>
      </div>
      <p className="text-xs text-gray-600">{risk.justification}</p>
    </div>
  );
}
