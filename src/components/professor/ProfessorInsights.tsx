import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  TrendingUp,
  Zap,
  X,
  ArrowRight,
  Mail
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc } from 'firebase/firestore';
import { generateLessonPlan, LessonPlanResult, generateSIPA, SIPAResult } from '../../services/geminiService';
import { UserProfile } from '../../types';
import { n8nEvents } from '../../services/n8nService';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { toast } from 'sonner';

export function ProfessorInsights({ userProfile, selectedModel = "gemini-3-flash-preview" }: { userProfile: UserProfile | null, selectedModel?: string }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classData, setClassData] = useState<any[]>([]);
  const [lessonPlan, setLessonPlan] = useState<LessonPlanResult | null>(null);
  const [activityNotes, setActivityNotes] = useState<Record<number, string>>({});
  const [sipaResult, setSipaResult] = useState<SIPAResult | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingSIPA, setIsGeneratingSIPA] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleUpdateActivityNote = async (index: number, note: string) => {
    setActivityNotes(prev => ({ ...prev, [index]: note }));
    if (lessonPlan && lessonPlan.id) {
      try {
        const docRef = doc(db, 'lesson_plans', lessonPlan.id);
        const updatedActivities = lessonPlan.practicalActivities?.map((act, i) => 
          i === index ? { ...act, professor_notes: note } : act
        );
        await updateDoc(docRef, { practicalActivities: updatedActivities });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `lesson_plans/${lessonPlan.id}`);
      }
    }
  };

  const handleGenerateSIPA = async () => {
    if (!selectedClassId || classData.length === 0) return;
    setIsGeneratingSIPA(true);
    try {
      // Simulated students at risk for now
      const studentsAtRisk = [
        { name: 'João Silva', level: 'Crítico', score: 35 },
        { name: 'Maria Oliveira', level: 'Atenção', score: 52 }
      ];
      const result = await generateSIPA(classData, studentsAtRisk, selectedModel, userProfile?.role as any || 'professor');
      setSipaResult(result);
      
      // Save to Firestore
      if (auth.currentUser) {
        await addDoc(collection(db, 'sipa_interventions'), {
          professor_id: auth.currentUser.uid,
          turma_id: selectedClassId,
          ...result,
          status: 'disparada',
          createdAt: serverTimestamp()
        });

        // Trigger n8n automation
        await n8nEvents.sipaIntervention({
          professorId: auth.currentUser.uid,
          turmaId: selectedClassId,
          intervention: result
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sipa_interventions');
    } finally {
      setIsGeneratingSIPA(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'classes');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;

    // Fetch submissions for this class (simulated by fetching all and filtering for now)
    // In a real app, submissions would have a classId
    const unsubscribe = onSnapshot(collection(db, 'exam_submissions'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Group by competency for the chart
      const competencyMap: Record<string, { total: number, count: number }> = {};
      
      data.forEach((sub: any) => {
        if (sub.competencyResults) {
          Object.keys(sub.competencyResults).forEach(comp => {
            if (!competencyMap[comp]) competencyMap[comp] = { total: 0, count: 0 };
            competencyMap[comp].total += sub.competencyResults[comp].acuracia * 100;
            competencyMap[comp].count += 1;
          });
        }
      });

      const chartData = Object.keys(competencyMap).map(comp => ({
        name: comp,
        avg: Math.round(competencyMap[comp].total / competencyMap[comp].count)
      }));

      setClassData(chartData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'exam_submissions');
    });

    return () => unsubscribe();
  }, [selectedClassId]);

  const handleGeneratePlan = async () => {
    if (!selectedClassId || classData.length === 0) return;
    setIsGeneratingPlan(true);
    try {
      const classDoc = classes.find(c => c.id === selectedClassId);
      const studentIds = classDoc?.studentIds || [];
      
      if (studentIds.length === 0) {
        toast.warning("A turma selecionada não possui alunos.");
        setIsGeneratingPlan(false);
        return;
      }

      // 1. Fetch submissions for these students
      const submissionsSnap = await getDocs(query(collection(db, 'exam_submissions'), where('studentId', 'in', studentIds.slice(0, 30))));
      const submissions = submissionsSnap.docs.map(doc => doc.data());

      // 2. Fetch diagnostics for these students
      const diagnosticsSnap = await getDocs(query(collection(db, 'diagnostics'), where('userId', 'in', studentIds.slice(0, 30))));
      const diagnostics = diagnosticsSnap.docs.map(doc => doc.data());

      // 3. Fetch cognitive analyses for these students
      const cognitiveSnap = await getDocs(query(collection(db, 'cognitive_error_analyses'), where('userId', 'in', studentIds.slice(0, 30))));
      const cognitiveAnalyses = cognitiveSnap.docs.map(doc => doc.data());

      // 4. Aggregate performance by competency from submissions and diagnostics
      const competencyStats: Record<string, { correct: number, total: number, errors: Set<string> }> = {};
      
      // From submissions
      submissions.forEach(sub => {
        if (sub.competencyResults) {
          Object.entries(sub.competencyResults).forEach(([comp, stats]: [string, any]) => {
            if (!competencyStats[comp]) competencyStats[comp] = { correct: 0, total: 0, errors: new Set() };
            competencyStats[comp].correct += stats.correct || 0;
            competencyStats[comp].total += stats.total || 0;
          });
        }
      });

      // From diagnostics
      diagnostics.forEach(diag => {
        if (diag.result?.diagnostico_por_competencia) {
          diag.result.diagnostico_por_competencia.forEach((comp: any) => {
            if (!competencyStats[comp.competencia]) competencyStats[comp.competencia] = { correct: 0, total: 0, errors: new Set() };
            competencyStats[comp.competencia].correct += comp.acertos || 0;
            competencyStats[comp.competencia].total += comp.total_questoes || 0;
            if (comp.conhecimentos_fracos) {
              comp.conhecimentos_fracos.forEach((err: string) => competencyStats[comp.competencia].errors.add(err));
            }
          });
        }
      });

      // From cognitive analyses
      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const questionMap: Record<string, string> = {};
      questionsSnapshot.docs.forEach(doc => {
        const q = doc.data();
        if (q.competency) questionMap[doc.id] = q.competency;
      });

      cognitiveAnalyses.forEach(analysis => {
        if (analysis.errors && Array.isArray(analysis.errors)) {
          analysis.errors.forEach((err: any) => {
            const competency = questionMap[err.questionId] || 'Geral';
            if (!competencyStats[competency]) competencyStats[competency] = { correct: 0, total: 0, errors: new Set() };
            if (err.explanation) competencyStats[competency].errors.add(err.explanation);
          });
        }
      });

      // 5. Prioritize competencies with lowest average scores
      const criticalCompetencies = Object.entries(competencyStats)
        .map(([competency, stats]) => ({
          competency,
          avgScore: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
          frequentErrors: Array.from(stats.errors)
        }))
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 3);

      // 6. Generate the plan using the AI service
      const planData = {
        totalStudents: studentIds.length,
        criticalCompetencies,
        submissionsCount: submissions.length,
        diagnosticsCount: diagnostics.length
      };

      const plan = await generateLessonPlan(planData, cognitiveAnalyses, selectedModel, userProfile?.role as any || 'professor');
      setLessonPlan(plan);
      
      // 7. Save to Firestore
      if (auth.currentUser) {
        await addDoc(collection(db, 'lesson_plans'), {
          userId: auth.currentUser.uid, // Matches blueprint
          professor_id: auth.currentUser.uid, // Keep for backward compatibility if any
          turma_id: selectedClassId,
          ...plan,
          createdAt: serverTimestamp() // Matches blueprint
        });
        
        // 8. Trigger n8n integration
        await n8nEvents.lessonPlanGenerated({
          professorId: auth.currentUser.uid,
          turmaId: selectedClassId,
          plan: plan
        });
        
        toast.success("Plano de aula gerado com sucesso!");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'lesson_plans');
      toast.error("Erro ao gerar plano de aula.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Class Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Análise de Turmas</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">Compare o desempenho coletivo e gere intervenções automáticas.</p>
            {auth.currentUser?.email && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                <Mail size={12} className="text-gray-400" />
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{auth.currentUser.email}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedClassId || ''} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.period}</option>
            ))}
          </select>
          <button 
            onClick={handleGenerateSIPA}
            disabled={isGeneratingSIPA || classData.length === 0}
            className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold text-sm hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {isGeneratingSIPA ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
            SIPA (Intervenção IA)
          </button>
          <button 
            onClick={handleGeneratePlan}
            disabled={isGeneratingPlan || classData.length === 0}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {isGeneratingPlan ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Gerar Plano de Aula IA
          </button>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Desempenho por Competência</h3>
            <p className="text-xs text-gray-500">Média da turma selecionada</p>
          </div>
          <BarChart3 className="text-emerald-600" size={20} />
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                {classData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.avg >= 75 ? '#10b981' : entry.avg >= 55 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SIPA Result */}
      <AnimatePresence>
        {sipaResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-3xl border border-amber-200 dark:border-amber-900/20 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900 dark:text-amber-400">{sipaResult.title}</h3>
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">Intervenção Pedagógica Automática (SIPA)</p>
                </div>
              </div>
              <button 
                onClick={() => setSipaResult(null)}
                className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-full text-amber-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-2">Gargalo Identificado</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                    {sipaResult.main_gap}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-2">Alunos Críticos</h4>
                  <div className="flex flex-wrap gap-2">
                    {sipaResult.critical_students.map((student, i) => (
                      <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold">
                        {student}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-2">Estratégia de Remediação</h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    {sipaResult.intervention_strategy.split('\n').map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="font-bold text-amber-600">{i + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} />
                    <span className="text-xs font-bold">Automação n8n disparada para coordenação</span>
                  </div>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Lesson Plan */}
      <AnimatePresence>
        {lessonPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl shadow-emerald-200 dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">{lessonPlan.title}</h3>
                <p className="text-xs text-emerald-100 italic">Plano de aula remediador gerado por IA</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Objetivos</h4>
                  <ul className="space-y-2">
                    {lessonPlan.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 size={16} className="mt-1 flex-shrink-0" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Tópicos para Revisão</h4>
                  <div className="flex flex-wrap gap-2">
                    {lessonPlan.topicsToReview?.map((topic, i) => (
                      <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-xs font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-emerald-200">Atividades Sugeridas</h4>
                  <ul className="space-y-3">
                    {lessonPlan.practicalActivities?.map((act, i) => (
                      <li key={i} className="p-3 bg-white/10 rounded-2xl text-sm flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-white/20 rounded-xl text-xs font-bold">{i + 1}</div>
                          <span className="font-bold">{act.name}</span>
                          <span className="text-xs bg-white/20 px-2 py-1 rounded-md">{act.duration}</span>
                        </div>
                        <p className="text-xs text-emerald-100 pl-10">{act.description}</p>
                        <textarea
                          placeholder="Adicionar observações para esta atividade..."
                          className="mt-2 w-full p-2 text-xs bg-white/10 rounded-lg border border-white/20 focus:ring-1 focus:ring-white outline-none"
                          value={activityNotes[i] || act.professor_notes || ''}
                          onChange={(e) => handleUpdateActivityNote(i, e.target.value)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts & Risk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/20">
          <div className="flex items-center gap-2 mb-4 text-red-700 dark:text-red-400">
            <AlertCircle size={18} />
            <h4 className="font-bold text-sm uppercase tracking-widest">Alunos em Risco</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
              <span className="text-xs font-medium">João Silva</span>
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-bold">CRÍTICO</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
              <span className="text-xs font-medium">Maria Oliveira</span>
              <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-bold">ATENÇÃO</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-400">
            <TrendingUp size={18} />
            <h4 className="font-bold text-sm uppercase tracking-widest">Tendência da Turma</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            A turma apresenta uma tendência de crescimento de <span className="font-bold text-blue-600">12%</span> em relação ao mês anterior. 
            A competência de <span className="font-bold">Interpretação de Esquemas</span> ainda é o principal gargalo, com média de <span className="font-bold">48%</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
