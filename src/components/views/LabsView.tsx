import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FlaskConical, 
  Plus, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  Timer, 
  Trash2,
  Send,
  ExternalLink,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { labService } from '../../services/labService';
import { useAuth } from '../../contexts/AuthContext';
import { PracticalLab, LabSubmission } from '../../types';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function LabsView() {
  const { user, isProfessor } = useAuth();
  const [labs, setLabs] = useState<PracticalLab[]>([]);
  const [submissions, setSubmissions] = useState<LabSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'view' | 'create'>('list');
  const [selectedLab, setSelectedLab] = useState<PracticalLab | null>(null);
  
  // Submission State
  const [labContent, setLabContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Creation State
  const [newLab, setNewLab] = useState<Partial<PracticalLab>>({
    title: '',
    objective: '',
    description: '',
    steps: [],
    resources: []
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const lList = await labService.getAllLabs();
      setLabs(lList);
      if (!isProfessor) {
        const sList = await labService.getSubmissionsByStudent(user.uid);
        setSubmissions(sList);
      }
    } catch (err) {
      toast.error('Erro ao carregar laboratórios.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLab = (lab: PracticalLab) => {
    setSelectedLab(lab);
    const existing = submissions.find(s => s.labId === lab.id);
    setLabContent(existing?.content || '');
    setActiveView('view');
  };

  const handleSubmitLab = async () => {
    if (!selectedLab || !user?.uid || !labContent) return;
    setSubmitting(true);
    try {
      await labService.submitLab({
        labId: selectedLab.id!,
        studentId: user.uid,
        studentName: user.displayName || 'Estudante',
        content: labContent,
      });
      toast.success('Laboratório enviado com sucesso!');
      fetchData();
      setActiveView('list');
    } catch (err) {
      toast.error('Erro ao enviar laboratório.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLab = async () => {
    if (!newLab.title || !newLab.steps?.length || !user?.uid) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    try {
      await labService.createLab({
        title: newLab.title!,
        objective: newLab.objective || '',
        description: newLab.description || '',
        steps: newLab.steps as any,
        resources: newLab.resources || [],
        teacherId: user.uid
      });
      toast.success('Laboratório criado com sucesso!');
      setActiveView('list');
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar laboratório.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
                  <FlaskConical className="text-indigo-600" /> Laboratórios Práticos
                </h2>
                <p className="text-gray-500 font-medium">Aprenda na prática com roteiros guiados.</p>
              </div>
              {isProfessor && (
                <button 
                  onClick={() => setActiveView('create')}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  <Plus size={20} /> Novo Laboratório
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold">Nenhum laboratório disponível.</p>
                </div>
              ) : labs.map((lab) => {
                const submission = submissions.find(s => s.labId === lab.id);
                return (
                  <motion.div 
                    key={lab.id}
                    whileHover={{ y: -8 }}
                    onClick={() => handleOpenLab(lab)}
                    className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative group"
                  >
                    <div className="mb-6 flex justify-between items-start">
                      <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                        <BookOpen size={24} />
                      </div>
                      {submission && (
                        <span className={cn(
                          "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                          submission.status === 'reviewed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {submission.status === 'reviewed' ? 'Avaliado' : 'Pendente'}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{lab.title}</h3>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10 leading-relaxed font-medium">
                      {lab.objective}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                        <Timer size={14} /> {lab.steps.length} ETAPAS
                      </div>
                      <div className="text-indigo-600 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Acessar Laboratório <ChevronRight size={16} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeView === 'view' && selectedLab && (
          <motion.div 
            key="view"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Lab Instructions */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setActiveView('list')}
                  className="text-sm font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                >
                  <ChevronRight size={16} className="rotate-180" /> Voltar
                </button>
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">
                  Código: {selectedLab.id?.slice(0, 8)}
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-10">
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-gray-900">{selectedLab.title}</h2>
                  <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-500">
                    <p className="text-sm text-slate-600 font-bold italic">"{selectedLab.objective}"</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 border-b pb-4">Etapas do Laboratório</h3>
                  <div className="space-y-8">
                    {selectedLab.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-6">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                          {idx + 1}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-900 text-lg uppercase tracking-tight">{step.title}</h4>
                          <p className="text-gray-600 leading-relaxed">{step.instruction}</p>
                          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                            <div className="mt-1 text-emerald-600"><CheckCircle2 size={16} /></div>
                            <div>
                              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Resultado Esperado</p>
                              <p className="text-xs text-emerald-700 font-medium">{step.expectedOutcome}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Sidebar */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg space-y-6 sticky top-8">
                <h3 className="text-xl font-black text-gray-900">Sua Entrega</h3>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Relatório de Execução</label>
                  <textarea 
                    value={labContent}
                    onChange={(e) => setLabContent(e.target.value)}
                    placeholder="Descreva o que foi feito, as dificuldades encontradas e os resultados obtidos..."
                    className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[300px]"
                  />
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-black text-indigo-900 uppercase">Recursos Complementares</h4>
                  <div className="space-y-2">
                    {selectedLab.resources?.map((res, i) => (
                      <a key={i} href={res} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-indigo-600 font-bold hover:underline">
                        <ExternalLink size={14} /> Recurso {i + 1}
                      </a>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleSubmitLab}
                  disabled={submitting || !labContent}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Finalizar Laboratório
                </button>
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
              <button onClick={() => setActiveView('list')} className="text-sm font-bold text-gray-400 flex items-center gap-2 hover:text-indigo-600 transition-colors">
                <ChevronRight size={16} className="rotate-180" /> Cancelar Criação
              </button>
              <h2 className="text-2xl font-black text-gray-900">Novo Roteiro de Laboratório</h2>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título do Experimento</label>
                  <input 
                    type="text" 
                    value={newLab.title}
                    onChange={(e) => setNewLab(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Objetivo Principal</label>
                  <input 
                    type="text" 
                    value={newLab.objective}
                    onChange={(e) => setNewLab(prev => ({ ...prev, objective: e.target.value }))}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-gray-900">Roteiro Step-by-Step</h3>
                  <button 
                    onClick={() => {
                      const steps = [...(newLab.steps || []), { title: 'Etapa ' + ((newLab.steps?.length || 0) + 1), instruction: '', expectedOutcome: '' }];
                      setNewLab(prev => ({ ...prev, steps }));
                    }}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs"
                  >
                    + Etapa
                  </button>
                </div>

                <div className="space-y-6">
                  {newLab.steps?.map((step, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative">
                      <button 
                        onClick={() => {
                          const steps = [...(newLab.steps || [])];
                          steps.splice(i, 1);
                          setNewLab(prev => ({ ...prev, steps }));
                        }}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                      <input 
                        type="text" 
                        value={step.title}
                        onChange={(e) => {
                          const steps = [...(newLab.steps || [])];
                          steps[i].title = e.target.value;
                          setNewLab(prev => ({ ...prev, steps }));
                        }}
                        className="bg-transparent font-black text-slate-900 outline-none border-b border-transparent focus:border-indigo-500 w-full mb-2"
                      />
                      <textarea 
                        placeholder="Instruções para o aluno..."
                        value={step.instruction}
                        onChange={(e) => {
                          const steps = [...(newLab.steps || [])];
                          steps[i].instruction = e.target.value;
                          setNewLab(prev => ({ ...prev, steps }));
                        }}
                        className="w-full p-3 h-24 bg-white border border-slate-200 rounded-xl outline-none text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Resultado esperado..."
                        value={step.expectedOutcome}
                        onChange={(e) => {
                          const steps = [...(newLab.steps || [])];
                          steps[i].expectedOutcome = e.target.value;
                          setNewLab(prev => ({ ...prev, steps }));
                        }}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-xs italic"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t flex flex-col md:flex-row gap-4">
                <button 
                  onClick={handleSaveLab}
                  className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700"
                >
                  Salvar Roteiro
                </button>
                <button 
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest"
                  onClick={() => setActiveView('list')}
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
