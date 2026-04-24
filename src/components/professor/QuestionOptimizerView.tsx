import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  BarChart3, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  ChevronRight, 
  ArrowRight, 
  Target, 
  Settings,
  HelpCircle,
  FileText,
  Search,
  Filter,
  Loader2,
  Brain,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Check
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { analyzeQuestionQuality, QuestionQualityAnalysis } from '../../services/geminiService';
import { UserProfile, Question } from '../../types';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { toast } from 'sonner';

export function QuestionOptimizerView({ userProfile }: { userProfile: UserProfile | null }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<QuestionQualityAnalysis | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch all questions
    const qQuestions = query(collection(db, 'questions'));
    const unsubscribeQuestions = onSnapshot(qQuestions, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Question[];
      setQuestions(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'questions');
    });

    // Fetch all submissions to calculate real-time error rates
    const qSubmissions = query(collection(db, 'exam_submissions'));
    const unsubscribeSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'exam_submissions');
    });

    // Fetch cognitive analyses to get details on errors
    const qAnalyses = query(collection(db, 'cognitive_error_analyses'));
    const unsubscribeAnalyses = onSnapshot(qAnalyses, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnalyses(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'cognitive_error_analyses');
    });

    return () => {
      unsubscribeQuestions();
      unsubscribeSubmissions();
      unsubscribeAnalyses();
    };
  }, []);

  // Calculate high-error questions
  const questionPerformance = useMemo(() => {
    const stats: Record<string, { total: number, errors: number, errorDetails: any[] }> = {};

    submissions.forEach(sub => {
      // Find the corresponding exam to know which questions were asked
      // In this app, submissions have 'answers' array and 'score'.
      // However, we need to know WHICH question was wrong.
      // Usually, 'exam_submissions' should have a mapping.
      // If not fully implemented, we'll use 'cognitive_error_analyses' as the primary source of truth for errors.
    });

    // Strategy 2: Use cognitive_error_analyses which explicitly links errors to questions
    analyses.forEach(analysis => {
      analysis.errors?.forEach((err: any) => {
        const qId = err.questionId;
        if (!stats[qId]) {
          stats[qId] = { total: 0, errors: 0, errorDetails: [] };
        }
        stats[qId].errors++;
        stats[qId].errorDetails.push(err);
      });
    });

    // Also count total usage if possible (from questions.usoTotal)
    return stats;
  }, [submissions, analyses]);

  const rankedQuestions = useMemo(() => {
    return questions
      .map(q => {
        const perf = questionPerformance[q.id!] || questionPerformance[q.questionUid] || { errors: 0, errorDetails: [] };
        // We calculate an "Urgency Score" based on error count
        const errorCount = perf.errors;
        return {
          ...q,
          errorCount,
          errorDetails: perf.errorDetails,
          urgency: errorCount > 10 ? 'crítica' : errorCount > 5 ? 'alta' : errorCount > 0 ? 'moderada' : 'baixa'
        };
      })
      .filter(q => q.errorCount > 0)
      .filter(q => {
        const matchesSearch = q.enunciado.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             q.competenciaNome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'all' || q.dificuldade === filterDifficulty;
        return matchesSearch && matchesDifficulty;
      })
      .sort((a, b) => b.errorCount - a.errorCount);
  }, [questions, questionPerformance, searchTerm, filterDifficulty]);

  const handleOptimize = async (question: Question) => {
    setOptimizingId(question.id || null);
    setSelectedAnalysis(null);
    
    try {
      const perf = questionPerformance[question.id!] || questionPerformance[question.questionUid] || { errorDetails: [] };
      const result = await analyzeQuestionQuality(question, perf.errorDetails, "gemini-3-flash-preview", userProfile?.role as any || 'TEACHER');
      setSelectedAnalysis(result);
      toast.success("Análise de qualidade concluída!");
    } catch (error) {
      toast.error("Erro ao analisar a questão.");
    } finally {
      setOptimizingId(null);
    }
  };

  const handleApplyImprovements = async () => {
    if (!selectedAnalysis) return;

    try {
      const qRef = doc(db, 'questions', selectedAnalysis.questionId);
      const updates: any = {
        updatedAt: serverTimestamp()
      };

      if (selectedAnalysis.suggestedEnunciado) {
        updates.enunciado = selectedAnalysis.suggestedEnunciado;
      }
      
      if (selectedAnalysis.suggestedAlternativas && selectedAnalysis.suggestedAlternativas.length > 0) {
        updates.alternativas = selectedAnalysis.suggestedAlternativas;
      }

      await updateDoc(qRef, updates);
      toast.success("Melhorias aplicadas com sucesso!");
      setSelectedAnalysis(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `questions/${selectedAnalysis.questionId}`);
      toast.error("Erro ao aplicar melhorias.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
        <p className="text-gray-500 font-medium">Analisando banco de questões e desempenho...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="text-amber-500" size={32} />
            Otimizador de Questões
          </h1>
          <p className="text-gray-500 mt-2">
            Refine questões com alto índice de erro e baixa clareza pedagógica usando IA.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* List of Questions to Optimize */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={20} className="text-emerald-600" /> Itens Críticos
              </h3>
              <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                {rankedQuestions.length} questões
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar questão..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'fácil', 'médio', 'difícil'].map(d => (
                  <button
                    key={d}
                    onClick={() => setFilterDifficulty(d)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                      ${filterDifficulty === d ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {d === 'all' ? 'Tudo' : d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {rankedQuestions.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <CheckCircle2 className="mx-auto text-emerald-400 mb-2" size={24} />
                  <p className="text-xs text-gray-500">Nenhuma questão com erros significativos encontrada.</p>
                </div>
              ) : (
                rankedQuestions.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleOptimize(q)}
                    disabled={optimizingId === q.id}
                    className={`w-full text-left p-4 rounded-xl border transition-all group
                      ${selectedAnalysis?.questionId === q.id ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-gray-100 hover:border-amber-300 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                        ${q.urgency === 'crítica' ? 'bg-red-100 text-red-700' :
                          q.urgency === 'alta' ? 'bg-orange-100 text-orange-700' :
                          'bg-emerald-100 text-emerald-700'}`}>
                        {q.urgency}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
                        <AlertCircle size={12} className="text-red-500" />
                        {q.errorCount} erros
                      </div>
                    </div>
                    <p className="text-xs text-gray-800 line-clamp-2 mb-2 font-medium">
                      {q.enunciado}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="truncate">{q.competenciaNome}</span>
                      {optimizingId === q.id ? (
                        <Loader2 className="animate-spin text-amber-500" size={14} />
                      ) : (
                        <ChevronRight className="group-hover:translate-x-1 transition-transform" size={14} />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Optimization Analysis & Results */}
        <div className="xl:col-span-8">
          <AnimatePresence mode="wait">
            {!selectedAnalysis ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-20 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <Sparkles size={40} />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-gray-900">Selecione uma questão para otimizar</h3>
                  <p className="text-gray-500 mt-2">
                    A IA analisará o enunciado, os distratores e os erros dos alunos para sugerir uma reformulação pedagógica impecável.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Pedagogical Analysis */}
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                  <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                    <h3 className="font-bold text-amber-900 flex items-center gap-2">
                      <Brain size={20} className="text-amber-600" /> Análise Pedagógica da IA
                    </h3>
                    <div className="flex gap-2">
                      {selectedAnalysis.cognitiveErrorsAddressed.map(tag => (
                        <span key={tag} className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-700 shadow-sm border border-amber-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      "{selectedAnalysis.analysis}"
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedAnalysis.improvements.map((imp, i) => (
                        <div key={i} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-100">
                          <Check size={14} />
                          {imp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comparison View */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original */}
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 opacity-70">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Original</h4>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-600 line-clamp-4">
                        {selectedAnalysis.originalEnunciado}
                      </div>
                      <div className="space-y-2">
                        {selectedAnalysis.originalAlternativas.map(alt => (
                          <div key={alt.id} className="flex gap-3 text-xs bg-white/50 p-2 rounded-lg">
                            <span className="font-bold text-gray-400">{alt.id}</span>
                            <span className="text-gray-500">{alt.texto}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Refined (Sugestão) */}
                  <div className="bg-white rounded-2xl border-2 border-emerald-500 p-6 shadow-xl shadow-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} /> Sugestão Refinada
                      </h4>
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ALTA CLAREZA</span>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 text-sm text-gray-900 font-medium">
                        {selectedAnalysis.suggestedEnunciado || selectedAnalysis.originalEnunciado}
                      </div>
                      <div className="space-y-2">
                        {selectedAnalysis.suggestedAlternativas.map(alt => (
                          <div key={alt.id} className="flex gap-3 text-xs bg-white p-3 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                            <span className="font-bold text-emerald-600">{alt.id}</span>
                            <span className="text-gray-900">{alt.texto}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleApplyImprovements}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    <CheckCircle2 size={18} />
                    Aplicar Melhorias no Banco
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
