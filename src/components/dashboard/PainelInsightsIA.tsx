import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { generatePedagogicalAnalysis } from '../../services/geminiService';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function PainelInsightsIA({ data }: { data?: any }) {
  const [insights, setInsights] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchInsights = async () => {
    try {
      const q = query(collection(db, 'insights_ia'), orderBy('data_geracao', 'desc'), limit(5));
      const snapshot = await getDocs(q);
      setInsights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'insights_ia');
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerateInsights = async () => {
    if (!data) return;
    setIsGenerating(true);
    try {
      // Fetch diagnostics to include SIAC imported data
      const diagnosticsSnap = await getDocs(collection(db, 'diagnostics'));
      const diagnostics = diagnosticsSnap.docs.map(d => d.data());

      const combinedData = {
        ...data,
        diagnosticsCount: diagnostics.length,
        // We can pass a summary of diagnostics to avoid huge payloads
        diagnosticsSummary: diagnostics.slice(0, 50).map(d => ({
          score: d.score,
          maxScore: d.maxScore,
          competencies: d.diagnostico_por_competencia || []
        }))
      };

      const analysis = await generatePedagogicalAnalysis(combinedData);
      
      await addDoc(collection(db, 'insights_ia'), {
        tipo: 'analise_pedagogica',
        resumo: analysis.resumo_geral,
        json_resposta: analysis,
        data_geracao: serverTimestamp()
      });

      toast.success("Insights gerados com sucesso!");
      fetchInsights();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'insights_ia');
      toast.error("Erro ao gerar insights.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="text-emerald-600" size={20} />
          Insights da IA
        </h3>
        <button
          onClick={handleGenerateInsights}
          disabled={isGenerating || !data}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Gerar Novos
        </button>
      </div>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {insights.length === 0 && !isGenerating && (
          <p className="text-sm text-gray-500 text-center py-4">Nenhum insight gerado ainda. Clique em "Gerar Novos" para analisar os dados.</p>
        )}
        {insights.map(insight => (
          <div key={insight.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="font-medium text-gray-900 text-sm leading-relaxed">{insight.resumo}</p>
            <p className="text-xs text-gray-500 mt-2">
              {insight.data_geracao?.seconds 
                ? new Date(insight.data_geracao.seconds * 1000).toLocaleDateString() 
                : 'Recente'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
