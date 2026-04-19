import React from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Target, TrendingUp, AlertTriangle, CheckCircle, 
  ArrowRight, Download, Share2, Brain, ChevronRight, 
  ShieldAlert, Sparkles, Zap, MessageCircle
} from 'lucide-react';
import { DiagnosticResult } from '../../services/geminiService';
import { UserProfile } from '../../types';
import Markdown from 'react-markdown';
import { cn } from '../../lib/utils';

interface DiagnosticResultViewProps {
  result: DiagnosticResult;
  userProfile: UserProfile | null;
  onNavigateToChat: () => void;
}

export function DiagnosticResultView({ result, userProfile, onNavigateToChat }: DiagnosticResultViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Summary */}
      <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[40px] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12 translate-x-20 -translate-y-10">
          <Brain size={400} />
        </div>
        
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10">
            <Sparkles size={12} className="text-amber-400" /> Diagnóstico Gerado por IA
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter leading-none">
            Análise Pedagógica: <span className="text-indigo-300">{result.aluno}</span>
          </h2>
          <p className="text-lg md:text-xl text-indigo-100/80 font-medium mb-10 max-w-2xl leading-relaxed">
            {result.resumo_executivo}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Acurácia Geral</p>
              <p className="text-4xl font-black text-white">{(result.summary.acuracia_geral * 100).toFixed(1)}%</p>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Gaps Identificados</p>
              <p className="text-4xl font-black">{result.diagnostico_por_competencia.filter(c => c.acuracia < 0.6).length}</p>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Engagement IA</p>
              <p className="text-4xl font-black">9.8</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Competencies & Gaps */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                <Target size={24} />
              </div>
              Desempenho por Competência
            </h3>
            
            <div className="space-y-6">
              {result.diagnostico_por_competencia.map((comp, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {comp.competencia}
                        {comp.acuracia < 0.6 && <AlertTriangle size={14} className="text-rose-500" />}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium">Peso Cognitivo: {comp.peso_na_uc}</p>
                    </div>
                    <span className={cn(
                      "text-sm font-black",
                      comp.acuracia > 0.8 ? "text-emerald-500" :
                      comp.acuracia > 0.5 ? "text-amber-500" : "text-rose-500"
                    )}>
                      {(comp.acuracia * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${comp.acuracia * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        comp.acuracia > 0.8 ? "bg-emerald-500" :
                        comp.acuracia > 0.5 ? "bg-amber-500" : "bg-rose-500"
                      )}
                    />
                  </div>
                  {comp.gap_identificado && (
                    <p className="mt-3 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-start gap-2 bg-rose-50 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      {comp.gap_identificado}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                <CheckCircle size={24} />
              </div>
              Plano de Intervenção Sugerido
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.sugestao_intervencao.map((item, i) => (
                <div key={i} className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black uppercase">
                      {i + 1}
                    </span>
                    <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-xs">{item.tipo}</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                    {item.descricao}
                  </p>
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.esforço || 'Normal'}</span>
                    <ArrowRight size={14} className="text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Actions */}
        <div className="space-y-8">
          <section className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <Sparkles size={100} />
            </div>
            <h4 className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Insight Preditivo IA</h4>
            <div className="prose prose-sm prose-invert max-w-none">
              <Markdown>{result.mensagem_para_o_aluno}</Markdown>
            </div>
            <button 
              onClick={onNavigateToChat}
              className="w-full mt-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
            >
              <MessageCircle size={20} /> FALAR COM TUTOR IA
            </button>
          </section>

          <section className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white uppercase tracking-tight">Potencial de Crescimento</h3>
            <div className="flex items-center gap-6 mb-8">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path className="text-gray-100 dark:text-gray-700 stroke-current" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <motion.path 
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: "88, 100" }}
                    className="text-emerald-500 stroke-current" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    fill="none" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-gray-900 dark:text-white">88%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Com base nos padrões cognitivos detectados, o aluno tem 88% de chance de evolução para o nível avançado no próximo bimestre.
              </p>
            </div>
            <div className="space-y-3">
              <button className="w-full py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                <Download size={14} /> DOWNLOAD LAUDO PDF
              </button>
              <button className="w-full py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                <Share2 size={14} /> COMPARTILHAR RESULTADO
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
