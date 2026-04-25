import React, { useState } from 'react';
import { Database, BrainCircuit, Sparkles, 
  HelpCircle, ChevronRight, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticInputViewProps {
  onGenerate: (data: { aluno: string; input: string; language: string }) => void;
  isGenerating: boolean;
  userProfile: any;
}

export function DiagnosticInputView({ onGenerate, isGenerating, userProfile }: DiagnosticInputViewProps) {
  const [aluno, setAluno] = useState('');
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('Português');

  const handleSubmit = () => {
    if (!aluno.trim() || !input.trim()) {
      toast.error('Preencha o nome do aluno e os dados brutos.');
      return;
    }
    onGenerate({ aluno, input, language });
  };

  const examples = [
    { name: "Matemática", content: "Aluno A acertou 3 de 5 questões de frações, mas errou todas de geometria. Demonstra cansaço no final." },
    { name: "Programação", content: "Código com erros de sintaxe no loop for. Entende variáveis mas confunde escopo." },
    { name: "Interpretação", content: "Lê rápido mas perde detalhes implícitos. Vocabulário rico." }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-900/50">
          <BrainCircuit size={14} /> Novo Diagnóstico Estratégico
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
          Transforme Dados em <span className="text-indigo-600">Inteligência</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg leading-relaxed font-medium">
          Cole resultados de provas, observações em sala ou transcrições. Nossa IA fará o resto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-2xl shadow-indigo-100 dark:shadow-none border border-gray-100 dark:border-gray-700 space-y-8">
            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Quem é o Aluno ou Grupo?</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={aluno}
                  onChange={(e) => setAluno(e.target.value)}
                  placeholder="Nome do aluno, Turma ou ID..." 
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-900 dark:text-white"
                />
                <Database className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Insumos para Análise</label>
                <button 
                  onClick={() => setInput('')}
                  className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Limpar
                </button>
              </div>
              <div className="relative group">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ex: Nota 7.5 em Álgebra. Dificuldade em fatoração. Participação ativa nos fóruns..." 
                  className="w-full h-64 px-6 py-6 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-gray-600 dark:text-gray-400 resize-none leading-relaxed"
                />
                <div className="absolute right-6 bottom-6 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <Sparkles className="text-indigo-400 animate-pulse" size={24} />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleSubmit}
                disabled={isGenerating || !aluno.trim() || !input.trim()}
                className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                {isGenerating ? 'ANALISANDO...' : 'GERAR DIAGNÓSTICO IA'}
              </button>
              
              <div className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-4 py-2 bg-transparent text-xs font-bold text-gray-500 outline-none cursor-pointer"
                >
                  <option>Português</option>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-20 transition-transform group-hover:scale-110">
              <HelpCircle size={100} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Dica do Especialista</h3>
              <p className="text-indigo-100/90 text-sm leading-relaxed font-medium">
                "Para melhores resultados, inclua tanto dados quantitativos (notas) quanto qualitativos (comportamento e humor do aluno)."
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Cenários de Exemplo</h4>
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setAluno(ex.name);
                  setInput(ex.content);
                }}
                className="w-full text-left p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all group flex items-center justify-between"
              >
                <div>
                  <h5 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-xs mb-1">{ex.name}</h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-1 italic">"{ex.content}"</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
