import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Sparkles, 
  BookOpen, 
  Video, 
  FileText, 
  Zap,
  Loader2,
  Trophy,
  ArrowLeft
} from 'lucide-react';
import { generateLearningPath } from '../../services/geminiService';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';
import { AdaptiveExam } from './AdaptiveExam';

import { gamificationEngine } from '../../services/gamificationService';
import { cn } from '../../lib/utils';

export function StudentLearningPathView({ userProfile }: { userProfile: any }) {
  const [path, setPath] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(0);
  const [activeSimulationContext, setActiveSimulationContext] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStudentDataAndGeneratePath();
  }, [userProfile]);

  const toggleItemCompletion = (itemKey: string) => {
    const newSet = new Set(completedItems);
    if (newSet.has(itemKey)) {
      newSet.delete(itemKey);
    } else {
      newSet.add(itemKey);
    }
    setCompletedItems(newSet);
  };

  const getPhaseStats = (fase: any, idx: number) => {
    const items = [
      ...(fase.topicos || []),
      ...(fase.atividades || []),
      ...(fase.recursos || [])
    ];
    const totalItems = items.length;
    if (totalItems === 0) return { percent: 0, completed: 0, total: 0 };
    
    const completedInPhase = items.filter(item => completedItems.has(`${idx}-${item}`)).length;
    
    return {
      percent: Math.round((completedInPhase / totalItems) * 100),
      completed: completedInPhase,
      total: totalItems
    };
  };

  const fetchStudentDataAndGeneratePath = async () => {
    try {
      // Fetch recent diagnostics to feed the AI
      const q = query(
        collection(db, 'exam_submissions'),
        where('studentId', '==', userProfile.uid),
        orderBy('completedAt', 'desc'),
        limit(3)
      );
      const snap = await getDocs(q);
      const diagnostics = snap.docs.map(d => d.data());

      if (diagnostics.length === 0) {
        setLoading(false);
        return;
      }

      const learningPath = await generateLearningPath({
        profile: userProfile,
        diagnostics: diagnostics
      });
      
      setPath(learningPath);
    } catch (error) {
      console.error("Error generating path:", error);
      toast.error("Não foi possível gerar sua trilha personalizada agora.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      <p className="text-gray-500 font-medium">A IA está traçando seu melhor caminho de estudo...</p>
    </div>
  );

  if (!path || !path.fases) return (
    <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6 max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
        <MapIcon className="text-indigo-600" size={40} />
      </div>
      <h3 className="text-2xl font-black text-gray-900">Sua Trilha está em Branco</h3>
      <p className="text-gray-500">
        Para que a IA possa gerar uma trilha personalizada, você precisa realizar pelo menos um simulado diagnóstico.
      </p>
      <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
        Ir para Simulados
      </button>
    </div>
  );

  if (activeSimulationContext) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setActiveSimulationContext(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-bold text-sm"
          >
            <ArrowLeft size={16} /> Voltar para a Trilha
          </button>
          <div className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} /> Circuito Ativo
          </div>
        </div>
        <AdaptiveExam 
          examId={`sim_trilha_${Date.now()}`}
          competency={activeSimulationContext}
          onComplete={(score) => {
            toast.success(`Circuito concluído! Você obteve ${score.toFixed(1)}% de aproveitamento.`);
            setActiveSimulationContext(null);
          }}
          userRole="STUDENT"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <MapIcon size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900">Trilha de Aprendizagem</h2>
            <p className="text-gray-500 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" /> Personalizada pela IA JuniorsStudent
            </p>
          </div>
        </div>
        <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Status da Trilha</p>
          <p className="text-lg font-black text-emerald-700">Em Progresso</p>
        </div>
      </div>

      {/* Motivational Message */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-indigo-800 italic font-medium"
      >
        "{path.mensagem_motivacional}"
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Phases */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">Fases da Jornada</h3>
          {path.fases.map((fase: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setActivePhase(idx)}
              className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                activePhase === idx 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                activePhase === idx ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold uppercase tracking-wider ${activePhase === idx ? 'text-indigo-100' : 'text-gray-400'}`}>
                  Fase {idx + 1}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black truncate max-w-[120px]">{fase.nome}</p>
                  <span className={`text-[10px] font-black ${activePhase === idx ? 'text-indigo-100' : 'text-emerald-600'}`}>
                    {getPhaseStats(fase, idx).percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mr-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${getPhaseStats(fase, idx).percent}%` }}
                      className={`h-full ${activePhase === idx ? 'bg-white' : 'bg-emerald-500'}`}
                    />
                  </div>
                  <span className={`text-[8px] font-bold whitespace-nowrap ${activePhase === idx ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {getPhaseStats(fase, idx).completed}/{getPhaseStats(fase, idx).total}
                  </span>
                </div>
              </div>
              {activePhase === idx && <ChevronRight size={20} />}
            </button>
          ))}
          
          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 mt-8">
            <Trophy className="text-amber-500 mb-3" size={32} />
            <h4 className="font-black text-amber-900 text-sm">Prêmio Final</h4>
            <p className="text-xs text-amber-700 mt-1">Complete todas as fases para ganhar o selo "Mestre da Trilha" e +500 XP.</p>
          </div>
        </div>

        {/* Main Content: Phase Details */}
        <div className="lg:col-span-3 space-y-8">
          <motion.div 
            key={activePhase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900">{path.fases[activePhase].nome}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex gap-2">
                    {path.fases[activePhase].objetivos.map((obj: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">
                        {obj}
                      </span>
                    ))}
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all" 
                        style={{ width: `${getPhaseStats(path.fases[activePhase], activePhase).percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase">
                      {getPhaseStats(path.fases[activePhase], activePhase).percent}% Completo ({getPhaseStats(path.fases[activePhase], activePhase).completed}/{getPhaseStats(path.fases[activePhase], activePhase).total})
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                <Zap size={16} /> 150 XP
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Study Topics */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-500" /> Tópicos de Estudo
                </h4>
                <div className="space-y-2">
                  {path.fases[activePhase].topicos.map((topic: string, i: number) => {
                    const isDone = completedItems.has(`${activePhase}-${topic}`);
                    return (
                      <div 
                        key={i} 
                        onClick={() => toggleItemCompletion(`${activePhase}-${topic}`)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                          isDone ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100 hover:border-indigo-200"
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <Circle size={16} className="text-gray-300 group-hover:text-indigo-400" />
                        )}
                        <span className={cn("text-sm font-medium", isDone ? "text-emerald-900 line-through" : "text-gray-700")}>
                          {topic}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Practical Activities */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" /> Atividades Práticas
                </h4>
                <div className="space-y-2">
                  {path.fases[activePhase].atividades.map((act: string, i: number) => {
                    const isDone = completedItems.has(`${activePhase}-${act}`);
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm",
                          isDone ? "bg-emerald-100 border-emerald-300" : "bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100"
                        )}
                      >
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => toggleItemCompletion(`${activePhase}-${act}`)}
                        >
                          <CheckCircle2 size={16} className={isDone ? "text-emerald-700" : "text-emerald-500"} />
                          <span className={cn("text-sm font-medium", isDone ? "text-emerald-900 line-through" : "text-emerald-900")}>
                            {act}
                          </span>
                        </div>
                        <button 
                          onClick={() => setActiveSimulationContext(act)}
                          className="text-emerald-600 bg-white p-1.5 rounded-lg shadow-sm hover:scale-110 transition-transform"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                <Video size={18} className="text-red-500" /> Recursos Recomendados
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {path.fases[activePhase].recursos.map((res: string, i: number) => {
                  const isDone = completedItems.has(`${activePhase}-${res}`);
                  return (
                    <div 
                      key={i} 
                      onClick={() => toggleItemCompletion(`${activePhase}-${res}`)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer group relative",
                        isDone ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md"
                      )}
                    >
                      {isDone && <CheckCircle2 className="absolute top-2 right-2 text-emerald-500" size={16} />}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                        isDone ? "bg-emerald-100" : "bg-white group-hover:bg-indigo-50"
                      )}>
                        {res.toLowerCase().includes('vídeo') ? <Video className="text-red-500" size={20} /> : <FileText className="text-indigo-500" size={20} />}
                      </div>
                      <p className={cn("text-xs font-bold line-clamp-2", isDone ? "text-emerald-900 line-through" : "text-gray-900")}>
                        {res}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={async () => {
                await gamificationEngine.awardXP(userProfile.uid, 500);
                if (activePhase < path.fases.length - 1) {
                  setActivePhase(activePhase + 1);
                } else {
                  toast.success("Trilha de Aprendizagem Concluída! Você ganhou Bônus de Excelência.");
                }
              }}
              className="mt-10 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3"
            >
              Marcar Fase como Concluída <CheckCircle2 size={20} />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
