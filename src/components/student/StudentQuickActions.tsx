import React from 'react';
import { Target, BookOpen, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function StudentQuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <button 
        onClick={() => navigate('/adaptive-exam')}
        className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
      >
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
          <Target size={24} />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-gray-900 dark:text-white">Novo Simulado</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pratique com questões adaptativas.</p>
        </div>
      </button>

      <button 
        onClick={() => navigate('/recommendations')}
        className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
      >
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
          <BookOpen size={24} />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-gray-900 dark:text-white">Recomendações</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Veja seu plano de estudos.</p>
        </div>
      </button>

      <button 
        onClick={() => navigate('/tutor')}
        className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
      >
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
          <MessageSquare size={24} />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-gray-900 dark:text-white">Tutor Socrático</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tire dúvidas com IA.</p>
        </div>
      </button>
    </div>
  );
}
