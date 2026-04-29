import React from 'react';
import { Bot, X, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onClose: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

/**
 * EduJarvisHeader: Cabeçalho moderno e funcional do assistente.
 * Integrado ao ecossistema EduAI Core Ultra.
 */
export function EduJarvisHeader({ onClose, isExpanded, onToggleExpand }: Props) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-t-3xl shadow-sm z-10 transition-all">
      <div className="flex items-center gap-3">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <Bot size={22} className="text-white" />
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-400 p-0.5 rounded-full border-2 border-white dark:border-gray-900">
            <Sparkles size={8} className="text-white" />
          </div>
        </motion.div>
        
        <div className="flex flex-col">
          <h3 className="font-bold text-gray-900 dark:text-white text-base tracking-tight flex items-center gap-1.5">
            EduJarvis
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
              Ultra
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Assistente inteligente educacional
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleExpand}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          title={isExpanded ? "Restaurar" : "Maximizar"}
        >
          {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          title="Fechar EduJarvis"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
