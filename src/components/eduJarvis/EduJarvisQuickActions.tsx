import React from 'react';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

interface Props {
  actions: QuickAction[];
  onSelectAction: (prompt: string) => void;
}

export function EduJarvisQuickActions({ actions, onSelectAction }: Props) {
  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 scrollbar-hide">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onSelectAction(action.prompt)}
          className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <span>{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}
