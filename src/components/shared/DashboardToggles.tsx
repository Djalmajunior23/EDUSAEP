import React from 'react';
import { Sun, Moon, Database, Zap, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

type AIProvider = 'gemini' | 'openai' | 'deepseek';

interface DarkModeToggleProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export function DarkModeToggle({ darkMode, setDarkMode }: DarkModeToggleProps) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-emerald-600 transition-all border border-gray-200 dark:border-gray-700"
      title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

interface AIProviderToggleProps {
  provider: AIProvider;
  onProviderChange: (p: AIProvider) => void;
}

export function AIProviderToggle({ provider, onProviderChange }: AIProviderToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => onProviderChange('gemini')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
          provider === 'gemini' ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <Zap size={14} /> GEMINI
      </button>
      <button
        onClick={() => onProviderChange('openai')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
          provider === 'openai' ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <Database size={14} /> OPENAI
      </button>
      <button
        onClick={() => onProviderChange('deepseek')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
          provider === 'deepseek' ? "bg-white dark:bg-gray-700 text-purple-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
        )}
      >
        <RefreshCw size={14} /> DEEPSEEK
      </button>
    </div>
  );
}
