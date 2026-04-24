import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Brain, Loader2, BarChart3, Filter, FileText, Sparkles, Target, Send, BookOpen, Archive, ArchiveRestore, Eye, EyeOff } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDocs, getDoc, where, updateDoc, doc } from 'firebase/firestore';
import { analyzeCognitiveErrors, generateRecoveryPlan, RecoveryPlanResult, generateLessonPlan, LessonPlanResult } from '../../services/geminiService';
import { UserProfile } from '../../types';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { n8nEvents } from '../../services/n8nService';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function CognitiveErrorAnalysisView({ userProfile, selectedModel = "gemini-3-flash-preview" }: { userProfile: UserProfile | null, selectedModel?: string }) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingLessonPlan, setGeneratingLessonPlan] = useState(false);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlanResult | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlanResult | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!auth.currentUser || !userProfile) return;

    // Fetch submissions
    const subQuery = userProfile.role === 'STUDENT'
      ? query(collection(db, 'exam_submissions'), where('studentId', '==', auth.currentUser.uid))
      : query(collection(db, 'exam_submissions'));
    const unsubscribeSubs = onSnapshot(subQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'exam_submissions');
    });

    // Fetch existing analyses
    const analysisQuery = userProfile.role === 'STUDENT'
      ? query(collection(db, 'cognitive_error_analyses'), where('userId', '==', auth.currentUser.uid))
      : query(collection(db, 'cognitive_error_analyses'));
    const unsubscribeAnalyses = onSnapshot(analysisQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnalyses(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cognitive_error_analyses');
    });

    return () => {
      unsubscribeSubs();
      unsubscribeAnalyses();
    };
  }, [userProfile]);

  useEffect(() => {
    if (selectedStudent === 'all') {
      setRecoveryPlan(null);
      // Fetch latest lesson plan for the class
      const fetchLessonPlan = async () => {
        try {
          const q = query(collection(db, 'lesson_plans'));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            plans.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
            setLessonPlan(plans[0]);
          } else {
            setLessonPlan(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'lesson_plans');
        }
      };
      fetchLessonPlan();
      return;
    }

    setLessonPlan(null); // Clear lesson plan when a specific student is selected

    const fetchPlan = async () => {
      try {
        const q = query(collection(db, 'recovery_plans'), where('userId', '==', selectedStudent));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          // Get the most recent plan
          const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
          plans.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
          setRecoveryPlan(plans[0]);
        } else {
          setRecoveryPlan(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'recovery_plans');
      }
    };

    fetchPlan();
  }, [selectedStudent]);

  const handleGenerateAnalysis = async () => {
    if (submissions.length === 0) {
      toast.warning("Nenhuma submissão encontrada para análise.");
      return;
    }

    setAnalyzing(true);
    let newAnalysesCount = 0;

    try {
      // Find submissions that haven't been analyzed yet
      const unanalyzedSubs = submissions.filter(sub => !analyses.some(a => a.submissionId === sub.id));

      if (unanalyzedSubs.length === 0) {
        toast.info("Todas as submissões já foram analisadas.");
        setAnalyzing(false);
        return;
      }

      const examCache: Record<string, any> = {};

      for (const sub of unanalyzedSubs) {
        // Only analyze if the student got questions wrong
        if (sub.score < sub.maxScore) {
          // Fetch exam/exercise data if not in cache
          if (!examCache[sub.resourceId]) {
            const examDoc = await getDoc(doc(db, sub.type === 'exam' ? 'exams' : 'exercises', sub.resourceId));
            if (examDoc.exists()) {
              examCache[sub.resourceId] = examDoc.data();
            }
          }

          const exam = examCache[sub.resourceId];
          if (exam && exam.questions) {
            const result = await analyzeCognitiveErrors(sub, exam.questions, selectedModel, userProfile?.role as any || 'TEACHER');
            
            if (result.errors && result.errors.length > 0) {
              await addDoc(collection(db, 'cognitive_error_analyses'), {
                userId: sub.studentId,
                submissionId: sub.id,
                errors: result.errors,
                createdAt: serverTimestamp()
              });
              newAnalysesCount++;
            }
          }
        }
      }

      if (newAnalysesCount > 0) {
        toast.success(`${newAnalysesCount} novas análises geradas com sucesso!`);
      } else {
        toast.info("Nenhum erro novo encontrado para análise.");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cognitive_error_analyses');
      toast.error("Erro ao gerar análise de erros cognitivos.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleArchiveAnalysis = async (analysisId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'cognitive_error_analyses', analysisId), {
        archived: !currentStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(currentStatus ? "Análise restaurada com sucesso!" : "Análise arquivada com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cognitive_error_analyses/${analysisId}`);
      toast.error("Erro ao alterar status da análise.");
    }
  };

  const filteredAnalyses = analyses.filter(a => {
    const matchesStudent = selectedStudent === 'all' || a.userId === selectedStudent;
    const matchesArchived = showArchived ? true : !a.archived;
    return matchesStudent && matchesArchived;
  });

  const handleGeneratePlan = async () => {
    if (selectedStudent === 'all') {
      toast.warning("Selecione um aluno específico para gerar o plano de recuperação.");
      return;
    }

    const studentAnalyses = analyses.filter(a => a.userId === selectedStudent && !a.archived);
    if (studentAnalyses.length === 0) {
      toast.warning("Nenhuma análise ativa encontrada para este aluno.");
      return;
    }

    setGeneratingPlan(true);
    try {
      // Fetch student info for n8n notification
      const studentDoc = await getDoc(doc(db, 'users', selectedStudent));
      const studentInfo = studentDoc.exists() ? studentDoc.data() : null;

      // Aggregate errors for the student
      const aggregatedErrors = studentAnalyses.reduce((acc, curr) => {
        return acc.concat(curr.errors || []);
      }, []);

      const studentData = {
        studentId: selectedStudent,
        studentName: studentInfo?.displayName || 'Aluno',
        totalErrors: aggregatedErrors.length,
        errors: aggregatedErrors
      };

      const plan = await generateRecoveryPlan(studentData, selectedModel, userProfile?.role as any || 'TEACHER');
      setRecoveryPlan(plan);
      
      // Save the plan to Firestore
      await addDoc(collection(db, 'recovery_plans'), {
        userId: selectedStudent,
        studentName: studentInfo?.displayName || 'Aluno',
        ...plan,
        createdAt: serverTimestamp()
      });

      // Trigger n8n automation automatically
      await n8nEvents.recoveryPlanGenerated({
        studentId: selectedStudent,
        studentEmail: studentInfo?.email,
        studentName: studentInfo?.displayName,
        submissionId: 'auto_generated',
        plan: plan
      });

      toast.success("Plano de recuperação gerado e enviado ao n8n!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'recovery_plans');
      toast.error("Erro ao gerar plano de recuperação.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleNotifyN8N = async () => {
    if (!recoveryPlan) return;
    
    try {
      // Fetch student info for n8n notification
      const studentDoc = await getDoc(doc(db, 'users', recoveryPlan.studentId));
      const studentInfo = studentDoc.exists() ? studentDoc.data() : null;

      await n8nEvents.recoveryPlanGenerated({
        studentId: recoveryPlan.studentId,
        studentEmail: studentInfo?.email,
        studentName: studentInfo?.displayName,
        submissionId: 'manual_trigger',
        plan: recoveryPlan
      });
      toast.success("Plano enviado para automação (n8n) com sucesso!");
    } catch (error) {
      toast.error("Erro ao notificar via n8n.");
    }
  };

  const handleGenerateLessonPlan = async () => {
    const activeAnalyses = analyses.filter(a => !a.archived);
    if (activeAnalyses.length === 0) {
      toast.warning("Nenhuma análise ativa encontrada para a turma.");
      return;
    }

    setGeneratingLessonPlan(true);
    try {
      // Aggregate all errors from active analyses
      const aggregatedErrors = activeAnalyses.reduce((acc, curr) => {
        return acc.concat(curr.errors || []);
      }, []);

      const classData = {
        totalStudents: uniqueStudents.length,
        totalErrors: aggregatedErrors.length,
        errors: aggregatedErrors
      };

      const plan = await generateLessonPlan(classData, [], selectedModel, userProfile?.role as any || 'TEACHER');
      setLessonPlan(plan);
      
      // Save the plan to Firestore
      await addDoc(collection(db, 'lesson_plans'), {
        userId: auth.currentUser?.uid,
        ...plan,
        createdAt: serverTimestamp()
      });

      // Trigger n8n automation automatically
      await n8nEvents.lessonPlanGenerated({
        professorId: auth.currentUser?.uid || '',
        turmaId: 'turma_geral', // Could be dynamic if turma selection is added
        plan: plan
      });

      toast.success("Plano de aula gerado e enviado ao n8n!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'lesson_plans');
      toast.error("Erro ao gerar plano de aula.");
    } finally {
      setGeneratingLessonPlan(false);
    }
  };

  // Process data for charts
  const processChartData = () => {
    const errorCounts: Record<string, number> = {
      'conceitual': 0,
      'interpretação': 0,
      'distração': 0,
      'execução': 0
    };

    let filteredAnalyses = analyses;
    if (selectedStudent !== 'all') {
      filteredAnalyses = filteredAnalyses.filter(a => a.userId === selectedStudent);
    }

    filteredAnalyses.forEach(analysis => {
      analysis.errors?.forEach((err: any) => {
        if (errorCounts[err.category] !== undefined) {
          errorCounts[err.category]++;
        }
      });
    });

    return Object.keys(errorCounts).map(key => ({
      name: key,
      value: errorCounts[key]
    }));
  };

  const chartData = processChartData();
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  // Get unique students for filter
  const uniqueStudents = Array.from(new Set(analyses.map(a => a.userId)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="text-emerald-600" size={32} />
            Análise de Erros Cognitivos
          </h1>
          <p className="text-gray-500 mt-2">
            Identifique as raízes das dificuldades dos alunos para intervenções precisas.
          </p>
        </div>
        <button
          onClick={handleGenerateAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {analyzing ? 'Analisando...' : 'Gerar Novas Análises'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Filter size={20} className="text-emerald-600" /> Filtros
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aluno</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">Todos os Alunos</option>
                  {uniqueStudents.map(id => (
                    <option key={id} value={id}>Aluno ID: {id.substring(0, 8)}...</option>
                  ))}
                </select>
              </div>

              {selectedStudent !== 'all' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {generatingPlan ? <Loader2 className="animate-spin" size={18} /> : <Target size={18} />}
                    {generatingPlan ? 'Gerando Plano...' : 'Gerar Plano de Recuperação'}
                  </button>
                </div>
              )}

              {selectedStudent === 'all' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleGenerateLessonPlan}
                    disabled={generatingLessonPlan}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {generatingLessonPlan ? <Loader2 className="animate-spin" size={18} /> : <BookOpen size={18} />}
                    {generatingLessonPlan ? 'Gerando Plano...' : 'Gerar Plano de Aula da Turma'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Total de Análises</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{analyses.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Erros Mapeados</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {analyses.reduce((acc, curr) => acc + (curr.errors?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-600" /> Frequência de Erros por Categoria
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Plan Section */}
      {recoveryPlan && selectedStudent !== 'all' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-blue-100 bg-blue-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <Target size={20} className="text-blue-600" /> Plano de Recuperação Individualizado
              </h3>
              <p className="text-sm text-blue-700 mt-1">Aluno ID: {selectedStudent.substring(0, 8)}...</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${recoveryPlan.riskLevel === 'Baixo' ? 'bg-emerald-100 text-emerald-700' :
                  recoveryPlan.riskLevel === 'Médio' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                Risco: {recoveryPlan.riskLevel}
              </span>
              <button
                onClick={handleNotifyN8N}
                className="flex items-center gap-2 bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                <Send size={16} /> Notificar (n8n)
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Resumo do Diagnóstico</h4>
              <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                {recoveryPlan.summary}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Atividades Recomendadas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recoveryPlan.recommendedActivities?.map((activity, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase">
                        {activity.competency}
                      </span>
                      <span className="text-xs font-medium text-gray-500">{activity.activityType}</span>
                    </div>
                    <p className="text-sm text-gray-700">{activity.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Intervenções Sugeridas para o Professor</h4>
              <ul className="space-y-2">
                {recoveryPlan.professorInterventions?.map((intervention, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {intervention}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lesson Plan Section */}
      {lessonPlan && selectedStudent === 'all' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600" /> Plano de Aula: {lessonPlan.title}
              </h3>
              <p className="text-sm text-indigo-700 mt-1">Focado nas dificuldades comuns da turma</p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Objetivos da Aula</h4>
              <ul className="space-y-2">
                {lessonPlan.objectives?.map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Tópicos para Revisão</h4>
              <div className="flex flex-wrap gap-2">
                {lessonPlan.topicsToReview?.map((topic, idx) => (
                  <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-sm font-medium">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Atividades Práticas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lessonPlan.practicalActivities?.map((activity, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{activity.name}</span>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{activity.duration}</span>
                    </div>
                    <p className="text-sm text-gray-700">{activity.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Materiais Sugeridos</h4>
                <ul className="space-y-2">
                  {lessonPlan.suggestedMaterials?.map((material, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                      {material}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" /> Insights da IA
                </h4>
                <p className="text-sm text-gray-700 bg-amber-50 p-4 rounded-xl border border-amber-100/50 leading-relaxed">
                  {lessonPlan.aiInsights}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Detailed Report */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-emerald-600" /> Relatório Detalhado
          </h3>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${showArchived ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {showArchived ? <Eye size={16} /> : <EyeOff size={16} />}
            {showArchived ? 'Ocultar Arquivados' : 'Mostrar Arquivados'}
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredAnalyses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {showArchived ? "Nenhuma análise encontrada nos arquivos." : "Nenhuma análise ativa gerada ainda."}
            </div>
          ) : (
            filteredAnalyses.map((analysis) => (
              <div key={analysis.id} className={`p-6 hover:bg-gray-50 transition-colors ${analysis.archived ? 'opacity-60 bg-gray-50/50' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      {analysis.userId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">Aluno ID: {analysis.userId.substring(0, 8)}...</p>
                        {analysis.archived && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase">Arquivado</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Submissão: {analysis.submissionId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-gray-400">
                      {new Date(analysis.createdAt?.toDate()).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleArchiveAnalysis(analysis.id, analysis.archived)}
                      className={`p-2 rounded-lg transition-colors ${analysis.archived ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                      title={analysis.archived ? "Restaurar" : "Arquivar"}
                    >
                      {analysis.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 pl-13">
                  {analysis.errors?.map((err: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${err.category === 'interpretação' ? 'bg-blue-100 text-blue-700' :
                            err.category === 'conceitual' ? 'bg-emerald-100 text-emerald-700' :
                            err.category === 'distração' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {err.category}
                        </span>
                        <span className="text-xs text-gray-500">Questão ID: {err.questionId}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Diagnóstico:</span> {err.explanation}</p>
                      {err.explicacao_detalhada && (
                        <p className="text-xs text-gray-600 mb-3 italic leading-relaxed">
                          {err.explicacao_detalhada}
                        </p>
                      )}
                      {(err.sugestao_intervencao || err.suggested_fix) && (
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100/50">
                          <p className="text-sm text-emerald-700 font-medium flex items-center gap-1 mb-1">
                            <Sparkles size={14}/> Intervenção Sugerida:
                          </p>
                          <p className="text-sm text-emerald-800">
                            {err.sugestao_intervencao || err.suggested_fix}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
