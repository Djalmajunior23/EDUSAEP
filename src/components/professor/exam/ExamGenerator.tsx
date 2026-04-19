
import React, { useState } from 'react';
import { generateExam, ExamCriteria } from '../../services/examService';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

export function ExamGenerator() {
  const [criteria, setCriteria] = useState<ExamCriteria>({
    theme: '',
    competency: '',
    questionCount: 5,
    difficulty: 'médio',
    type: 'objetiva',
    bloomTaxonomy: 'aplicar'
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
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
      <h2 className="text-2xl font-bold">Gerador de Provas IA</h2>
      
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

      <button 
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 p-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Gerar Prova Inteligente
      </button>
    </div>
  );
}
