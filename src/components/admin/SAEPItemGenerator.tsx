import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Zap, Database, X, Info, ChevronRight, Target, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateSAEPQuestion } from '../../services/geminiService';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SAEPItemGeneratorProps {
  user: any;
  userProfile: any;
  selectedModel: string;
}

export function SAEPItemGenerator({ user, userProfile, selectedModel }: SAEPItemGeneratorProps) {
  const [competency, setCompetency] = useState('');
  const [difficulty, setDifficulty] = useState<'fácil' | 'médio' | 'difícil'>('médio');
  const [localModel, setLocalModel] = useState(selectedModel || 'gemini-3-flash-preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<any | null>(null);

  useEffect(() => {
    if (selectedModel) {
      setLocalModel(selectedModel);
    }
  }, [selectedModel]);

  const handleFillExample = () => {
    setCompetency('Introdução ao Desenvolvimento de Sistemas');
    setDifficulty('médio');
  };

  const handleGenerate = async () => {
    if (!competency.trim()) {
      toast.error("Informe a competência para gerar a questão.");
      return;
    }

    setIsGenerating(true);
    setGeneratedQuestion(null);
    try {
      const question = await generateSAEPQuestion(competency, difficulty, localModel, userProfile?.role as any || 'TEACHER');
      setGeneratedQuestion(question);
      toast.success("Questão gerada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar questão:", err);
      toast.error(`Erro ao gerar questão: ${err.message || "Erro desconhecido"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToBank = async () => {
    if (!generatedQuestion || !user) return;

    // Validation
    if (!generatedQuestion.enunciado || generatedQuestion.enunciado.trim().length === 0) {
      toast.error("O enunciado da questão não pode estar vazio.");
      return;
    }

    if (!generatedQuestion.alternativas || !Array.isArray(generatedQuestion.alternativas) || generatedQuestion.alternativas.length < 2) {
      toast.error("A questão deve ter pelo menos duas alternativas.");
      return;
    }

    const emptyAlternatives = generatedQuestion.alternativas.some((a: any) => !a.texto || a.texto.trim().length === 0);
    if (emptyAlternatives) {
      toast.error("Todas as alternativas devem ter um texto preenchido.");
      return;
    }

    if (!generatedQuestion.respostaCorreta) {
      toast.error("A resposta correta deve ser definida.");
      return;
    }

    const validCorrectAnswer = generatedQuestion.alternativas.some((a: any) => a.id === generatedQuestion.respostaCorreta);
    if (!validCorrectAnswer) {
      toast.error("A resposta correta selecionada é inválida.");
      return;
    }

    try {
      await addDoc(collection(db, 'questions'), {
        ...generatedQuestion,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success("Questão salva no banco de questões!");
      setGeneratedQuestion(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'questions');
      toast.error("Erro ao salvar questão.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Gerador de Itens SAEP</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Crie questões inéditas de múltipla escolha seguindo a Matriz de Referência SAEP.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Competência / Habilidade Alvo</label>
              <button 
                onClick={handleFillExample} 
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md transition-colors"
              >
                Preencher Exemplo
              </button>
            </div>
            <input 
              type="text"
              value={competency}
              onChange={(e) => setCompetency(e.target.value)}
              placeholder="Ex: Instalações Elétricas Prediais ou Desenvolvimento Web"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nível de Dificuldade</label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            >
              <option value="fácil">Fácil</option>
              <option value="médio">Médio</option>
              <option value="difícil">Difícil</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Modelo de Inteligência Artificial</label>
            <select 
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            >
              <option value="gemini-3-flash-preview">Gemini 3 Flash (Rápido)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Avançado)</option>
              <option value="gemini-flash-latest">Gemini Flash Latest</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
          {isGenerating ? "Gerando Questão..." : "Gerar Questão Inédita"}
        </button>
      </div>

      <AnimatePresence>
        {generatedQuestion && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {generatedQuestion.dificuldade}
                </span>
                <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Bloom: {generatedQuestion.bloom}
                </span>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {generatedQuestion.temaNome}
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
                <textarea 
                  value={generatedQuestion.enunciado}
                  onChange={(e) => setGeneratedQuestion({ ...generatedQuestion, enunciado: e.target.value })}
                  className="w-full bg-transparent text-lg font-bold text-gray-900 dark:text-white leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-lg p-2 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {generatedQuestion.alternativas.map((opt: { id: string, texto: string }, idx: number) => (
                  <div 
                    key={opt.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all text-sm flex items-start gap-3",
                      opt.id === generatedQuestion.respostaCorreta 
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-medium" 
                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <input 
                      type="radio"
                      name="correct-answer-gen"
                      checked={opt.id === generatedQuestion.respostaCorreta}
                      onChange={() => setGeneratedQuestion({ ...generatedQuestion, respostaCorreta: opt.id })}
                      className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1 flex items-start gap-2">
                      <span className="font-bold mt-0.5">{opt.id})</span>
                      <textarea 
                        value={opt.texto}
                        onChange={(e) => {
                          const newAlts = [...generatedQuestion.alternativas];
                          newAlts[idx] = { ...newAlts[idx], texto: e.target.value };
                          setGeneratedQuestion({ ...generatedQuestion, alternativas: newAlts });
                        }}
                        className="w-full bg-transparent outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-lg p-1 resize-none"
                        rows={1}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Info size={18} />
                <p className="text-xs font-bold uppercase tracking-wider">Comentário do Gabarito (Justificativa)</p>
              </div>
              <textarea 
                value={generatedQuestion.comentarioGabarito}
                onChange={(e) => setGeneratedQuestion({ ...generatedQuestion, comentarioGabarito: e.target.value })}
                className="w-full bg-transparent text-sm text-blue-800 dark:text-blue-300 leading-relaxed italic outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2 resize-none"
                rows={2}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={saveToBank}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Database size={20} />
                Salvar no Banco de Questões
              </button>
              <button 
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const { exportQuestionsToGoogleForms } = await import('../../services/googleFormsService');
                    const result = await exportQuestionsToGoogleForms(
                      `Questão Inédita: ${generatedQuestion.temaNome}`,
                      [generatedQuestion]
                    );
                    if (result.publicUrl) {
                      window.open(result.publicUrl, '_blank');
                      toast.success("Formulário criado com sucesso!");
                    }
                  } catch (e) {
                    toast.error("Erro ao exportar questão.");
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
                className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap size={20} />
                Exportar para Form
              </button>
              <button 
                onClick={() => setGeneratedQuestion(null)}
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Descartar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
