import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Database, X, Info, BrainCircuit, ListChecks, FileText, CheckCircle2, Target, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateDiscursiveQuestion, validateAndImproveQuestion } from '../../services/geminiService';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { cn } from '../../lib/utils';

interface DiscursiveQuestionGeneratorProps {
  user: any;
  userProfile: any;
  selectedModel: string;
}

export function DiscursiveQuestionGenerator({ user, userProfile, selectedModel }: DiscursiveQuestionGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [difficulty, setDifficulty] = useState<'fácil' | 'médio' | 'difícil'>('médio');
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [localModel, setLocalModel] = useState(selectedModel || 'gemini-1.5-flash');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<any | null>(null);
  const [validationResult, setValidationResult] = useState<any | null>(null);

  useEffect(() => {
    if (selectedModel) {
      setLocalModel(selectedModel);
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchCompetencies();
  }, []);

  const fetchCompetencies = async () => {
    try {
      const q = query(collection(db, 'disciplines'), orderBy('name'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompetencies(list);
    } catch (error) {
      console.error("Error fetching competencies:", error);
    }
  };

  const handleFillExample = () => {
    setPrompt('Desenvolvimento de uma API RESTful com Node.js e Express, abordando autenticação JWT e boas práticas de segurança.');
    setDifficulty('difícil');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Informe o tema ou prompt para gerar a questão.");
      return;
    }

    setIsGenerating(true);
    setGeneratedQuestion(null);
    setValidationResult(null);
    try {
      const question = await generateDiscursiveQuestion(prompt, difficulty, localModel, userProfile?.role || 'TEACHER', selectedCompetency);
      setGeneratedQuestion(question);
      toast.success("Questão discursiva gerada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar questão:", err);
      toast.error(`Erro ao gerar questão: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!generatedQuestion) return;

    setIsValidating(true);
    try {
      const result = await validateAndImproveQuestion(generatedQuestion, selectedCompetency || 'Lógica de Programação', localModel);
      setValidationResult(result);
      if (result.status === 'aprovado') {
        toast.success("A IA aprovou a questão sem ressalvas!");
      } else {
        toast.info(`A IA sugeriu melhorias: ${result.status}`);
      }
    } catch (err: any) {
      toast.error("Erro ao validar questão.");
    } finally {
      setIsValidating(false);
    }
  };

  const applyImprovements = () => {
    if (validationResult?.improvedQuestion) {
      setGeneratedQuestion(validationResult.improvedQuestion);
      setValidationResult(null);
      toast.success("Melhorias aplicadas!");
    }
  };

  const saveToBank = async () => {
    if (!generatedQuestion || !user) return;

    try {
      await addDoc(collection(db, 'questions'), {
        ...generatedQuestion,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success("Questão salva no banco de questões!");
      setGeneratedQuestion(null);
      setValidationResult(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'questions');
      toast.error("Erro ao salvar questão.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-indigo-100 dark:border-indigo-900/30 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <FileText size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Gerador de Questões Discursivas</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Crie questões abertas com critérios de avaliação e respostas esperadas detalhadas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tema ou Prompt do Professor</label>
              <button 
                onClick={handleFillExample} 
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md transition-colors"
              >
                Preencher Exemplo
              </button>
            </div>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Descreva o funcionamento do ciclo da água e sua importância para o ecossistema..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Competência Alvo (Opcional)</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={selectedCompetency}
                onChange={(e) => setSelectedCompetency(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white appearance-none"
              >
                <option value="">Selecione uma competência...</option>
                {competencies.map(c => (
                  <option key={c.id} value={c.nome || c.name}>{c.nome || c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nível de Dificuldade</label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            >
              <option value="fácil">Fácil</option>
              <option value="médio">Médio</option>
              <option value="difícil">Difícil</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Modelo de IA</label>
            <select 
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido)</option>
              <option value="gemini-flash-latest">Gemini Flash Latest</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {isGenerating ? "Gerando Questão..." : "Gerar Questão Discursiva"}
        </button>
      </div>

      <AnimatePresence>
        {generatedQuestion && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-indigo-100 dark:border-indigo-900/30 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {generatedQuestion.dificuldade}
                  </span>
                  <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Bloom: {generatedQuestion.bloom}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {generatedQuestion.competenciaNome}
                  </span>
                </div>
                <button 
                  onClick={() => setGeneratedQuestion(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Enunciado</h4>
                  <textarea 
                    value={generatedQuestion.enunciado}
                    onChange={(e) => setGeneratedQuestion({ ...generatedQuestion, enunciado: e.target.value })}
                    className="w-full bg-transparent text-lg font-bold text-gray-900 dark:text-white leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg p-2 resize-none"
                    rows={4}
                  />
                </div>

                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={18} />
                    <p className="text-xs font-bold uppercase tracking-wider">Resposta Esperada (Padrão)</p>
                  </div>
                  <textarea 
                    value={generatedQuestion.respostaEsperada}
                    onChange={(e) => setGeneratedQuestion({ ...generatedQuestion, respostaEsperada: e.target.value })}
                    className="w-full bg-transparent text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-lg p-2 resize-none"
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <ListChecks size={20} />
                    <h4 className="font-bold">Critérios de Avaliação (Rubrica)</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {generatedQuestion.criteriosAvaliacao.map((crit: any, idx: number) => (
                      <div key={idx} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <input 
                            value={crit.criterio}
                            onChange={(e) => {
                              const newCrits = [...generatedQuestion.criteriosAvaliacao];
                              newCrits[idx] = { ...newCrits[idx], criterio: e.target.value };
                              setGeneratedQuestion({ ...generatedQuestion, criteriosAvaliacao: newCrits });
                            }}
                            className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 rounded px-1 flex-1"
                          />
                          <div className="flex items-center gap-1">
                            <input 
                              type="number"
                              value={crit.pontuacao}
                              onChange={(e) => {
                                const newCrits = [...generatedQuestion.criteriosAvaliacao];
                                newCrits[idx] = { ...newCrits[idx], pontuacao: Number(e.target.value) };
                                setGeneratedQuestion({ ...generatedQuestion, criteriosAvaliacao: newCrits });
                              }}
                              className="w-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-center rounded outline-none"
                            />
                            <span className="text-[10px] font-bold text-gray-400">pts</span>
                          </div>
                        </div>
                        <textarea 
                          value={crit.descricao}
                          onChange={(e) => {
                            const newCrits = [...generatedQuestion.criteriosAvaliacao];
                            newCrits[idx] = { ...newCrits[idx], descricao: e.target.value };
                            setGeneratedQuestion({ ...generatedQuestion, criteriosAvaliacao: newCrits });
                          }}
                          className="w-full bg-transparent text-xs text-gray-500 dark:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/20 rounded p-1 resize-none"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Info size={18} />
                    <p className="text-xs font-bold uppercase tracking-wider">Sugestão de Feedback do Professor</p>
                  </div>
                  <textarea 
                    value={generatedQuestion.feedbackProfessorSugerido || ''}
                    onChange={(e) => setGeneratedQuestion({ ...generatedQuestion, feedbackProfessorSugerido: e.target.value })}
                    className="w-full bg-transparent text-sm text-blue-800 dark:text-blue-300 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2 resize-none"
                    rows={3}
                  />
                </div>

                {generatedQuestion.aiExplicabilidade && (
                  <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/20 space-y-4">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <BrainCircuit size={18} />
                      <p className="text-xs font-bold uppercase tracking-wider">Explicabilidade da IA (XAI)</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-purple-500 uppercase">Dificuldade</p>
                        <p className="text-xs text-purple-800 dark:text-purple-300">{generatedQuestion.aiExplicabilidade.justificativaDificuldade}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-purple-500 uppercase">Taxonomia</p>
                        <p className="text-xs text-purple-800 dark:text-purple-300">{generatedQuestion.aiExplicabilidade.justificativaBloom}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-bold text-purple-500 uppercase">Intenção Pedagógica</p>
                        <p className="text-xs text-purple-800 dark:text-purple-300">{generatedQuestion.aiExplicabilidade.intencaoPedagogica}</p>
                      </div>
                    </div>
                  </div>
                )}

                {validationResult && (
                  <div className={cn(
                    "p-6 rounded-2xl border space-y-4",
                    validationResult.status === 'aprovado' ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20" :
                    validationResult.status === 'ressalvas' ? "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20" :
                    "bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/20"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertCircle size={18} />
                        Análise de Qualidade IA: {validationResult.status.toUpperCase()}
                      </div>
                      {validationResult.improvedQuestion && (
                        <button 
                          onClick={applyImprovements}
                          className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all border border-indigo-100"
                        >
                          Aplicar Melhorias Sugeridas
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{validationResult.feedback}"</p>
                    {validationResult.sugestoes?.length > 0 && (
                      <ul className="space-y-1">
                        {validationResult.sugestoes.map((s: string, i: number) => (
                          <li key={i} className="text-xs text-gray-500 flex items-center gap-2">
                            <ChevronRight size={12} className="text-indigo-400" /> {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={handleValidate}
                  disabled={isValidating || isGenerating}
                  className="flex-1 py-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isValidating ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
                  {isValidating ? "Validando..." : "Validar Qualidade (IA)"}
                </button>
                <button 
                  onClick={saveToBank}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Database size={20} />
                  Salvar no Banco de Questões
                </button>
                <button 
                  onClick={() => setGeneratedQuestion(null)}
                  className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Descartar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
