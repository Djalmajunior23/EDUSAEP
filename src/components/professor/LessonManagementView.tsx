import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Calendar, 
  BookOpen, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  Trash2, 
  Clock,
  Filter,
  Layout
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  getDocs,
  orderBy
} from 'firebase/firestore';
import { generateLessonPlan, LessonPlanResult } from '../../services/geminiService';
import { LessonPlan } from './LessonPlan';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function LessonManagementView({ userProfile, selectedModel }: { userProfile: any, selectedModel: string }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'lesson_plans'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlans(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'lesson_plans');
    });

    // Fetch classes for generation context
    const fetchClasses = async () => {
      const classesSnap = await getDocs(collection(db, 'classes'));
      const classesData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);
      if (classesData.length > 0) setSelectedClassId(classesData[0].id);
    };
    fetchClasses();

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja excluir este plano de aula?")) return;
    try {
      await deleteDoc(doc(db, 'lesson_plans', id));
      toast.success("Plano de aula excluído.");
      if (selectedPlan?.id === id) setSelectedPlan(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `lesson_plans/${id}`);
    }
  };

  const handleGenerate = async () => {
    if (!selectedClassId) {
      toast.error("Selecione uma turma para gerar o plano.");
      return;
    }

    setIsGenerating(true);
    try {
      const classDoc = classes.find(c => c.id === selectedClassId);
      const studentIds = (classDoc?.studentIds || []).filter(Boolean);
      
      if (studentIds.length === 0) {
        toast.warning("A turma selecionada não possui alunos.");
        setIsGenerating(false);
        return;
      }

      // Fetch context data (similar to ProfessorInsights)
      const submissionsSnap = await getDocs(query(collection(db, 'exam_submissions'), where('studentId', 'in', studentIds.slice(0, 30))));
      const submissions = submissionsSnap.docs.map(doc => doc.data());

      const diagnosticsSnap = await getDocs(query(collection(db, 'diagnostics'), where('userId', 'in', studentIds.slice(0, 30))));
      const diagnostics = diagnosticsSnap.docs.map(doc => doc.data());

      const cognitiveSnap = await getDocs(query(collection(db, 'cognitive_error_analyses'), where('userId', 'in', studentIds.slice(0, 30))));
      const cognitiveAnalyses = cognitiveSnap.docs.map(doc => doc.data());

      // Aggregate performance
      const competencyStats: Record<string, { correct: number, total: number, errors: Set<string> }> = {};
      submissions.forEach(sub => {
        if (sub.competencyResults) {
          Object.entries(sub.competencyResults).forEach(([comp, stats]: [string, any]) => {
            if (!competencyStats[comp]) competencyStats[comp] = { correct: 0, total: 0, errors: new Set() };
            competencyStats[comp].correct += stats.correct || 0;
            competencyStats[comp].total += stats.total || 0;
          });
        }
      });

      const criticalCompetencies = Object.entries(competencyStats)
        .map(([competency, stats]) => ({
          competency,
          avgScore: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
          frequentErrors: Array.from(stats.errors)
        }))
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 3);

      const planData = {
        totalStudents: studentIds.length,
        criticalCompetencies,
        submissionsCount: submissions.length,
        diagnosticsCount: diagnostics.length
      };

      const plan = await generateLessonPlan(planData, cognitiveAnalyses, selectedModel, userProfile?.role || 'TEACHER');
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'lesson_plans'), {
        userId: auth.currentUser?.uid,
        turma_id: selectedClassId,
        turma_nome: classDoc?.name,
        ...plan,
        createdAt: serverTimestamp()
      });

      toast.success("Plano de aula gerado com sucesso!");
      setSelectedPlan({ id: docRef.id, ...plan });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar plano de aula.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPlans = plans.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.turma_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Aulas</h2>
          <p className="text-sm text-gray-500">Planeje suas aulas com auxílio de IA baseada no desempenho real das turmas.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Selecionar Turma...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !selectedClassId}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Gerar Novo Plano IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: List of Plans */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar planos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-emerald-600" size={24} />
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <BookOpen className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm text-gray-500">Nenhum plano encontrado.</p>
              </div>
            ) : (
              filteredPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  layoutId={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "p-4 rounded-2xl border cursor-pointer transition-all group relative",
                    selectedPlan?.id === plan.id 
                      ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                      : "bg-white border-gray-100 hover:border-emerald-200 hover:shadow-md"
                  )}
                >
                  <button 
                    onClick={(e) => handleDelete(plan.id, e)}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {plan.turma_nome || 'Geral'}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {plan.createdAt?.seconds ? new Date(plan.createdAt.seconds * 1000).toLocaleDateString() : 'Recente'}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{plan.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{plan.objectives?.[0]}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Selected Plan Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedPlan ? (
              <motion.div
                key={selectedPlan.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Layout size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Visualização do Plano</h3>
                      <p className="text-xs text-gray-500">Editado em {selectedPlan.createdAt?.seconds ? new Date(selectedPlan.createdAt.seconds * 1000).toLocaleString() : 'agora'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all">
                      Exportar PDF
                    </button>
                    <button 
                      onClick={() => setSelectedPlan(null)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                </div>

                <LessonPlan plan={selectedPlan} />
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <Layout size={40} />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-lg font-bold text-gray-900">Nenhum plano selecionado</h3>
                  <p className="text-sm text-gray-500">Selecione um plano na lista ao lado ou gere um novo plano personalizado para sua turma.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
