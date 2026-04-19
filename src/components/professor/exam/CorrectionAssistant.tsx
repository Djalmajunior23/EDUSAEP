
import React, { useState } from 'react';
import { toast } from 'sonner';
import { assistCorrection } from '../../../services/correctionService';
import { Loader2, Check } from 'lucide-react';

export function CorrectionAssistant({ assessmentId, studentId, answers }: { assessmentId: string, studentId: string, answers: any[] }) {
  const [correction, setCorrection] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRunCorrection = async () => {
    setLoading(true);
    try {
      const result = await assistCorrection(assessmentId, studentId, answers);
      setCorrection(result);
      toast.success("IA pré-corrigiu com sucesso!");
    } catch (e) {
      toast.error("Erro na correção assistida");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="font-bold text-lg">Pré-Correção Assistida por IA</h3>
      <button 
        onClick={handleRunCorrection}
        disabled={loading}
        className="w-full p-3 bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Check />}
        Executar Correção da IA
      </button>

      {correction && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
          <p><strong>Nota:</strong> {correction.score} / {correction.maxScore}</p>
          <p><strong>Feedback Geral:</strong> {correction.feedback}</p>
        </div>
      )}
    </div>
  );
}
