import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad, 
  Play, 
  ChevronRight, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Terminal,
  Cpu,
  Monitor,
  Activity,
  Trophy,
  RefreshCcw,
  Plus,
  Trash2
} from 'lucide-react';
import { simulatorService } from '../../services/simulatorService';
import { useAuth } from '../../contexts/AuthContext';
import { Simulator } from '../../types';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function SimulatorsView() {
  const { user, isProfessor } = useAuth();
  const [simulators, setSimulators] = useState<Simulator[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'run' | 'create'>('list');
  const [selectedSim, setSelectedSim] = useState<Simulator | null>(null);
  
  // Simulation State
  const [currentStage, setCurrentStage] = useState(0);
  const [simHistory, setSimHistory] = useState<string[]>([]);
  const [simFinished, setSimFinished] = useState(false);

  // Creation State
  const [newSim, setNewSim] = useState<Partial<Simulator>>({
    title: '',
    description: '',
    type: 'tech',
    scenario: '',
    stages: [],
    difficulty: 1,
    xpReward: 100
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sList = await simulatorService.getAllSimulators();
      setSimulators(sList);
    } catch (err) {
      toast.error('Erro ao carregar simuladores.');
    } finally {
      setLoading(false);
    }
  };

  const startSimulator = (sim: Simulator) => {
    setSelectedSim(sim);
    setCurrentStage(0);
    setSimHistory([`Iniciando simulador: ${sim.title}`, sim.scenario]);
    setSimFinished(false);
    setActiveView('run');
  };

  const handleAction = (option: string) => {
    if (!selectedSim) return;
    
    const stage = selectedSim.stages[currentStage];
    const isCorrect = option === stage.correctAction || !stage.correctAction;
    
    setSimHistory(prev => [...prev, `> ${option}`, stage.feedback]);
    
    if (isCorrect) {
      if (currentStage < selectedSim.stages.length - 1) {
        setCurrentStage(prev => prev + 1);
      } else {
        setSimFinished(true);
        if (user?.uid) {
          simulatorService.finishSimulator(user.uid, selectedSim.id!, selectedSim.xpReward);
        }
      }
    } else {
      toast.error('Ação incorreta para este cenário.');
    }
  };

  const handleSaveSim = async () => {
    if (!newSim.title || !newSim.stages?.length || !user?.uid) {
      toast.error('Dados insuficientes para criar o simulador.');
      return;
    }
    try {
      await simulatorService.createSimulator({
        title: newSim.title!,
        description: newSim.description || '',
        type: newSim.type || 'tech',
        scenario: newSim.scenario || '',
        stages: newSim.stages as any,
        difficulty: newSim.difficulty as any,
        xpReward: newSim.xpReward || 100
      });
      toast.success('Simulador criado!');
      setActiveView('list');
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar simulador.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {activeView === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                  <Gamepad className="text-amber-500" /> Simuladores Profissionais
                </h2>
                <p className="text-gray-500 font-medium">Resolva problemas reais em ambientes controlados.</p>
              </div>
              {isProfessor && (
                <button 
                  onClick={() => setActiveView('create')}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 shadow-lg shadow-amber-100 transition-all active:scale-95"
                >
                  <Plus size={20} /> Novo Simulador
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {simulators.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Cpu size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold">Nenhum simulador disponível.</p>
                </div>
              ) : simulators.map((sim) => (
                <motion.div 
                  key={sim.id}
                  whileHover={{ y: -8 }}
                  className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    {sim.type === 'tech' ? <Cpu size={80} /> : <Activity size={80} />}
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                       {Array.from({ length: 5 }).map((_, i) => (
                         <Star key={i} size={12} className={i < sim.difficulty ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
                       ))}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 truncate">{sim.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 h-10">{sim.description}</p>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase">
                        {sim.xpReward} XP
                      </span>
                      <button 
                        onClick={() => startSimulator(sim)}
                        className="flex items-center gap-1 text-amber-600 font-bold text-sm group-hover:gap-2 transition-all"
                      >
                        Iniciar Simulação <Play size={14} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'run' && selectedSim && (
          <motion.div 
            key="run"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)] min-h-[600px]"
          >
            {/* Simulation Interface */}
            <div className="lg:col-span-8 bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-slate-800">
              {/* Terminal Header */}
              <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={12} /> ENGINE_STATE: {simFinished ? 'COMPLETED' : 'ACTIVE'}
                </div>
                <button onClick={() => setActiveView('list')} className="text-slate-400 hover:text-white transition-colors">
                  <RefreshCcw size={16} />
                </button>
              </div>

              {/* Console Output */}
              <div className="flex-1 p-8 overflow-y-auto space-y-4 font-mono text-sm scrollbar-thin scrollbar-thumb-slate-700">
                {simHistory.map((line, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={cn(
                      "leading-relaxed",
                      line.startsWith('>') ? "text-emerald-400 font-bold" : "text-slate-300"
                    )}
                  >
                    {line.startsWith('>') ? line : `[SYSTEM] ${line}`}
                  </motion.div>
                ))}
                {simFinished && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-10 text-center space-y-4"
                  >
                    <Trophy size={64} className="mx-auto text-amber-400" />
                    <h3 className="text-2xl font-black text-white">SIMULAÇÃO CONCLUÍDA!</h3>
                    <p className="text-emerald-400 font-bold">Você ganhou {selectedSim.xpReward} XP por sua performance.</p>
                    <button 
                      onClick={() => setActiveView('list')}
                      className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                    >
                      Voltar ao Painel
                    </button>
                  </motion.div>
                )}
                <div className="h-4" />
              </div>

              {/* Action Bar */}
              {!simFinished && (
                <div className="p-8 bg-slate-800/50 backdrop-blur-md border-t border-slate-700">
                  <div className="mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Desafio Atual:</h4>
                    <p className="text-white font-bold text-lg">{selectedSim.stages[currentStage].challenge}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSim.stages[currentStage].options?.map((opt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleAction(opt)}
                        className="p-5 bg-slate-900 border border-slate-700 rounded-2xl text-left text-slate-200 font-bold hover:bg-indigo-900/40 hover:border-indigo-500/50 transition-all group"
                      >
                        <span className="text-indigo-400 font-black mr-2 opacity-50">{i + 1}.</span> {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sim Info Panel */}
            <div className="lg:col-span-4 space-y-6 overflow-y-auto">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                    <Monitor size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">{selectedSim.title}</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-400">
                    <span>PROGRESSO DA MISSÃO</span>
                    <span>{Math.round(((currentStage) / selectedSim.stages.length) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: `${(currentStage / selectedSim.stages.length) * 100}%` }}
                      className="h-full bg-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Informações do Cenário</h4>
                  <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-600 leading-relaxed italic">
                    {selectedSim.description}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">LÓGICA</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">DECISÃO</span>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">TÉCNICO</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={14} /> Dica de Performance
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Analise o console cuidadosamente antes de tomar uma decisão. No EduSAEP Ultra, erros reduzem o bônus final de XP.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'create' && (
          <motion.div 
            key="create"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto space-y-8 pb-20"
          >
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveView('list')} className="text-sm font-bold text-gray-400 flex items-center gap-2 hover:text-amber-600 transition-colors">
                <RefreshCcw size={16} /> Cancelar Simulador
              </button>
              <h2 className="text-2xl font-black text-gray-900">Novo Motor de Simulação</h2>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Título do Simulador</label>
                  <input 
                    type="text" 
                    value={newSim.title}
                    onChange={(e) => setNewSim(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tipo de Simulação</label>
                  <select 
                    value={newSim.type}
                    onChange={(e) => setNewSim(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold"
                  >
                    <option value="tech">Técnico / Programação</option>
                    <option value="professional">Profissional / Atendimento</option>
                    <option value="logic">Lógica de Diagnóstico</option>
                    <option value="soft_skill">Soft Skills / Liderança</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cenário Inicial (Narrativa)</label>
                <textarea 
                  value={newSim.scenario}
                  onChange={(e) => setNewSim(prev => ({ ...prev, scenario: e.target.value }))}
                  placeholder="Descreva o contexto inicial em que o aluno se encontra..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none text-sm min-h-[100px]"
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-gray-900 flex items-center gap-2"><Cpu size={18} /> Etapas do Motor</h3>
                  <button 
                    onClick={() => {
                        const stages = [...(newSim.stages || []), { title: '', description: '', challenge: '', options: ['', '', '', ''], correctAction: '', feedback: '' }];
                        setNewSim(prev => ({ ...prev, stages }));
                    }}
                    className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs"
                  >
                    + Adicionar Etapa
                  </button>
                </div>

                <div className="space-y-6">
                  {newSim.stages?.map((stage, i) => (
                    <div key={i} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-6 relative">
                       <button 
                        onClick={() => {
                          const stages = [...(newSim.stages || [])];
                          stages.splice(i, 1);
                          setNewSim(prev => ({ ...prev, stages }));
                        }}
                        className="absolute top-6 right-6 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                      <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest">ETAPA {i + 1}</h4>
                      
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          placeholder="Perguntas ou Desafio Principal..."
                          value={stage.challenge}
                          onChange={(e) => {
                            const stages = [...(newSim.stages || [])];
                            stages[i].challenge = e.target.value;
                            setNewSim(prev => ({ ...prev, stages }));
                          }}
                          className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {stage.options?.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                               <input 
                                type="text" 
                                placeholder={`Opção ${oIdx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                  const stages = [...(newSim.stages || [])];
                                  stages[i].options![oIdx] = e.target.value;
                                  setNewSim(prev => ({ ...prev, stages }));
                                }}
                                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none text-xs"
                              />
                              <button 
                                onClick={() => {
                                  const stages = [...(newSim.stages || [])];
                                  stages[i].correctAction = opt;
                                  setNewSim(prev => ({ ...prev, stages }));
                                }}
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                  stage.correctAction === opt ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                                )}
                              >
                                <CheckCircle2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <textarea 
                          placeholder="Feedback após a ação correta..."
                          value={stage.feedback}
                          onChange={(e) => {
                            const stages = [...(newSim.stages || [])];
                            stages[i].feedback = e.target.value;
                            setNewSim(prev => ({ ...prev, stages }));
                          }}
                          className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t flex flex-col md:flex-row gap-4">
                <button 
                  onClick={handleSaveSim}
                  className="flex-1 py-5 bg-amber-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-amber-200 hover:bg-amber-700 transition-all active:scale-95"
                >
                  Publicar Simulador
                </button>
                <button 
                  onClick={() => setActiveView('list')}
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Descartar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
