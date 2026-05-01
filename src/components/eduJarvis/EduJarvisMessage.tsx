import React from 'react';
import { EduJarvisMessageType } from '../../types/eduJarvisTypes';
import Markdown from 'react-markdown';
import { Bot, User, Calendar, BookOpen, Repeat, ClipboardCheck, ArrowRight, Clock } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  message: EduJarvisMessageType;
}

export function EduJarvisMessage({ message }: Props) {
  const isAssistant = message.role === 'assistant';
  const data = message.payload;

  return (
    <div className={clsx("flex gap-3 mb-6", isAssistant ? "flex-row" : "flex-row-reverse")}>
      <div 
        className={clsx(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md",
          isAssistant ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white" : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
        )}
      >
        {isAssistant ? <Bot size={20} /> : <User size={20} />}
      </div>
      
      <div 
        className={clsx(
          "max-w-[85%] rounded-2xl p-4 text-sm shadow-sm border",
          isAssistant 
            ? "bg-white border-gray-100 text-gray-800 rounded-tl-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" 
            : "bg-emerald-50 text-emerald-900 border-emerald-100 rounded-tr-sm dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-50"
        )}
      >
        {isAssistant ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.type === 'vision_analysis' && (
              <div className="mb-4 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Bot size={14} />
                <span className="text-[10px] font-bold uppercase">Análise de Visão Ativa</span>
              </div>
            )}
            <Markdown>{message.content}</Markdown>

            {/* Renderização Especial: ESTRUTURA_AULA */}
            {data?.topicos_principais && (
              <div className="mt-4 not-prose border border-indigo-100 dark:border-indigo-900 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-black/20">
                <div className="bg-indigo-600 p-3 text-white flex items-center gap-2">
                  <BookOpen size={18} />
                  <span className="font-bold text-xs uppercase tracking-wider">Estrutura de Aula</span>
                </div>
                <div className="p-4">
                  <h4 className="font-black text-indigo-900 dark:text-indigo-100 text-sm mb-3 leading-tight">{data.titulo}</h4>
                  
                  <div className="space-y-3 mb-4">
                    {data.topicos_principais.map((topic: any, i: number) => (
                      <div key={i} className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg border-l-4 border-indigo-400">
                        <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{topic.titulo}</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 m-0">{topic.descricao}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-dashed border-amber-200">
                    <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Engajamento & IA</p>
                    <p className="text-[10px] m-0 text-amber-900 dark:text-amber-100 underline decoration-amber-300 decoration-2 underline-offset-2 italic">"{data.dinamica_engajamento}"</p>
                    <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 mt-2">🔨 Apoio: {data.ferramenta_apoio}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Renderização Especial: ATIVIDADE_PRATICA */}
            {data?.titulo_pratica && (
              <div className="mt-4 not-prose border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-900/40">
                <div className="bg-gray-800 p-3 text-white flex items-center gap-2">
                  <Bot size={18} />
                  <span className="font-bold text-xs uppercase tracking-wider">Roteiro de Atividade Prática</span>
                </div>
                <div className="p-5">
                   <h4 className="font-black text-gray-900 dark:text-white text-base mb-4 leading-tight">{data.titulo_pratica}</h4>
                   
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900">
                        <p className="text-[10px] font-black text-red-600 uppercase mb-2">Protocolo de Segurança</p>
                        <div className="space-y-1">
                          {data.segurança?.epis?.map((s: string, i: number) => (
                            <span key={i} className="text-[9px] inline-block bg-white dark:bg-red-900/40 px-2 py-0.5 rounded mr-1 mb-1 border border-red-200 dark:border-red-800">{s}</span>
                          ))}
                        </div>
                     </div>
                     <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Insumos</p>
                        <ul className="m-0 p-0 list-none space-y-1">
                          {data.materiais_necessarios?.map((m: string, i: number) => (
                            <li key={i} className="text-[10px] flex items-center gap-1 opacity-70"><ArrowRight size={8}/> {m}</li>
                          ))}
                        </ul>
                     </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Execução Passo-a-Passo</p>
                      {data.passos?.map((p: any, i: number) => (
                        <div key={i} className="flex gap-3 group">
                          <span className="text-[10px] font-black text-gray-300 group-hover:text-gray-900 transition-colors pt-0.5">{p.ordem || i+1}.</span>
                          <p className="text-xs text-gray-700 dark:text-gray-300 m-0 border-b border-gray-50 dark:border-gray-800 pb-2 w-full leading-relaxed">{p.descricao}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {/* Renderização Especial: PLANO_AULA */}
            {data?.cronograma && (
              <div className="mt-4 not-prose border border-blue-100 dark:border-blue-900 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-blue-600 p-3 text-white flex items-center gap-2">
                  <Calendar size={18} />
                  <span className="font-bold text-xs uppercase tracking-wider">Plano de Aula Ultra</span>
                </div>
                <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10">
                  <h4 className="font-black text-blue-900 dark:text-blue-100 text-sm mb-4 leading-tight">{data.titulo}</h4>
                  
                  <div className="space-y-4">
                    <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-2">Cronograma de Aula</p>
                      <div className="space-y-3">
                        {data.cronograma.map((item: any, i: number) => (
                          <div key={i} className="flex gap-3 border-l-2 border-blue-400 pl-3 py-1">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-600">{item.tempo}</span>
                              <p className="font-bold text-xs text-blue-900 dark:text-blue-100 m-0">{item.atividade}</p>
                              <p className="text-[10px] opacity-80 m-0 italic">Ref: {item.acao_professor}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                         <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Materiais</p>
                         <ul className="list-none p-0 m-0 space-y-1">
                           {(data.recursos?.materiais_fisicos || data.recursos?.materiais)?.map((r: string, i: number) => (
                             <li key={i} className="text-[10px] flex items-center gap-1"><ArrowRight size={8}/> {r}</li>
                           ))}
                         </ul>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                         <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Digitais</p>
                         <ul className="list-none p-0 m-0 space-y-1">
                           {(data.recursos?.ferramentas_digitais || data.recursos?.digitais)?.map((r: string, i: number) => (
                             <li key={i} className="text-[10px] flex items-center gap-1 text-blue-600"><Bot size={8}/> {r}</li>
                           ))}
                         </ul>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                         <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Softwares</p>
                         <ul className="list-none p-0 m-0 space-y-1">
                           {data.recursos?.softwares?.map((r: string, i: number) => (
                             <li key={i} className="text-[10px] flex items-center gap-1 text-indigo-600"><Clock size={8}/> {r}</li>
                           ))}
                         </ul>
                      </div>
                    </div>

                    <div className="bg-indigo-600/5 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900">
                      <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-2">Estratégia de Avaliação</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-[8px] font-black uppercase text-indigo-400 m-0">Diagnóstica</p>
                          <p className="text-[9px] font-medium leading-tight m-0">{data.avaliacao?.diagnostica}</p>
                        </div>
                        <div className="text-center border-x border-indigo-100 px-1">
                          <p className="text-[8px] font-black uppercase text-indigo-400 m-0">Formativa</p>
                          <p className="text-[9px] font-medium leading-tight m-0">{data.avaliacao?.formativa}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black uppercase text-indigo-400 m-0">Somativa</p>
                          <p className="text-[9px] font-medium leading-tight m-0">{data.avaliacao?.somativa}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Renderização Especial: ESTUDO_CASO */}
            {(data?.contexto_real || data?.contexto_industrial) && (
              <div className="mt-4 not-prose border border-emerald-100 dark:border-emerald-900 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-emerald-950/20">
                <div className="bg-emerald-600 p-3 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} />
                    <span className="font-bold text-xs uppercase tracking-wider">Estudo de Caso PBL</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black italic">PROB-BASED LEARNING</span>
                </div>
                <div className="p-5">
                   <h4 className="font-black text-emerald-900 dark:text-emerald-100 text-base mb-3 leading-tight">{data.titulo || data.titulo_caso}</h4>
                   
                   <div className="space-y-4">
                     <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border-l-4 border-emerald-500">
                       <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Contexto do Problema</p>
                       <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic m-0">"{data.contexto_real || data.contexto_industrial}"</p>
                     </div>

                     <div className="p-3 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                       <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Desafio Principal</p>
                       <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 m-0">{data.problema_tecnico || data.problema_central}</p>
                     </div>

                     {data.dados_e_kpis && (
                       <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                         <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Indicadores (KPIs)</p>
                         <pre className="text-[10px] font-mono leading-none m-0 overflow-auto">
                           {JSON.stringify(data.dados_e_kpis, null, 2)}
                         </pre>
                       </div>
                     )}

                     <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-[10px] font-black text-gray-500 uppercase mb-3 flex items-center gap-1">
                          <ClipboardCheck size={12}/> Questões Norteadoras (Bloom)
                        </p>
                        <div className="space-y-3">
                          {data.perguntas_norteadoras?.map((p: string, i: number) => (
                            <div key={i} className="flex gap-2 text-xs font-medium text-gray-800 dark:text-gray-200">
                              <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black">{i+1}</span>
                              <p className="m-0 leading-snug">{p}</p>
                            </div>
                          ))}
                        </div>
                     </div>
                   </div>
                </div>
              </div>
            )}

            {/* Renderização Especial: AULA_INVERTIDA */}
            {data?.pre_aula && (
               <div className="mt-4 not-prose bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Repeat size={120} />
                 </div>
                 
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 bg-indigo-600 rounded-2xl text-white shadow-lg">
                        <Repeat size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-indigo-900 dark:text-white text-base leading-none m-0">Roteiro Flipped Classroom</h3>
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest m-0 mt-1">Estratégia de Aula Invertida</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <Clock size={16} />
                          <h4 className="text-xs font-black uppercase m-0 leading-none">Momento 1: Pré-Aula</h4>
                        </div>
                        <div className="space-y-3">
                          {data.pre_aula.curadoria?.map((item: any, i: number) => (
                            <div key={i} className="p-3 bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-indigo-100 hover:border-indigo-400 transition-colors cursor-pointer group">
                              <p className="text-[10px] font-black text-indigo-600 mb-1 flex justify-between">
                                {item.tipo} <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </p>
                              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-100 leading-tight m-0">{item.descricao}</p>
                            </div>
                          ))}
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-800">
                           <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Verificação de Descoberta</p>
                           <p className="text-[10px] italic text-amber-900 dark:text-amber-100 m-0">{data.pre_aula.atividade_verificacao}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <User size={16} />
                          <h4 className="text-xs font-black uppercase m-0 leading-none">Momento 2: Em Sala (Mão na Massa)</h4>
                        </div>
                        <div className="p-4 bg-white/70 dark:bg-black/40 border border-emerald-200 rounded-2xl">
                           <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Desafio PBL</p>
                           <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-100 leading-relaxed mb-3">{data.em_sala?.desafio_pbl}</p>
                           <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Dinâmica</p>
                           <p className="text-[10px] text-gray-700 dark:text-gray-300 italic">{data.em_sala?.dinâmica_grupo}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-indigo-200 flex justify-between items-center">
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter m-0">Consolidação de Conhecimento</p>
                       <p className="text-[11px] font-bold text-indigo-900 dark:text-white m-0 italic">{data.consolidacao}</p>
                    </div>
                 </div>
               </div>
            )}

            {/* Renderização Especial: AUDITORIA_QUALIDADE */}
            {Array.isArray(data?.vulnerabilities) && !data?.questoes && (
              <div className="mt-4 not-prose border border-rose-100 dark:border-rose-900 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-rose-950/20">
                <div className="bg-rose-600 p-3 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={18} />
                    <span className="font-bold text-xs uppercase tracking-wider">Auditoria de Qualidade</span>
                  </div>
                  <div className="px-2 py-0.5 bg-white text-rose-600 rounded text-xs font-black">
                    {data.score}/100
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.vulnerabilities.map((v: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/40 text-[9px] font-black text-rose-600 border border-rose-200 dark:border-rose-800 rounded uppercase">
                        {v.replace('_', ' ')}
                      </span>
                    ))}
                    {data.vulnerabilities.length === 0 && (
                      <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/40 text-[9px] font-black text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded uppercase">
                        SEM VULNERABILIDADES
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-lg mb-4 border border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Análise do Auditor</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 m-0">{data.analysis}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase">Sugestões de Melhoria</p>
                    {data.suggestions?.map((s: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start text-[11px] text-gray-800 dark:text-gray-200">
                        <ArrowRight size={10} className="mt-1 text-rose-500 shrink-0" />
                        <p className="m-0 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Renderização Especial: LISTA_QUESTOES_COM_AUDITORIA */}
            {Array.isArray(data?.questoes) && (
              <div className="mt-4 not-prose space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <ClipboardCheck size={16} className="text-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Questões Geradas & Auditadas</span>
                </div>
                {data.questoes.map((q: any, i: number) => (
                  <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
                    <div className={clsx(
                      "p-2 px-3 flex items-center justify-between",
                      q.audit_score >= 80 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" : "bg-amber-50 text-amber-700 dark:bg-amber-950/20"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">ITEM {i+1}</span>
                        <span className="text-[9px] font-bold uppercase">{q.nivelBloom}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black">QUALIDADE: {q.audit_score}/100</span>
                        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={clsx("h-full", q.audit_score >= 80 ? "bg-emerald-500" : "bg-amber-500")}
                            style={{ width: `${q.audit_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">{q.enunciado}</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {Object.entries(q.alternativas).map(([key, val]: [string, any]) => (
                          <div key={key} className={clsx(
                            "p-2 rounded-lg border text-[10px] flex gap-2",
                            key === q.respostaCorreta 
                              ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800" 
                              : "bg-gray-50 border-gray-100 text-gray-500 dark:bg-gray-800/50 dark:border-gray-700"
                          )}>
                            <span className="font-black uppercase">{key}.</span>
                            <span className="truncate">{val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-2 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-lg border border-dashed border-indigo-100 dark:border-indigo-800">
                        <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Análise do Auditor</p>
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 italic m-0 line-clamp-2">"{q.audit_analysis}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Renderização Especial: RUBRICA */}
            {Array.isArray(data?.criterios) && (
              <div className="mt-4 not-prose border border-amber-100 dark:border-amber-900 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-black/20">
                <div className="bg-amber-600 p-3 text-white flex items-center gap-2">
                  <ClipboardCheck size={18} />
                  <span className="font-bold text-xs uppercase tracking-wider">Rubrica de Avaliação</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-amber-50 dark:bg-amber-900/40">
                        <th className="p-3 border border-amber-100 dark:border-amber-800 font-black text-amber-800 dark:text-amber-200 uppercase tracking-tighter">Critério</th>
                        <th className="p-3 border border-amber-100 dark:border-amber-800 text-red-600 font-black text-center">INSUFICIENTE</th>
                        <th className="p-3 border border-amber-100 dark:border-amber-800 text-amber-600 font-black text-center">BÁSICO</th>
                        <th className="p-3 border border-amber-100 dark:border-amber-800 text-blue-600 font-black text-center">PLENO</th>
                        <th className="p-3 border border-amber-100 dark:border-amber-800 text-emerald-600 font-black text-center">AVANÇADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.criterios.map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                          <td className="p-3 border border-amber-100 dark:border-amber-800 font-bold bg-amber-50/30 dark:bg-amber-900/5">
                            {c.nome}
                            <div className="text-[8px] opacity-60 font-black mt-1">PESO: {c.peso}%</div>
                          </td>
                          <td className="p-3 border border-amber-100 dark:border-amber-800 text-[9px] leading-tight italic opacity-80">{c.niveis.insuficiente}</td>
                          <td className="p-3 border border-amber-100 dark:border-amber-800 text-[9px] leading-tight italic opacity-80">{c.niveis.basico}</td>
                          <td className="p-3 border border-amber-100 dark:border-amber-800 text-[9px] leading-tight italic opacity-80">{c.niveis.pleno}</td>
                          <td className="p-3 border border-amber-100 dark:border-amber-800 text-[9px] leading-tight italic opacity-80">{c.niveis.avancado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50 dark:border-gray-700/50">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            {isAssistant ? 'EduJarvis AI' : 'Você'}
          </span>
          <span className="text-[10px] text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
