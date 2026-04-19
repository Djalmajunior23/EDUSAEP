import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Loader2, BookOpen, Target, Sparkles, Wand2, Download, ExternalLink, Calendar,
  CheckCircle2, Triangle, Lightbulb, ArrowRight, Save, User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, query, where, getDocs, updateDoc, doc, limit, orderBy, onSnapshot, addDoc, serverTimestamp
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { pdfExportService } from '../../services/pdfExportService';
import { generateContentWrapper, DEFAULT_CONFIG, safeParseJson } from '../../services/geminiService';
import { Type } from '@google/genai';
import { Question, Exam, ExamSubmission, StudyPlan, UserProfile } from '../../types';

interface StudyPlanViewProps {
  user: User | null;
  userProfile: UserProfile | null;
  selectedModel: string;
}

export function StudyPlanView({ user, userProfile, selectedModel }: StudyPlanViewProps) {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingTips, setGeneratingTips] = useState(false);
  const [generatingRefined, setGeneratingRefined] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);
  const [savingDetails, setSavingDetails] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'exam_submissions'), where('studentId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'study_plans'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setStudyPlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StudyPlan);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'study_plans');
    });
    return () => unsubscribe();
  }, [user]);

  const refineSuggestions = async () => {
    if (!studyPlan || !user) return;
    setGeneratingRefined(true);
    try {
      const prompt = `Como um tutor educacional especialista no SAEP, gere um novo conjunto de 3 Tópicos Prioritários para estudo, mais específicos e detalhados.
      
      FRAQUEZAS GERAIS (Competências): ${studyPlan.weaknesses.join(', ')}
      CONHECIMENTOS ESPECÍFICOS FRÁGEIS: ${studyPlan.detailedWeaknesses?.join(', ') || 'Não detalhados'}
      TÓPICOS ANTERIORES SUGERIDOS: ${studyPlan.priorityTopics.map(t => `${t.topic} (${t.reason})`).join('; ')}
      
      OBJETIVO:
      Aprofundar nas fraquezas e sugerir tópicos mais granulares, técnicos e específicos que os anteriores. 
      As sugestões devem ser acionáveis e focadas em superar os conhecimentos específicos frágeis.
      
      RETORNE APENAS UM JSON NO FORMATO:
      {
        "priorityTopics": [
          { "topic": "Nome do Tópico Específico", "reason": "Por que estudar isso agora?", "priority": "Alta" | "Média" | "Baixa" }
        ]
      }`;

      const response = await generateContentWrapper({
        model: selectedModel,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          ...DEFAULT_CONFIG,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priorityTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    priority: { type: Type.STRING }
                  },
                  required: ["topic", "reason", "priority"]
                }
              }
            },
            required: ["priorityTopics"]
          }
        }
      });

      const aiData = safeParseJson(response.text, {});
      
      if (aiData.priorityTopics && studyPlan.id) {
        await updateDoc(doc(db, 'study_plans', studyPlan.id), {
          priorityTopics: aiData.priorityTopics
        });
        toast.success("Sugestões refinadas com sucesso!");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `study_plans/${studyPlan?.id}`);
    } finally {
      setGeneratingRefined(false);
    }
  };

  const saveDetails = async (topicIndex: number, details: string) => {
    if (!studyPlan) return;
    setSavingDetails(`${topicIndex}`);
    try {
      const newTopics = [...studyPlan.priorityTopics];
      newTopics[topicIndex].details = details;
      await updateDoc(doc(db, 'study_plans', studyPlan.id), { priorityTopics: newTopics });
      toast.success("Detalhes salvos!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `study_plans/${studyPlan.id}`);
    } finally {
      setSavingDetails(null);
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const filename = `Plano_Estudos_${user?.uid || 'aluno'}`;
      await pdfExportService.exportElementToPDF(reportRef.current, filename);
      toast.success("PDF exportado com sucesso!");
    } catch (err: any) {
      toast.error(`Erro ao exportar PDF: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const generatePlan = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      // 1. Fetch performance data
      const submissionsQuery = query(collection(db, 'exam_submissions'), where('studentId', '==', user.uid));
      const diagnosticsQuery = query(collection(db, 'diagnostics'), where('userId', '==', user.uid));
      
      const [submissionsSnap, diagnosticsSnap, questionsSnap, examsSnap] = await Promise.all([
        getDocs(submissionsQuery),
        getDocs(diagnosticsQuery),
        getDocs(query(collection(db, 'questions'), limit(100))),
        getDocs(query(collection(db, 'exams'), limit(20)))
      ]);

      const submissions = submissionsSnap.docs.map(doc => doc.data() as ExamSubmission);
      const diagnostics = diagnosticsSnap.docs.map(doc => doc.data());
      const availableQuestions = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      const availableExams = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));

      if (submissions.length === 0 && diagnostics.length === 0) {
        toast.error("Você precisa realizar pelo menos um simulado ou ter um diagnóstico importado para gerar um plano de estudos.");
        setGenerating(false);
        return;
      }

      // Aggregate Stats
      const competencyStats: { [key: string]: { correct: number, total: number } } = {};
      submissions.forEach(sub => {
        Object.entries(sub.competencyResults || {}).forEach(([comp, stats]) => {
          if (!competencyStats[comp]) competencyStats[comp] = { correct: 0, total: 0 };
          competencyStats[comp].correct += stats.correct;
          competencyStats[comp].total += stats.total;
        });
      });

      diagnostics.forEach(diag => {
        (diag.result?.diagnostico_por_competencia || []).forEach((comp: any) => {
          if (!competencyStats[comp.competencia]) competencyStats[comp.competencia] = { correct: 0, total: 0 };
          competencyStats[comp.competencia].correct += comp.acertos;
          competencyStats[comp.competencia].total += comp.total_questoes;
        });
      });

      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const competencyAnalysis: any[] = [];
      Object.entries(competencyStats).forEach(([comp, stats]) => {
        const accuracy = stats.correct / stats.total;
        competencyAnalysis.push({ competency: comp, accuracy, ...stats });
        if (accuracy >= 0.75) strengths.push(comp);
        else if (accuracy < 0.6) weaknesses.push(comp);
      });

      // Gemini AI Plan Generation
      const prompt = `Como um tutor educacional especialista, gere um plano de estudos ADAPTATIVO e PERSONALIZADO.
      PERFIL DO ALUNO:
      - Pontos Fortes: ${strengths.join(', ')}
      - Pontos Fracos: ${weaknesses.join(', ')}
      - Análise: ${JSON.stringify(competencyAnalysis)}
      
      RETORNE APENAS JSON NO FORMATO:
      {
        "priorityTopics": [{ "topic": "String", "reason": "String", "priority": "Alta" | "Média" | "Baixa" }],
        "recommendedExercises": [{ "id": "String", "title": "String", "competency": "String" }],
        "recommendations": ["String"]
      }`;

      const response = await generateContentWrapper({
        model: selectedModel,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          ...DEFAULT_CONFIG,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priorityTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    priority: { type: Type.STRING }
                  }
                }
              },
              recommendedExercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    competency: { type: Type.STRING }
                  }
                }
              },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const aiData = safeParseJson(response.text, {});
      
      const newPlan = {
        userId: user.uid,
        createdAt: serverTimestamp(),
        strengths,
        weaknesses,
        detailedWeaknesses: [],
        competencyAnalysis,
        ...aiData
      };

      await addDoc(collection(db, 'study_plans'), newPlan);
      toast.success("Plano de estudos gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar plano.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Target className="text-emerald-600" size={32} /> Rota de Excelência
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Inteligência adaptativa aplicada ao seu percurso acadêmico.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={generatePlan}
            disabled={generating}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
            {studyPlan ? 'Atualizar Roadmap' : 'Gerar Meu Plano'}
          </button>
          {studyPlan && (
            <button 
              onClick={exportToPDF}
              disabled={isExporting}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              Exportar Plano
            </button>
          )}
        </div>
      </div>

      {!studyPlan ? (
        <div className="bg-white dark:bg-gray-800 rounded-[32px] p-20 text-center border border-dashed border-gray-200 dark:border-gray-700 space-y-6">
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto text-emerald-600">
            <Sparkles size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Seu Plano está pronto para ser criado</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Nossa IA analisará seus micro-dados de desempenho para traçar a melhor rota até o topo.</p>
          </div>
          <button onClick={generatePlan} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">
            Começar Agora
          </button>
        </div>
      ) : (
        <div ref={reportRef} className="space-y-10">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 text-emerald-600 mb-2">
                  <CheckCircle2 size={24} />
                   <span className="text-xs font-black uppercase tracking-widest">Fortalezas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {studyPlan.strengths.map(s => (
                    <span key={s} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold">{s}</span>
                  ))}
                </div>
             </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 text-rose-500 mb-2">
                  <Triangle size={24} className="rotate-180" />
                   <span className="text-xs font-black uppercase tracking-widest">Oportunidades</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {studyPlan.weaknesses.map(w => (
                    <span key={w} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-bold">{w}</span>
                  ))}
                </div>
             </div>
             <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 dark:shadow-none">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar size={24} />
                   <span className="text-xs font-black uppercase tracking-widest">Próxima Meta</span>
                </div>
                <h4 className="text-xl font-bold">Aumentar 15% em Geometria</h4>
             </div>
          </div>

          {/* Priority Topics */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight"> Roadmap de Conhecimento</h3>
              <button 
                onClick={refineSuggestions}
                disabled={generatingRefined}
                className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 hover:underline"
              >
                {generatingRefined ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Refinar Sugestões IA
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {studyPlan.priorityTopics.map((topic, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                   <div className="p-8 flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            topic.priority === 'Alta' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>Prioridade {topic.priority}</span>
                          <h4 className="text-xl font-bold dark:text-white">{topic.topic}</h4>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{topic.reason}</p>
                        <div className="flex flex-wrap gap-4 pt-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                             <Target size={14} /> Foco Teórico
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                             <BookOpen size={14} /> 5 Materiais Disponíveis
                          </div>
                        </div>
                      </div>
                      <div className="md:w-72 bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Minhas Notas de Estudo</label>
                        <textarea 
                          defaultValue={topic.details || ''}
                          onBlur={(e) => saveDetails(i, e.target.value)}
                          placeholder="Anote links, dúvidas ou progressos aqui..."
                          className="w-full h-32 bg-white dark:bg-gray-800 border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none dark:text-white"
                        />
                        {savingDetails === `${i}` && <div className="text-[10px] text-emerald-500 font-bold animate-pulse">Salvando...</div>}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             {/* Recommendations */}
             <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Lightbulb className="text-amber-500" /> Dicas Estratégicas
                  </h3>
                </div>
                <div className="space-y-4">
                  {studyPlan.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 group">
                      <div className="shrink-0 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center font-black text-emerald-600 text-xs shadow-sm">
                        {i + 1}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
             </div>

             {/* Recommended Resources */}
             <div className="space-y-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2 px-2">
                  <BookOpen className="text-indigo-600" /> Prática Sugerida
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {studyPlan.recommendedExercises?.map((ex, i) => (
                    <button 
                      key={i}
                      className="text-left w-full p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl hover:border-emerald-500 transition-all group flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{ex.competency}</span>
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{ex.title}</h4>
                      </div>
                      <ArrowRight size={20} className="text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
