import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Crosshair, TrendingUp, TrendingDown, Info, Medal, AlertTriangle, BookOpen, Zap } from 'lucide-react';
import { observatoryService, StudentObservatoryData } from '../../services/observatoryService';
import { toast } from 'sonner';

interface StudentCompetencyModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export const StudentCompetencyModal: React.FC<StudentCompetencyModalProps> = ({ studentId, studentName, onClose }) => {
  const [data, setData] = useState<StudentObservatoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const observatoryData = await observatoryService.getStudentObservatoryData(studentId);
        setData(observatoryData);
      } catch (error) {
        toast.error("Erro ao carregar dados do aluno.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-3xl flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border-t-2 border-indigo-600 animate-spin" />
          <span className="font-medium text-gray-700">Analisando competências...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const fortes = data.competencies.filter(c => c.masteryLevel === 'Forte');
  const atencoes = data.competencies.filter(c => c.masteryLevel === 'Atenção');
  const criticos = data.competencies.filter(c => c.masteryLevel === 'Crítico');

  const handleIntervention = (competencyName: string, type: 'material' | 'quiz') => {
    if (type === 'material') {
      toast.success(`Material de apoio sugerido focado em "${competencyName}" enviado ao aluno com sucesso!`);
    } else {
      toast.success(`Quiz rápido de recuperação sobre "${competencyName}" gerado e encaminhado!`);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
          <div>
            <h3 className="text-xl font-black">Raio-X de Competências</h3>
            <p className="text-sm text-indigo-200">Aluno: {studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 bg-gray-50/50">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
               <div className="flex items-center gap-2 mb-2 text-emerald-700">
                  <Medal size={20} />
                  <span className="font-bold">Pontos Fortes</span>
               </div>
               <p className="text-2xl font-black text-emerald-800">{fortes.length}</p>
               <p className="text-xs text-emerald-600 mt-1">Competências consolidadas</p>
             </div>
             <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
               <div className="flex items-center gap-2 mb-2 text-amber-700">
                  <Info size={20} />
                  <span className="font-bold">Atenção</span>
               </div>
               <p className="text-2xl font-black text-amber-800">{atencoes.length}</p>
               <p className="text-xs text-amber-600 mt-1">Competências em desenvolvimento</p>
             </div>
             <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
               <div className="flex items-center gap-2 mb-2 text-red-700">
                  <AlertTriangle size={20} />
                  <span className="font-bold">Nível Crítico</span>
               </div>
               <p className="text-2xl font-black text-red-800">{criticos.length}</p>
               <p className="text-xs text-red-600 mt-1">Requer intervenção imediata</p>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Crosshair size={20} className="text-indigo-600" /> Detalhamento Analítico
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-gray-100 rounded-tl-xl text-left">Competência</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-center">Desempenho</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-center">Resoluções</th>
                    <th className="p-4 font-bold border-b border-gray-100 text-right">Status Atual</th>
                    <th className="p-4 font-bold border-b border-gray-100 rounded-tr-xl text-center">Intervenção Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.competencies.sort((a,b) => b.score - a.score).map((comp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-gray-800">{comp.name}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <span className={`font-black ${comp.score >= 80 ? 'text-emerald-600' : comp.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                             {comp.score}%
                           </span>
                           {comp.score >= 80 ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                          {comp.totalAttempts} itens
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                          comp.masteryLevel === 'Forte' ? 'bg-emerald-100 text-emerald-700' :
                          comp.masteryLevel === 'Atenção' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {comp.masteryLevel}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                           {(comp.masteryLevel === 'Atenção' || comp.masteryLevel === 'Crítico') ? (
                             <>
                               <button 
                                 onClick={() => handleIntervention(comp.name, 'material')}
                                 title="Sugerir Material Bônus"
                                 className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                               >
                                 <BookOpen size={16} />
                               </button>
                               <button 
                                 onClick={() => handleIntervention(comp.name, 'quiz')}
                                 title="Propor Quiz de Recuperação"
                                 className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                               >
                                 <Zap size={16} />
                               </button>
                             </>
                           ) : (
                             <span className="text-xs text-gray-400 font-medium">--</span>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.competencies.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-gray-400">
                        Nenhuma atividade classificada por competência registrada para o aluno.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-6">
            {fortes.length > 0 && (
              <div className="flex-1 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                <h5 className="font-black text-indigo-900 flex items-center gap-2 mb-3">
                  Recomendação de Avanço
                </h5>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  O aluno possui forte domínio em <b>{fortes.map(f => f.name).join(', ')}</b>. 
                  Recomenda-se introduzir estudos de caso avançados ou permitir que ele atue como mentor em grupos focais.
                </p>
              </div>
            )}
            {criticos.length > 0 && (
              <div className="flex-1 bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                <h5 className="font-black text-rose-900 flex items-center gap-2 mb-3">
                  Foco de Intervenção
                </h5>
                <p className="text-sm text-rose-800 leading-relaxed">
                  As competências <b>{criticos.map(c => c.name).join(', ')}</b> estão em nível crítico. 
                  É sugerido encaminhar o aluno para módulos de nivelamento interativos voltados a esses temas imediatamente.
                </p>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};
