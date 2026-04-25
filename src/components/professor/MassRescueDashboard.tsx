import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Users, AlertTriangle, ChevronRight, 
  Target, Send, Bot, Loader2, CheckCircle2,
  Filter, ArrowLeft
} from 'lucide-react';
import { UserProfile } from '../../types';
import { MassRescueService, RescueSummary } from '../../pedagogical-engine/services/MassRescueService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface MassRescueDashboardProps {
  userProfile: UserProfile | null;
}

export function MassRescueDashboard({ userProfile }: MassRescueDashboardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [groups, setGroups] = useState<RescueSummary[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<RescueSummary | null>(null);
  const classId = 'class_1'; // Simulação de turma selecionada

  useEffect(() => {
    fetchRescueGroups();
  }, [classId]);

  const fetchRescueGroups = async () => {
    setLoading(true);
    try {
      const data = await MassRescueService.identifyRescueGroups(classId);
      setGroups(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao identificar grupos de resgate.");
    } finally {
      setLoading(false);
    }
  };

  const handleRescue = async (group: RescueSummary, type: 'notification' | 'activity') => {
    if (!userProfile) return;
    setExecuting(`${group.competencyId}_${type}`);
    
    try {
      await MassRescueService.executeMassRescue(userProfile.uid, classId, group, type);
      toast.success(`Resgate em massa enviado para ${group.studentCount} alunos!`);
      // Refresh or update local state
    } catch (err) {
      console.error(err);
      toast.error("Erro ao executar ação de resgate.");
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">
          Mapeando Déficits Críticos...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Header com context */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Zap size={120} />
        </div>
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-bold transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para Sala de Comando
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Zap size={24} />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Resgate em Massa (AI Intervenção)</h1>
          </div>
          <p className="text-rose-100 max-w-2xl font-medium">
            O EduAI Core identificou grupos de alunos com lacunas críticas em competências específicas. 
            Aja agora para evitar a defasagem irreversível.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Grupos de Risco por Competência */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              Grupos Críticos Identificados
            </h2>
            <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors">
              <Filter size={14} /> Filtrar por Turma
            </button>
          </div>

          <div className="grid gap-4">
            {groups.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                <h3 className="font-bold text-gray-900">Saúde Pedagógica Estável</h3>
                <p className="text-gray-500 text-sm mt-1">Nenhum grupo de risco crítico precisando de resgate em massa hoje.</p>
              </div>
            ) : (
              groups.map((group) => (
                <motion.div 
                  key={group.competencyId}
                  layoutId={group.competencyId}
                  className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                    selectedGroup?.competencyId === group.competencyId ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-gray-100 shadow-sm hover:border-indigo-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="bg-rose-100 text-rose-600 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                          <AlertTriangle size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 leading-tight">{group.competencyName}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Users size={12} /> {group.studentCount} Alunos em Risco
                            </span>
                            <span className="text-xs text-gray-400 font-medium">Média do grupo: 12%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedGroup(selectedGroup?.competencyId === group.competencyId ? null : group)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            selectedGroup?.competencyId === group.competencyId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {selectedGroup?.competencyId === group.competencyId ? 'Recolher Detalhes' : 'Ver Alunos'}
                          <ChevronRight size={14} className={`transition-transform ${selectedGroup?.competencyId === group.competencyId ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedGroup?.competencyId === group.competencyId && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 pt-6 border-t border-gray-100 space-y-6 overflow-hidden"
                        >
                          {/* Alunos list */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {group.students.map((student) => (
                              <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-700">{student.name}</span>
                                <span className="text-[10px] font-black text-rose-600">DÉFICIT CRÍTICO</span>
                              </div>
                            ))}
                          </div>

                          {/* Quick Actions for this group */}
                          <div className="bg-indigo-50/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex gap-3">
                              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                                <Bot size={24} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-indigo-900">Intervenção Sistêmica do Copiloto</h4>
                                <p className="text-[11px] text-indigo-700 max-w-sm">A IA gerará uma atividade focada na lacuna de "{group.competencyName}" e notificará o grupo instantaneamente.</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-3 shrink-0">
                              <button 
                                onClick={() => handleRescue(group, 'notification')}
                                disabled={!!executing}
                                className="px-5 py-3 bg-white border border-indigo-200 text-indigo-600 rounded-2xl text-xs font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50"
                              >
                                {executing === `${group.competencyId}_notification` ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                Notificar Grupo
                              </button>
                              <button 
                                onClick={() => handleRescue(group, 'activity')}
                                disabled={!!executing}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                              >
                                {executing === `${group.competencyId}_activity` ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                                Ativar Resgate (IA)
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Status do Resgate */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-900">Radar de Resgate</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>Eficiência de Resgate</span>
                <span>42%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">12 Alunos Resgatados</p>
                  <p className="text-[10px] text-gray-500">Últimos 7 dias</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
                  <Target size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">5 Intervenções Ativas</p>
                  <p className="text-[10px] text-gray-500">Aguardando entrega</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/class-health')}
              className="w-full py-4 bg-gray-50 text-gray-700 text-xs font-bold rounded-2xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
            >
              Ver Dashboard de Saúde
            </button>
          </div>

          <div className="bg-gray-900 p-8 rounded-3xl text-white space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Target className="text-indigo-400" size={20} />
              Missão Crítica
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              O objetivo hoje é reduzir a taxa de risco da turma de **24% para 18%** através de micro-intervenções dirigidas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
