import React from 'react';
import { Command, FileText, BarChart, BookOpen, Settings, PlayCircle, Target } from 'lucide-react';

interface Props {
  onSelect: (command: string) => void;
  isOpen: boolean;
}

export function EduJarvisCommandPalette({ onSelect, isOpen }: Props) {
  if (!isOpen) return null;

  const commands = [
    { icon: <FileText size={16} />, label: "Criar Simulado", cmd: "/criar-simulado" },
    { icon: <BookOpen size={16} />, label: "Gerar Plano de Aula", cmd: "/gerar-plano" },
    { icon: <BarChart size={16} />, label: "Analisar Turma", cmd: "/analisar-turma" },
    { icon: <Target size={16} />, label: "Gerar Trilha", cmd: "/gerar-trilha" },
    { icon: <PlayCircle size={16} />, label: "Sugerir Intervenção", cmd: "/sugerir-intervencao" },
    { icon: <Settings size={16} />, label: "Configurar Assistente", cmd: "/config" },
  ];

  return (
    <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-bottom-2 duration-200">
      <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
        <Command size={14} className="text-gray-400" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comandos Estruturados</span>
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {commands.map((c) => (
          <button
            key={c.cmd}
            onClick={() => onSelect(c.cmd)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm text-gray-700 dark:text-gray-300 rounded-lg transition-colors group"
          >
            <span className="text-gray-400 group-hover:text-indigo-600 transition-colors">{c.icon}</span>
            <span className="flex-1 text-left">{c.label}</span>
            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded uppercase">{c.cmd}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
