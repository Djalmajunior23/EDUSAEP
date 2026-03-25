import React from 'react';
import { Filter } from 'lucide-react';
import { Discipline } from '../../types';

export function DashboardFilters({ disciplines, onFilterChange }: { disciplines: Discipline[], onFilterChange: (filters: any) => void }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2 text-gray-500 font-bold">
        <Filter size={20} />
        <span>Filtros:</span>
      </div>
      <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" onChange={(e) => onFilterChange({ disciplineId: e.target.value })}>
        <option value="">Disciplina (Competência)</option>
        {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" onChange={(e) => onFilterChange({ turma: e.target.value })}>
        <option value="">Turma</option>
        <option value="A">Turma A</option>
        <option value="B">Turma B</option>
      </select>
      <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium" onChange={(e) => onFilterChange({ periodo: e.target.value })}>
        <option value="">Período</option>
        <option value="2026.1">2026.1</option>
        <option value="2026.2">2026.2</option>
      </select>
    </div>
  );
}
