import React, { useRef, useEffect } from 'react';
import { EduJarvisMessageType } from '../../types/eduJarvisTypes';
import { EduJarvisMessage } from './EduJarvisMessage';
import { Loader2 } from 'lucide-react';

interface Props {
  messages: EduJarvisMessageType[];
  isProcessing: boolean;
}

export function EduJarvisChat({ messages, isProcessing }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 dark:bg-gray-900 flex flex-col gap-2 relative">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full opacity-50 dark:opacity-40">
          <div className="bg-indigo-100 p-4 rounded-full mb-4 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
            <span className="text-4xl">👋</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium text-sm text-center">
            Olá! Sou o EduJarvis.<br />Como posso ajudar você hoje?
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <EduJarvisMessage key={msg.id} message={msg} />
      ))}

      {isProcessing && (
        <div className="flex gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Loader2 size={16} className="animate-spin" />
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="flex gap-1 items-center h-5">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
