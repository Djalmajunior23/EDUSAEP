import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Target, BrainCircuit, AlertTriangle, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { DropoutRiskCard } from '../shared/DropoutRiskCard';
import { StudentLearningPath } from '../shared/StudentLearningPath';
import { StudentProgressCard } from '../student/StudentProgressCard';

interface StudentDashboardViewProps {
  user: User | null;
  userProfile: UserProfile | null;
}

export function StudentDashboardView({ user, userProfile }: StudentDashboardViewProps) {
  const navigate = useNavigate();
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [latestDecision, setLatestDecision] = useState<any | null>(null);
  const [rescueNotification, setRescueNotification] = useState<any | null>(null);
  const [studyPlan, setStudyPlan] = useState<any | null>(null);
  const [dropoutRisk, setDropoutRisk] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userProfile) return;

    // Listen for dropout risk alerts
    const qRisk = query(
      collection(db, 'smart_alerts'),
      where('targetUserId', '==', user.uid),
      where('type', '==', 'Risco de Evasão'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsubRisk = onSnapshot(qRisk, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setDropoutRisk({ 
          score: data.metadata?.score || 0,
          level: data.metadata?.riskLevel || 'Baixo',
          justifications: data.metadata?.justifications || []
        });
      }
    });

    // Listen to their diagnostics (Properly filtered for performance and security)
    const role = userProfile.role as string;
    const isProfessor = role === 'TEACHER' || role === 'ADMIN' || role === 'COORDINATOR';
    const isStudent = !isProfessor; // Everyone else is a student for the dashboard
    
    const qDiags = isProfessor
      ? query(collection(db, 'diagnostics'), orderBy('createdAt', 'desc'))
      : query(
          collection(db, 'diagnostics'), 
          where('studentId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubDiags = onSnapshot(qDiags, (snapshot) => {
      const allDiags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDiagnostics(allDiags);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching diagnostics:", error);
      setLoading(false);
    });

    // Listen to their latest pedagogical decision (Engine result)
    const qDecisions = query(
      collection(db, 'pedagogicalDecisions'),
      where('studentId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const unsubDecisions = onSnapshot(qDecisions, (snapshot) => {
      if (!snapshot.empty) {
        setLatestDecision({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setLatestDecision(null);
      }
    }, (error) => {
      console.warn("Error fetching pedagogical decisions:", error);
    });

    // Listen to rescue notifications
    const qRescue = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('type', '==', 'rescue'),
      where('read', '==', false),
      limit(1)
    );
    const unsubRescue = onSnapshot(qRescue, (snapshot) => {
      if (!snapshot.empty) {
        setRescueNotification({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setRescueNotification(null);
      }
      setLoading(false);
    });

    // Listen to their study plan
    const qPlan = query(
      collection(db, 'study_plans'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsubPlan = onSnapshot(qPlan, (snapshot) => {
      if (!snapshot.empty) {
        setStudyPlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setStudyPlan(null);
      }
    });

    return () => {
      unsubDiags();
      unsubDecisions();
      unsubRescue();
      unsubPlan();
      unsubRisk();
    };
  }, [user, userProfile]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const criticalComps = latestDecision?.competencies?.filter((c: any) => c.level === 'CRITICAL') || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Rescue Alert Section */}
      <AnimatePresence>
        {rescueNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-r from-red-600 to-rose-700 p-4 rounded-3xl text-white shadow-xl shadow-red-200 border border-red-500 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap size={80} />
            </div>
            <div className="flex items-center gap-4 relative z-10 font-medium">
              <div className="bg-white/20 p-3 rounded-2xl">
                <AlertTriangle size={24} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-0.5">Missão de Resgate Ativada</p>
                <h3 className="text-lg font-bold">O professor iniciou um plano de recuperação para você!</h3>
                <p className="text-sm opacity-90 text-red-50">{rescueNotification.message}</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/learning-situation')} // Or specific activity route
              className="px-6 py-3 bg-white text-red-700 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg shrink-0 relative z-10"
            >
              Aceitar Desafio <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dropoutRisk && dropoutRisk.score >= 30 && (
          <DropoutRiskCard 
            score={dropoutRisk.score} 
            level={dropoutRisk.level} 
            justifications={dropoutRisk.justifications} 
            isStudentView={true} 
          />
        )}
      </AnimatePresence>

      {/* Gamification Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[2rem] p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-48 h-48 bg-emerald-400/20 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
          <div className="w-24 h-24 bg-white/20 rounded-full flex flex-col items-center justify-center border-4 border-white/30 shrink-0 shadow-inner">
            <span className="text-sm font-bold uppercase tracking-widest opacity-80 mb-[-4px]">Nível</span>
            <span className="text-4xl font-black">{userProfile?.level || 1}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">Olá, {user?.displayName?.split(' ')[0] || 'Estudante'}!</h2>
            <p className="text-emerald-50 mt-1 font-medium">{userProfile?.xp || 0} XP Acumulados no seu aprendizado</p>
            <div className="mt-4 w-full md:w-64 h-2.5 bg-black/20 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-white to-emerald-100 rounded-full transition-all duration-1000" 
                style={{ width: `${((userProfile?.xp || 0) % 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-100 mt-2 uppercase tracking-wider font-bold">
              {100 - ((userProfile?.xp || 0) % 100)} XP para o próximo nível
            </p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button onClick={() => navigate('/learning-path')} className="bg-white/10 hover:bg-white/20 border border-white/20 transition-colors p-4 rounded-2xl flex flex-col items-center justify-center min-w-[100px]">
            <Target size={24} className="mb-2 text-emerald-200" />
            <span className="text-xs font-bold text-center">Trilha<br/>Sugerida</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Pedagogical Copilot Feedback */}
        <div className="lg:col-span-2 space-y-8">
          
          <StudentProgressCard profile={userProfile} />

          <div className="bg-white rounded-3xl p-8 border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
            
            <div className="flex items-start gap-4">
              <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl">
                <BrainCircuit size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Seu Feedback do Copiloto (IA)</h3>
                
                {latestDecision ? (
                  <div className="space-y-6">
                    <p className="text-gray-700 leading-relaxed font-medium bg-indigo-50/50 p-4 rounded-xl">
                      {latestDecision.recommendation}
                    </p>
                    
                    {criticalComps.length > 0 && (
                      <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2 mb-3">
                          <AlertTriangle size={16} /> Foco Prioritário
                        </h4>
                        <ul className="space-y-2">
                          {criticalComps.map((comp: any) => (
                            <li key={comp.id} className="text-sm text-rose-700 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {comp.name}
                            </li>
                          ))}
                        </ul>
                        <button 
                          onClick={() => navigate('/exercises')}
                          className="mt-4 px-4 py-2 bg-white border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-50 transition-colors"
                        >
                          Praticar estas competências
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 font-medium">Você ainda não possui um mapeamento de Risco. Realize um simulado para que possamos traçar seu perfil!</p>
                    <button 
                      onClick={() => navigate('/student-exams')}
                      className="mt-4 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors inline-block"
                    >
                      Acessar Simulados
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <StudentLearningPath plan={studyPlan} />

          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">Seus Diagnósticos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {diagnostics.length === 0 ? (
                <div className="col-span-full border border-dashed border-gray-300 rounded-3xl p-12 text-center">
                  <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg">Nenhum diagnóstico ainda.</h3>
                  <p className="text-gray-500 mt-1 max-w-sm mx-auto">Faça seu primeiro simulado SAEP para entender seu nível e receber sugestões.</p>
                </div>
              ) : (
                diagnostics.slice(0, 4).map((diag, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={diag.id} 
                    onClick={() => navigate(`/aluno/${diag.id}`)}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="flex-1">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 group-hover:scale-110 transition-all">
                        <Target size={24} />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 line-clamp-1">{diag.examTitle || 'Simulado Geral'}</h4>
                      <div className="text-sm text-gray-500 mt-2 space-y-1">
                        <p>Total de Questões: <span className="font-semibold text-gray-700">{diag.totalQuestions || 0}</span></p>
                        <p>Acertos: <span className="font-semibold text-gray-700">{diag.correctAnswers || 0}</span></p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-indigo-600 font-bold text-sm">
                      Ver Relatório
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Col: Timeline & Activity List placeholder */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen size={18} className="text-emerald-500" /> Atividades Pendentes
            </h3>
            
            <div className="space-y-4">
               <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center">
                 <p className="text-sm font-medium text-gray-500">Nenhuma atividade pendente no momento. As tarefas com prioridade aparecerão aqui.</p>
               </div>
               
               <button 
                 onClick={() => navigate('/student-activities')}
                 className="w-full py-3 bg-gray-50 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors mt-4"
               >
                 Ver Histórico Completo
               </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
