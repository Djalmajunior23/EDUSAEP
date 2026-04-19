import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Question, QuestionAsset } from '../../types';
import { Code, Image as ImageIcon, Table as TableIcon, FileText, LayoutIcon, ZoomIn, CheckCircle2, Sparkles, XCircle, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuestionRendererProps {
  question: Question;
  showCorrectAnswer?: boolean;
  onSelect?: (answer: string) => void;
  selectedAnswer?: string;
  className?: string;
}

export function QuestionRenderer({ 
  question, 
  showCorrectAnswer = false, 
  onSelect, 
  selectedAnswer,
  className 
}: QuestionRendererProps) {
  
  const renderAsset = (asset: QuestionAsset) => {
    switch (asset.type) {
      case 'code':
        return (
          <div key={asset.id} className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm text-left">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                <Code size={14} />
                <span>{asset.title || asset.language?.toUpperCase() || 'CÓDIGO'}</span>
              </div>
            </div>
            <SyntaxHighlighter 
              language={asset.language || 'javascript'} 
              style={vscDarkPlus}
              customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px' }}
              showLineNumbers
            >
              {asset.content}
            </SyntaxHighlighter>
            {asset.caption && (
              <p className="p-3 bg-gray-50 dark:bg-gray-800/50 text-[11px] text-gray-500 italic border-t border-gray-200 dark:border-gray-700">
                {asset.caption}
              </p>
            )}
          </div>
        );
        
      case 'image':
        return (
          <div key={asset.id} className="my-4 space-y-2">
            <div className="relative group rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-center">
              <img 
                src={asset.content} 
                alt={asset.caption || 'Recurso Visual'} 
                className="max-h-[400px] object-contain transition-transform group-hover:scale-[1.01]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full shadow-lg text-gray-700">
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>
            {asset.caption && (
              <p className="text-center text-xs text-gray-500 italic">
                {asset.caption}
              </p>
            )}
          </div>
        );
        
      case 'table':
        try {
          const tableData = JSON.parse(asset.content);
          return (
            <div key={asset.id} className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    {tableData.headers?.map((header: string, i: number) => (
                      <th key={i} className="px-4 py-3 font-bold border-b border-gray-200 dark:border-gray-700">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {tableData.rows?.map((row: any[], i: number) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      {row.map((cell: any, j: number) => (
                        <td key={j} className="px-4 py-3 text-gray-700 dark:text-gray-300 border-r last:border-0 border-gray-100 dark:border-gray-800">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {asset.caption && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-[11px] text-gray-500 italic border-t border-gray-200 dark:border-gray-700">
                  {asset.caption}
                </div>
              )}
            </div>
          );
        } catch (e) {
          return <div key={asset.id} className="p-4 bg-red-50 text-red-500 text-xs">Erro ao renderizar tabela.</div>;
        }

      case 'case_study':
        return (
          <div key={asset.id} className="my-6 p-6 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 rounded-r-2xl shadow-sm border-0">
            <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500 font-bold uppercase tracking-wider text-xs border-0">
              <FileText size={16} />
              <span>Estudo de Caso / Cenário</span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed italic border-0">
              {asset.content}
            </div>
          </div>
        );

      case 'diagram':
        return (
          <div key={asset.id} className="my-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex flex-col items-center">
            <div className="w-full flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase text-left">
              <LayoutIcon size={16} />
              <span>{asset.title || 'Diagrama Técnico'}</span>
            </div>
            {asset.content.startsWith('http') ? (
              <img src={asset.content} alt={asset.title} className="max-h-[300px] object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="p-10 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl text-center text-indigo-400 text-xs">
                Representação Gráfica: {asset.title}
                <br/>
                <span className="text-[10px] mt-2 block">[{asset.content.substring(0, 50)}...]</span>
              </div>
            )}
            {asset.caption && <p className="mt-2 text-[10px] text-indigo-500">{asset.caption}</p>}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-6 text-left", className)}>
      {/* Question Header & Stem */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
            {question.tipoQuestao?.replace('_', ' ') || 'Multipla Escolha'}
          </span>
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
            question.dificuldade === 'fácil' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
            question.dificuldade === 'médio' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
            "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          )}>
            {question.dificuldade}
          </span>
        </div>
        
        <div className="prose prose-slate dark:prose-invert max-w-none text-left">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({...props}) => <h1 className="text-2xl font-black mb-4 text-gray-900 dark:text-white text-left" {...props} />,
              h2: ({...props}) => <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white text-left" {...props} />,
              h3: ({...props}) => <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white text-left" {...props} />,
              p: ({...props}) => <p className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed mb-4 text-left" {...props} />,
              table: ({...props}) => (
                <div className="my-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <table className="w-full text-sm text-left border-collapse" {...props} />
                </div>
              ),
              thead: ({...props}) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
              th: ({...props}) => <th className="px-4 py-3 font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest border-b border-gray-200 dark:border-gray-700 text-[10px] text-left" {...props} />,
              td: ({...props}) => <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-left" {...props} />,
              tr: ({...props}) => <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors" {...props} />,
              ul: ({...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 text-left" {...props} />,
              ol: ({...props}) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-left" {...props} />,
              li: ({...props}) => <li className="text-gray-700 dark:text-gray-300 text-left" {...props} />,
            }}
          >
            {question.enunciado}
          </ReactMarkdown>
        </div>
      </div>

      {/* Assets Content */}
      <div className="space-y-4">
        {question.assets?.map(renderAsset)}
      </div>

      {/* Answer Area */}
      {question.tipoQuestao === 'discursiva' ? (
        <div className="space-y-4">
          <textarea
            value={selectedAnswer || ''}
            onChange={(e) => onSelect?.(e.target.value)}
            disabled={showCorrectAnswer}
            placeholder="Digite sua resposta analítica aqui..."
            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl min-h-[150px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
          />
          {showCorrectAnswer && question.respostaEsperada && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl space-y-2"
            >
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Resposta Esperada / Padrão de Resposta:</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium text-left">
                {question.respostaEsperada}
              </p>
              {question.rubricaAvaliacao && (
                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-700/50">
                   <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase text-left">Critérios de Rubrica: {question.rubricaAvaliacao}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {question.alternativas?.map((alt) => {
            const isCorrect = alt.id === question.respostaCorreta;
            const isSelected = selectedAnswer === alt.id;
            
            return (
              <button
                key={alt.id}
                disabled={showCorrectAnswer}
                onClick={() => onSelect?.(alt.id)}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all flex items-start gap-4",
                  isSelected 
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg scale-[1.01]" 
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 shadow-sm",
                  showCorrectAnswer && isCorrect && !isSelected && "border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/30 ring-2 ring-emerald-400",
                  showCorrectAnswer && isSelected && !isCorrect && "bg-red-500 border-red-500 text-white"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                  isSelected ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                )}>
                  {alt.id}
                </div>
                <div className="pt-1 flex-1 leading-relaxed text-left">
                  {alt.texto}
                  {showCorrectAnswer && isCorrect && (
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} /> Gabarito Correto
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Explanation / Feedback */}
      {showCorrectAnswer && question.comentarioGabarito && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-3xl"
        >
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-1 text-left">Nota Pedagógica:</p>
              <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed italic text-left">
                {question.comentarioGabarito}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {showCorrectAnswer && question.aiExplicabilidade && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-3xl space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-3 text-purple-700 dark:text-purple-400">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Brain size={18} />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-left">Explicabilidade da IA (XAI)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-purple-600 dark:text-purple-500 uppercase tracking-wider text-left">Dificuldade:</p>
              <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed text-left">{question.aiExplicabilidade.justificativaDificuldade}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-purple-600 dark:text-purple-500 uppercase tracking-wider text-left">Bloom:</p>
              <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed text-left">{question.aiExplicabilidade.justificativaBloom}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-purple-600 dark:text-purple-500 uppercase tracking-wider text-left">Distratores:</p>
              <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed text-left">{question.aiExplicabilidade.analiseDistratores}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-purple-600 dark:text-purple-500 uppercase tracking-wider text-left">Intenção:</p>
              <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed text-left">{question.aiExplicabilidade.intencaoPedagogica}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
