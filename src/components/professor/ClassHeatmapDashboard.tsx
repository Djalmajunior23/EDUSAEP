import React, { useState } from 'react';
import { Target, ChevronRight, UserX } from 'lucide-react';
import { motion } from 'motion/react';

interface StudentDifficulty {
  id: string;
  name: string;
  score: number;
}

interface CompetencyData {
  competency: string;
  score: number;
  status: 'critical' | 'attention' | 'good';
  studentsWithDifficulty: StudentDifficulty[];
}

interface ClassHeatmapDashboardProps {
  data: CompetencyData[];
}

export function ClassHeatmapDashboard({ data }: ClassHeatmapDashboardProps) {
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyData | null>(null);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'critical': return 'bg-red-500 text-white border-red-600 shadow-red-200';
      case 'attention': return 'bg-amber-400 text-amber-900 border-amber-500 shadow-amber-100';
      case 'good': return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLightStatusBg = (status: string) => {
    switch(status) {
      case 'critical': return 'bg-red-50 border-red-100';
      case 'attention': return 'bg-amber-50 border-amber-100';
      case 'good': return 'bg-emerald-50 border-emerald-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Target className="text-indigo-600" size={20} /> Mapa de Calor de Competências
      </h3>
      
      {!selectedCompetency ? (
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 flex-1 content-start">
          {data.map((comp, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCompetency(comp)}
              className={`p-4 rounded-2xl border flex flex-col justify-between items-start text-left shadow-md transition-all ${getStatusColor(comp.status)} h-32`}
            >
              <div className="w-full">
                <span className="text-xs font-bold uppercase opacity-80 tracking-wider">
                  Turma Média
                </span>
                <div className="text-3xl font-black mt-1">
                  {comp.score}%
                </div>
              </div>
              <div className="font-semibold text-sm leading-tight flex items-end justify-between w-full mt-2">
                <span className="truncate pr-2">{comp.competency}</span>
                {comp.studentsWithDifficulty.length > 0 && (
                  <span className="text-[10px] bg-white/30 backdrop-blur-sm px-2 py-1 rounded-lg font-bold whitespace-nowrap">
                    {comp.studentsWithDifficulty.length} em risco
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setSelectedCompetency(null)}
              className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors"
            >
              <ChevronRight className="rotate-180" size={16} /> Voltar ao Mapa
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getStatusColor(selectedCompetency.status).split(' ')[0]} ${getStatusColor(selectedCompetency.status).split(' ')[1]}`}>
              Média: {selectedCompetency.score}%
            </span>
          </div>

          <h4 className="text-xl font-black text-gray-900 mb-6">{selectedCompetency.competency}</h4>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <h5 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-widest">
              <UserX size={16} /> Requerem Intervenção
            </h5>
            
            {selectedCompetency.studentsWithDifficulty.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">Turma nivelada, sem alunos em estado crítico de aprendizado nesta competência.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedCompetency.studentsWithDifficulty.map((student, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border flex items-center justify-between ${getLightStatusBg('critical')}`}
                  >
                    <div>
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-[10px] font-semibold text-red-600 uppercase">Dificuldade Crítica</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-red-600">{student.score}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
