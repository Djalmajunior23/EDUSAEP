import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BrainCircuit, Activity, BookOpen, AlertTriangle, BatteryWarning, Target, Loader2, Gauge } from 'lucide-react';
import { CognitiveEngine, CognitiveProfile } from '../../../pedagogical-engine/services/CognitiveEngine';
import { toast } from 'sonner';

interface Student360DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  riskData: any; 
}

export function Student360Drawer({ isOpen, onClose, studentId, riskData }: Student360DrawerProps) {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      loadProfile();
    }
  }, [isOpen, studentId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await CognitiveEngine.analyzeStudentCognition(studentId);
      setProfile(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar diagnóstico cognitivo.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <BrainCircuit className="text-indigo-600" />
                  Visão 360º Cognitiva
                </h2>
                <p className="text-sm text-gray-500 font-mono">ID: {studentId}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="animate-spin text-indigo-600" size={40} />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse text-center">
                    Acessando Sinapses do Aluno... <br/>
                    <span className="opacity-50">Consultando CognitiveEngine v2.1</span>
                  </p>
                </div>
              ) : (
                <>
                  {/* Risk Score Summary */}
                  <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
                    <div className={`p-4 rounded-xl shrink-0 ${riskData?.level === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {riskData?.level === 'HIGH' ? <AlertTriangle size={32} /> : <Activity size={32} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Risco {riskData?.level}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Diagnóstico multidimensional baseado em {riskData?.score || 0} pontos de atrito pedagógico.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {riskData?.justifications?.map((j: string, i: number) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium border border-gray-200">
                              {j}
                            </span>
                          ))}
                        </div>
                    </div>
                  </div>

                  {/* Cognitive Engines Diagnosis */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Gauge size={18} className="text-indigo-500" /> Biometria Cognitiva (IA EduSAEP)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Falso Aprendizado */}
                      <div className="p-5 rounded-[2rem] border border-rose-100 bg-rose-50/50 flex flex-col gap-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Target size={48} />
                        </div>
                        <div className="flex justify-between items-center text-rose-700">
                          <span className="text-[10px] font-black uppercase tracking-wider">Falso Aprendizado</span>
                          <AlertTriangle size={14} className={profile?.falseLearningRisk && profile.falseLearningRisk > 60 ? 'animate-pulse' : ''} />
                        </div>
                        <p className="text-3xl font-black text-rose-900">{profile?.falseLearningRisk.toFixed(0)}%</p>
                        <p className="text-[10px] text-rose-600/80 leading-relaxed font-bold uppercase">Risco de Retenção Superficial</p>
                        <div className="mt-2 h-1 bg-rose-200 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-600" style={{ width: `${profile?.falseLearningRisk}%` }}></div>
                        </div>
                      </div>
                      
                      {/* Carga Cognitiva */}
                      <div className="p-5 rounded-[2rem] border border-purple-100 bg-purple-50/50 flex flex-col gap-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <BrainCircuit size={48} />
                        </div>
                        <div className="flex justify-between items-center text-purple-700">
                          <span className="text-[10px] font-black uppercase tracking-wider">Carga de Fadiga</span>
                          <BatteryWarning size={14} />
                        </div>
                        <p className="text-3xl font-black text-purple-900">{profile?.cognitiveLoad.toFixed(0)}%</p>
                        <p className="text-[10px] text-purple-600/80 leading-relaxed font-bold uppercase">Nível de Exaustão Mental</p>
                        <div className="mt-2 h-1 bg-purple-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600" style={{ width: `${profile?.cognitiveLoad}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                      <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600">
                        <Activity size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Pico de Performance</p>
                        <p className="text-sm font-bold text-indigo-900">{profile?.peakPerformanceTime} <span className="text-xs font-medium text-indigo-600">(Período Matutino)</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 border-t pt-6">
                      <BookOpen size={18} className="text-emerald-500" /> Plano de Apoio Sugerido
                    </h3>
                    <div className="space-y-3">
                      {profile?.fatigueLevel === 'HIGH' ? (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex gap-3 items-center">
                          <AlertTriangle className="shrink-0" size={20} />
                          <p><strong>ALERTA DE BURNOUT:</strong> O Motor recomenda suspender atividades densas por 48h. Priorize feedback motivacional.</p>
                        </div>
                      ) : null}
                      
                      <button className="w-full p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-all group flex flex-col gap-1">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-700">Reunião de Escuta Ativa 1:1</span>
                        <span className="text-xs text-gray-500 group-hover:text-indigo-600/70">O engine sugere acolhimento antes de sobrecarregar com mais simulados.</span>
                      </button>
                      <button className="w-full p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-left transition-all group flex flex-col gap-1 text-emerald-800">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-emerald-700">Gerar Mini-Trilha de Reforço (IA)</span>
                        <span className="text-xs text-emerald-600/70 group-hover:text-emerald-600">Ajustado para o perfil de aprendizado profundo do aluno.</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
