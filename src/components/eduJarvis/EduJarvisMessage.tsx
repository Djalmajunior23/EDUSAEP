import React from 'react';
import { EduJarvisMessageType } from '../../types/eduJarvisTypes';
import Markdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  message: EduJarvisMessageType;
}

export function EduJarvisMessage({ message }: Props) {
  const isAssistant = message.role === 'assistant';

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
