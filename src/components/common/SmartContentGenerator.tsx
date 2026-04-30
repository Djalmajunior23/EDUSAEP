import React, { useState } from 'react';
import { Sparkles, Loader2, Zap, BookOpen, FileText, LayoutDashboard, Target, CheckCircle2, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import { generateAIContent } from '../../services/aiService';

interface SmartContentInput {
  prompt: string;
  tipo: 'explicacao' | 'questoes' | 'plano_estudo' | 'simulado' | 'estudo_caso' | 'aula_invertida' | 'analise_desempenho';
  perfil: 'TEACHER' | 'STUDENT';
  disciplina: string;
  competencias: string[];
  nivel: 'facil' | 'medio' | 'dificil';
  dados_desempenho?: any;
  historico?: { simulados_realizados: number; media_geral: number };
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SmartContentGeneratorProps {
  userProfile: any;
  selectedModel: string;
}

export function SmartContentGenerator({ userProfile, selectedModel }: SmartContentGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [tipo, setTipo] = useState<SmartContentInput['tipo']>('explicacao');
  const [disciplina, setDisciplina] = useState('');
  const [competencias, setCompetencias] = useState('');
  const [nivel, setNivel] = useState<SmartContentInput['nivel']>('medio');
  const [dadosDesempenho, setDadosDesempenho] = useState<string>('');
  const [historico, setHistorico] = useState<{ simulados_realizados: number; media_geral: number }>({ simulados_realizados: 0, media_geral: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Descreva o que você deseja gerar.");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    const input: SmartContentInput = {
      prompt,
      tipo,
      perfil: (userProfile?.role === 'TEACHER' || userProfile?.role === 'ADMIN' || userProfile?.role === 'COORDINATOR') ? 'TEACHER' : 'STUDENT',
      disciplina,
      competencias: competencias.split(',').map(c => c.trim()).filter(c => c !== ''),
      nivel,
      dados_desempenho: dadosDesempenho ? JSON.parse(dadosDesempenho) : undefined,
      historico: historico.simulados_realizados > 0 ? historico : undefined
    };

    try {
      const response = await generateAIContent({
        prompt: JSON.stringify(input),
        task: 'smart_content_gen',
        responseFormat: tipo === 'questoes' ? 'json' : 'text',
        tier: 'fast',
        systemInstruction: `Você é um Gerador de Conteúdo Educacional Inteligente. 
        Gere o conteúdo no formato solicitado (${tipo}) focado em ${disciplina || 'conhecimentos gerais'}.
        Nível: ${nivel}. Perfil do Receptor: ${input.perfil}.`
      });
      
      let finalResult = response.text;
      if (tipo === 'questoes') {
        try {
          finalResult = JSON.parse(response.text);
        } catch (e) {
          console.warn("Retornando texto puro pois falhou o parse JSON das questões", e);
        }
      }
      
      setResult(finalResult);
      toast.success("Conteúdo gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo inteligente:", error);
      toast.error(`Erro: ${error.message || "Falha na geração"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
            <Sparkles size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Gerador Inteligente JuniorsStudent</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Crie conteúdos personalizados seguindo o padrão SAEP (SENAI).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">O que você deseja gerar?</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Explique o funcionamento de um motor de indução trifásico com foco em manutenção preventiva..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[120px] dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo de Conteúdo</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'explicacao', label: 'Explicação', icon: BookOpen },
                { id: 'questoes', label: 'Questões', icon: CheckCircle2 },
                { id: 'plano_estudo', label: 'Plano de Estudo', icon: LayoutDashboard },
                { id: 'simulado', label: 'Simulado', icon: Target },
                { id: 'estudo_caso', label: 'Estudo de Caso', icon: FileText },
                { id: 'aula_invertida', label: 'Aula Invertida', icon: BrainCircuit },
                { id: 'analise_desempenho', label: 'Análise BI', icon: FileText },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTipo(item.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                    tipo === item.id 
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md" 
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nível de Dificuldade</label>
            <select 
              value={nivel}
              onChange={(e) => setNivel(e.target.value as any)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            >
              <option value="facil">Fácil (Iniciante)</option>
              <option value="medio">Médio (Intermediário)</option>
              <option value="dificil">Difícil (Avançado)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disciplina</label>
            <input 
              type="text"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              placeholder="Ex: Eletrotécnica"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Competências (separadas por vírgula)</label>
            <input 
              type="text"
              value={competencias}
              onChange={(e) => setCompetencias(e.target.value)}
              placeholder="Ex: Manutenção, Segurança, Motores"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dados de Desempenho (JSON opcional)</label>
            <textarea 
              value={dadosDesempenho}
              onChange={(e) => setDadosDesempenho(e.target.value)}
              placeholder='[{"competencia": "Banco de Dados", "acertos": 6, "erros": 4}]'
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px] font-mono text-xs dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Simulados Realizados</label>
            <input 
              type="number"
              value={historico.simulados_realizados}
              onChange={(e) => setHistorico({ ...historico, simulados_realizados: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Média Geral</label>
            <input 
              type="number"
              step="0.1"
              value={historico.media_geral}
              onChange={(e) => setHistorico({ ...historico, media_geral: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
          {isGenerating ? "Processando Inteligência..." : "Gerar Conteúdo Personalizado"}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 space-y-6"
          >
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-4">
              <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <FileText className="text-emerald-600" />
                Resultado da Geração
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {tipo}
                </span>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {nivel}
                </span>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              {typeof result === 'string' ? (
                <Markdown>{result}</Markdown>
              ) : Array.isArray(result) ? (
                <div className="space-y-6">
                  {result.map((q: any, idx: number) => (
                    <div key={idx} className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                      <p className="font-bold text-gray-900 dark:text-white">{idx + 1}. {q.enunciado}</p>
                      <div className="grid grid-cols-1 gap-2">
                        {q.alternativas?.map((alt: any) => (
                          <div 
                            key={alt.id} 
                            className={cn(
                              "p-3 rounded-xl border text-sm",
                              alt.id === q.respostaCorreta 
                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-medium" 
                                : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                            )}
                          >
                            <span className="font-bold mr-2">{alt.id})</span> {alt.texto}
                          </div>
                        ))}
                      </div>
                      {q.comentarioGabarito && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-400 italic">
                          <strong>Gabarito Comentado:</strong> {q.comentarioGabarito}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-xl overflow-auto dark:text-gray-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
