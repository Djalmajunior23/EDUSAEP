import React, { useState } from 'react';
import { generateExam, ExamCriteria } from '../../../services/examService';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

export function ExamGenerator({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  const [criteria, setCriteria] = useState<ExamCriteria>({
    theme: '',
    competency: '',
    questionCount: 5,
    difficulty: 'médio',
    type: 'objetiva',
    bloomTaxonomy: 'aplicar',
    idealResponseExample: ''
  });
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!criteria.theme) { toast.error("Tema é obrigatório"); return; }
    setLoading(true);
    try {
      await generateExam(criteria);
      toast.success("Prova gerada com sucesso e salva nos rascunhos!");
    } catch (e) {
      toast.error("Erro ao gerar prova");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl space-y-6 w-full max-w-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerador de Provas IA</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold p-2">X</button>
        </div>
      
        <input 
          className="w-full p-3 border rounded-lg"
          placeholder="Tema da prova"
          value={criteria.theme}
          onChange={e => setCriteria({...criteria, theme: e.target.value})}
        />
        
        <select 
          className="w-full p-3 border rounded-lg"
          value={criteria.difficulty}
          onChange={e => setCriteria({...criteria, difficulty: e.target.value as any})}
        >
          <option value="fácil">Fácil</option>
          <option value="médio">Médio</option>
          <option value="difícil">Difícil</option>
        </select>
        
        <select 
          className="w-full p-3 border rounded-lg"
          value={criteria.type}
          onChange={e => {
            const newType = e.target.value as any;
            setCriteria({...criteria, type: newType, questionCount: newType === 'simulado' ? 40 : criteria.questionCount});
          }}
        >
          <option value="objetiva">Objetiva</option>
          <option value="discursiva">Discursiva</option>
          <option value="simulado">Simulado SAEP (40 Questões)</option>
        </select>

        {criteria.type === 'discursiva' && (
          <textarea
            className="w-full p-3 border rounded-lg"
            placeholder="Exemplo de resposta ideal (opcional)"
            value={criteria.idealResponseExample || ''}
            onChange={e => setCriteria({...criteria, idealResponseExample: e.target.value})}
          />
        )}

        <button 
          onClick={async () => {
            await handleGenerate();
            onClose();
          }}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 p-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Gerar Prova Inteligente
        </button>
      </div>
    </div>
  );
}
