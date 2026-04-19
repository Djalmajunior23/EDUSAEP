
import React, { useState } from 'react';
import { toast } from 'sonner';
import { batchAssistCorrection } from '../../../services/correctionService';
import { Loader2, CheckSquare } from 'lucide-react';

export function BatchCorrectionAssistant({ assessmentId, submissions }: { assessmentId: string, submissions: { studentId: string, answers: any[] }[] }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleBatchCorrection = async () => {
    setLoading(true);
    try {
      const results = await batchAssistCorrection(assessmentId, submissions);
      setResults(results);
      toast.success(`Correção em lote concluída: ${results.filter(r => r.success).length} sucesso(s)`);
    } catch (e) {
      toast.error("Erro na correção em lote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <h3 className="font-bold text-lg">Correção em Lote (IA)</h3>
      <button 
        onClick={handleBatchCorrection}
        disabled={loading || submissions.length === 0}
        className="w-full p-3 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <CheckSquare />}
        Processar {submissions.length} Submissões
      </button>

      {results.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
          <p>Processamento concluído. {results.filter(r => r.success).length} de {results.length} processadas com sucesso.</p>
        </div>
      )}
    </div>
  );
}
