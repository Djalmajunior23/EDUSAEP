import React, { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Zap, 
  Code, 
  Image as ImageIcon, 
  Table as TableIcon, 
  Layout as LayoutIcon,
  Plus,
  ArrowRight,
  BrainCircuit,
  FileText,
  Target,
  Settings2,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { generateAdvancedQuestion, AdvancedQuestionParams } from '../../services/geminiService';
import { Question } from '../../types';
import { QuestionRenderer } from '../common/QuestionRenderer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdvancedQuestionGeneratorProps {
  onQuestionsGenerated: (questions: Question[]) => void;
  onClose: () => void;
  competencies: any[];
  currentDiscipline?: string;
}

export function AdvancedQuestionGenerator({ onQuestionsGenerated, onClose, competencies, currentDiscipline }: AdvancedQuestionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [params, setParams] = useState<AdvancedQuestionParams>({
    topic: '',
    discipline: currentDiscipline || '',
    competency: '',
    level: 'médio',
    bloom: 'aplicar',
    type: 'multipla_escolha',
    includeCode: false,
    resourceTypes: [],
    includeCaseStudy: false,
    language: 'javascript',
    marketContext: true,
    count: 1
  });
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const handleGenerate = async () => {
    if (!params.topic || !params.competency) {
      toast.error("Por favor, preencha o tema e a competência.");
      return;
    }

    setIsGenerating(true);
    try {
      const genned = await generateAdvancedQuestion(params);
      
      const enrichedQuestions: Question[] = genned.map((q: any) => ({
        ...q,
        competenciaId: competencies.find(c => c.nome === params.competency)?.id || 'unknown',
        competenciaNome: params.competency,
        temaNome: params.topic,
        temaId: 'gen-ai',
        perfilGeracao: 'avançada',
        isAiGenerated: true,
        status: 'rascunho',
        revisadaPorProfessor: false,
        usoTotal: 0,
        origem: 'IA JuniorsStudent',
        createdAt: new Date()
      }));

      setPreviewQuestions(enrichedQuestions);
      setStep(3);
    } catch (error: any) {
      console.error("Erro ao gerar questões avançadas:", error);
      toast.error("Falha na geração: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onQuestionsGenerated(previewQuestions);
    toast.success(`${previewQuestions.length} questões adicionadas ao banco!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100 dark:border-emerald-900/30"
      >
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold dark:text-white">Gerador de Questões de Alta Complexidade</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Geração assistida por IA para questões estruturadas e ricas.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                      <Target className="text-emerald-600" size={20} />
                      Contexto Pedagógico
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tema Principal</label>
                        <input 
                          type="text"
                          value={params.topic}
                          onChange={(e) => setParams({...params, topic: e.target.value})}
                          placeholder="Ex: Segurança em Redes de Computadores"
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Competência Alvo</label>
                        <select 
                          value={params.competency}
                          onChange={(e) => setParams({...params, competency: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                        >
                          <option value="">Selecione uma competência...</option>
                          {competencies.map(c => (
                            <option key={c.id} value={c.nome}>{c.nome}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dificuldade</label>
                          <select 
                            value={params.level}
                            onChange={(e) => setParams({...params, level: e.target.value as any})}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                          >
                            <option value="fácil">Fácil</option>
                            <option value="médio">Médio</option>
                            <option value="difícil">Difícil</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bloom</label>
                          <select 
                            value={params.bloom}
                            onChange={(e) => setParams({...params, bloom: e.target.value as any})}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                          >
                            <option value="lembrar">Lembrar</option>
                            <option value="compreender">Compreender</option>
                            <option value="aplicar">Aplicar</option>
                            <option value="analisar">Analisar</option>
                            <option value="avaliar">Avaliar</option>
                            <option value="criar">Criar</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contexto de Mercado (Opcional)</label>
                        <input 
                          type="text"
                          value={params.marketContextDescription || ''}
                          onChange={(e) => setParams({...params, marketContextDescription: e.target.value})}
                          placeholder="Ex: Problema específico de cibersegurança em fintechs..."
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detalhes do Estudo de Caso (Opcional)</label>
                        <input 
                          type="text"
                          value={params.caseStudyDescription || ''}
                          onChange={(e) => setParams({...params, caseStudyDescription: e.target.value})}
                          placeholder="Ex: Análise das vulnerabilidades detectadas..."
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                        />
                      </div>

                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                      <Settings2 className="text-emerald-600" size={20} />
                      Configuração da Questão
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo de Questão</label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: 'multipla_escolha', label: 'Múltipla Escolha', icon: CheckCircle2 },
                            { id: 'discursiva', label: 'Discursiva Analítica', icon: FileText },
                            { id: 'estudo_caso', label: 'Estudo de Caso', icon: Archive },
                            { id: 'analitica', label: 'Resolução de Problemas', icon: Target },
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setParams({...params, type: t.id as any})}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-medium",
                                params.type === t.id 
                                  ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/20" 
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <t.icon size={18} />
                                {t.label}
                              </div>
                              {params.type === t.id && <Check className="text-emerald-500" size={16} />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contextualização Profissional</span>
                        <button 
                          onClick={() => setParams({...params, marketContext: !params.marketContext})}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            params.marketContext ? "bg-emerald-500" : "bg-gray-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            params.marketContext ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Incluir Estudo de Caso</span>
                        <button 
                          onClick={() => setParams({...params, includeCaseStudy: !params.includeCaseStudy})}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            params.includeCaseStudy ? "bg-emerald-500" : "bg-gray-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            params.includeCaseStudy ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                  >
                    Próximo Passo
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center max-w-2xl mx-auto space-y-4">
                  <h3 className="text-2xl font-bold dark:text-white">Recursos e Materiais de Apoio</h3>
                  <p className="text-gray-500">Selecione quais elementos a IA deve injetar na questão para torná-la rica e contextualizada.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'image', label: 'Imagem', icon: ImageIcon, color: 'text-purple-500' },
                    { id: 'diagram', label: 'Diagrama', icon: LayoutIcon, color: 'text-indigo-500' },
                    { id: 'table', label: 'Tabela', icon: TableIcon, color: 'text-pink-500' },
                    { id: 'code', label: 'Código', icon: Code, color: 'text-blue-500' },
                    { id: 'case_study', label: 'Estudo de Caso', icon: Archive, color: 'text-amber-500' },
                  ].map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => {
                        const currentTypes = params.resourceTypes || [];
                        const newTypes = currentTypes.includes(resource.id as any)
                          ? currentTypes.filter(t => t !== resource.id)
                          : [...currentTypes, resource.id as any];
                        setParams({...params, resourceTypes: newTypes});
                      }}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 text-center",
                        params.resourceTypes?.includes(resource.id as any)
                          ? "bg-emerald-50 border-emerald-500 shadow-inner"
                          : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-200"
                      )}
                    >
                      <div className={cn(
                        "p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-sm",
                        resource.color
                      )}>
                        <resource.icon size={32} />
                      </div>
                      <div>
                        <span className="block font-bold dark:text-white">{resource.label}</span>
                      </div>
                      {params.resourceTypes?.includes(resource.id as any) && (
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                          <Check size={14} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {(params.resourceTypes?.includes('image') || params.resourceTypes?.includes('diagram') || params.resourceTypes?.includes('table')) && (
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detalhes do recurso visual (Opcional)</label>
                    <input 
                      type="text"
                      value={params.resourceDescription || ''}
                      onChange={(e) => setParams({...params, resourceDescription: e.target.value})}
                      placeholder="Ex: Diagrama mostrando a arquitetura de uma rede em nuvem..."
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                )}
                
                {params.resourceTypes?.includes('code') && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <Code className="text-blue-500" size={20} />
                      <h4 className="font-bold dark:text-white">Opções de Código</h4>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {['JavaScript', 'SQL', 'C++', 'Java', 'Python', 'Ladder (CLP)', 'Arduino'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => setParams({...params, language: lang})}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                            params.language === lang ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="pt-8 border-t dark:border-gray-800 flex justify-between">
                  <button onClick={() => setStep(1)} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">Voltar</button>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                    {isGenerating ? "Injetando Inteligência..." : "GERAR QUESTÃO RICA"}
                  </button>
                </div>
              </motion.div>
            )}


            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={24} />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white">Resultado da Geração</h3>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setStep(1)}
                      className="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Tentar Novamente
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-none transition-all"
                    >
                      Salvar no Banco
                    </button>
                  </div>
                </div>

                <div className="space-y-8 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                  {previewQuestions.map((q, idx) => (
                    <QuestionRenderer 
                      key={idx} 
                      question={q} 
                      showCorrectAnswer={true} 
                      className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

import { CheckCircle2, Check, Archive } from 'lucide-react';
