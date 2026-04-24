import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, 
  Plus, 
  Search, 
  Clock, 
  Brain, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Trophy,
  Sparkles,
  Gamepad2,
  Trash2,
  Play
} from 'lucide-react';
import { quizService } from '../../services/quizService';
import { gamificationService } from '../../services/gamificationService';
import { useAuth } from '../../contexts/AuthContext';
import { InteractiveQuiz, QuizAttempt } from '../../types';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { generateSmartContent } from '../../services/aiService';

export function InteractiveQuizView() {
  const { user, isProfessor } = useAuth();
  const [quizzes, setQuizzes] = useState<InteractiveQuiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'take' | 'create'>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<InteractiveQuiz | null>(null);
  
  // Take Quiz State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);

  // Create Quiz State
  const [newQuiz, setNewQuiz] = useState<Partial<InteractiveQuiz>>({
    title: '',
    description: '',
    questions: []
  });
  const [generatingWithAI, setGeneratingWithAI] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const qList = await quizService.getQuizzesByClass('all'); // Simplified for now
      setQuizzes(qList);
      if (!isProfessor) {
        const aList = await quizService.getAttemptsByStudent(user.uid);
        setAttempts(aList);
      }
    } catch (err) {
      toast.error('Erro ao carregar dados dos quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz: InteractiveQuiz) => {
    setSelectedQuiz(quiz);
    setUserAnswers(new Array(quiz.questions.length).fill(-1));
    setCurrentQuestionIdx(0);
    setQuizFinished(false);
    setActiveView('take');
  };

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setUserAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (!selectedQuiz || !user?.uid) return;
    
    const score = userAnswers.reduce((acc, ans, idx) => {
      return acc + (ans === selectedQuiz.questions[idx].correctAnswer ? 1 : 0);
    }, 0);

    const attempt: Omit<QuizAttempt, 'id' | 'completedAt'> = {
      quizId: selectedQuiz.id!,
      studentId: user.uid,
      answers: userAnswers,
      score,
      feedback: `Você acertou ${score} de ${selectedQuiz.questions.length} questões.`
    };

    try {
      await quizService.submitAttempt(attempt);
      await gamificationService.awardPoints(user.uid, 50, 50); // Award 50 XP/Points
      setQuizFinished(true);
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar sua participação.');
    }
  };

  const handleCreateWithAI = async () => {
    setGeneratingWithAI(true);
    try {
      const prompt = `Gere um quiz interativo sobre ${newQuiz.title || 'assunto geral'} com 5 questões de múltipla escolha. 
      Formato JSON esperado: { "questions": [ { "question": "texto", "options": ["a", "b", "c", "d"], "correctAnswer": 0, "type": "multiple" } ] }`;
      
      const response = await generateSmartContent({
        prompt,
        task: 'pedagogical_gen',
        responseFormat: 'json'
      });
      const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      setNewQuiz(prev => ({ 
        ...prev, 
        questions: data.questions.map((q: any, i: number) => ({ ...q, id: `q-${i}` }))
      }));
      toast.success('Questões geradas com IA!');
    } catch (err) {
      toast.error('Erro ao gerar questões com IA.');
    } finally {
      setGeneratingWithAI(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!newQuiz.title || !newQuiz.questions?.length || !user?.uid) {
      toast.error('Preencha os dados básicos do quiz.');
      return;
    }

    try {
      await quizService.createQuiz({
        title: newQuiz.title!,
        description: newQuiz.description || '',
        teacherId: user.uid,
        questions: newQuiz.questions as any,
        isActive: true
      });
      toast.success('Quiz criado com sucesso!');
      setActiveView('list');
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar quiz.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {activeView === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                  <Gamepad2 className="text-emerald-600" /> Quizzes Interativos
                </h2>
                <p className="text-gray-500 font-medium">Aprenda jogando e ganhe XP.</p>
              </div>
              {isProfessor && (
                <button 
                  onClick={() => setActiveView('create')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                >
                  <Plus size={20} /> Criar Quiz
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Puzzle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold">Nenhum quiz ativo no momento.</p>
                </div>
              ) : quizzes.map((quiz) => {
                const hasAttempt = attempts.find(a => a.quizId === quiz.id);
                return (
                  <motion.div 
                    key={quiz.id}
                    whileHover={{ y: -8 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate pr-6">{quiz.title}</h3>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10">{quiz.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                          <Clock size={12} /> 5 MIN
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <Brain size={12} /> {quiz.questions.length} QUESTÕES
                        </div>
                      </div>
                      
                      {hasAttempt ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                          <CheckCircle2 size={16} /> Finalizado
                        </div>
                      ) : (
                        <button 
                          onClick={() => startQuiz(quiz)}
                          className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                        >
                          <Play size={20} fill="currentColor" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeView === 'take' && selectedQuiz && (
          <motion.div 
            key="take"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto space-y-8"
          >
            {quizFinished ? (
              <div className="text-center bg-white p-12 rounded-3xl border border-gray-100 shadow-2xl space-y-6">
                <div className="w-24 h-24 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-500 mx-auto animate-bounce">
                  <Trophy size={48} />
                </div>
                <h2 className="text-3xl font-black text-gray-900">Quiz Finalizado!</h2>
                <div className="flex flex-col gap-2">
                  <p className="text-gray-500 font-medium">Você acertou</p>
                  <p className="text-6xl font-black text-emerald-600">
                    {userAnswers.reduce((acc, ans, idx) => acc + (ans === selectedQuiz.questions[idx].correctAnswer ? 1 : 0), 0)}
                  </p>
                  <p className="text-gray-500 font-medium">de {selectedQuiz.questions.length} questões</p>
                </div>
                <div className="pt-6">
                  <button 
                    onClick={() => setActiveView('list')}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all uppercase tracking-widest text-sm"
                  >
                    Voltar aos Quizzes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setActiveView('list')} className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-600 transition-colors">Abortar Quiz</button>
                  <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{currentQuestionIdx + 1} DE {selectedQuiz.questions.length}</div>
                </div>
                
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIdx) / selectedQuiz.questions.length) * 100}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-8">
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">
                    {selectedQuiz.questions[currentQuestionIdx].question}
                  </h3>

                  <div className="space-y-4">
                    {selectedQuiz.questions[currentQuestionIdx].options.map((option, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={cn(
                          "w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                          userAnswers[currentQuestionIdx] === idx 
                            ? "border-emerald-600 bg-emerald-50" 
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        <span className={cn(
                          "font-bold text-lg",
                          userAnswers[currentQuestionIdx] === idx ? "text-emerald-900" : "text-gray-700"
                        )}>
                          {option}
                        </span>
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          userAnswers[currentQuestionIdx] === idx 
                            ? "bg-emerald-600 border-emerald-600" 
                            : "border-gray-200 group-hover:border-gray-300"
                        )}>
                          {userAnswers[currentQuestionIdx] === idx && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  {currentQuestionIdx > 0 && (
                    <button 
                      onClick={() => setCurrentQuestionIdx(idx => idx - 1)}
                      className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold flex-1"
                    >
                      Anterior
                    </button>
                  )}
                  {currentQuestionIdx < selectedQuiz.questions.length - 1 ? (
                    <button 
                      onClick={() => setCurrentQuestionIdx(idx => idx + 1)}
                      disabled={userAnswers[currentQuestionIdx] === -1}
                      className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex-1 disabled:opacity-50 shadow-lg shadow-emerald-100"
                    >
                      Próxima
                    </button>
                  ) : (
                    <button 
                      onClick={submitQuiz}
                      disabled={userAnswers[currentQuestionIdx] === -1}
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex-1 disabled:opacity-50 shadow-lg shadow-indigo-100"
                    >
                      Finalizar Quiz
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeView === 'create' && (
          <motion.div 
            key="create"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto pb-20"
          >
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setActiveView('list')}
                className="text-sm font-bold text-gray-500 flex items-center gap-2 hover:text-emerald-600 transition-colors"
              >
                Voltar aos Quizzes
              </button>
              <h2 className="text-2xl font-black text-gray-900">Novo Quiz</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Título do Quiz</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Revisão de Estrutura de Repetição"
                      value={newQuiz.title}
                      onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Descrição</label>
                    <textarea 
                      placeholder="Breve resumo para os alunos..."
                      value={newQuiz.description}
                      onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[100px]"
                    />
                  </div>
                  <button 
                    onClick={handleCreateWithAI}
                    disabled={generatingWithAI}
                    className="w-full py-4 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all disabled:opacity-50"
                  >
                    {generatingWithAI ? <span className="animate-spin text-lg">⚙️</span> : <Sparkles size={16} />} 
                    GERAR QUESTÕES COM IA
                  </button>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                  <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><Trophy size={16} /> Recompensa</h4>
                  <p className="text-xs text-amber-800 leading-relaxed opacity-80">Este quiz renderá automaticamente 50 XP base para o aluno ao ser finalizado.</p>
                </div>

                <button 
                  onClick={handleSaveQuiz}
                  className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  Publicar Quiz
                </button>
              </div>

              {/* Questions List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-lg font-black text-gray-900">Questões ({newQuiz.questions?.length})</h3>
                  <button 
                    onClick={() => {
                      const q: any = { id: `q-${Date.now()}`, question: 'Nova Pergunta', options: ['', '', '', ''], correctAnswer: 0, type: 'multiple' };
                      setNewQuiz(prev => ({ ...prev, questions: [...(prev.questions || []), q] }));
                    }}
                    className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {newQuiz.questions?.map((q, idx) => (
                  <div key={q.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <textarea 
                          value={q.question}
                          onChange={(e) => {
                            const qs = [...(newQuiz.questions || [])];
                            qs[idx].question = e.target.value;
                            setNewQuiz(prev => ({ ...prev, questions: qs }));
                          }}
                          className="w-full p-2 bg-transparent border-b border-dashed border-gray-200 focus:border-emerald-500 outline-none font-bold text-lg"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const qs = [...(newQuiz.questions || [])];
                          qs.splice(idx, 1);
                          setNewQuiz(prev => ({ ...prev, questions: qs }));
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              const qs = [...(newQuiz.questions || [])];
                              qs[idx].correctAnswer = oIdx;
                              setNewQuiz(prev => ({ ...prev, questions: qs }));
                            }}
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                              q.correctAnswer === oIdx 
                                ? "bg-emerald-500 text-white" 
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            )}
                          >
                            <span className="text-[10px] font-black">{String.fromCharCode(65 + oIdx)}</span>
                          </button>
                          <input 
                            type="text" 
                            value={opt}
                            onChange={(e) => {
                              const qs = [...(newQuiz.questions || [])];
                              qs[idx].options[oIdx] = e.target.value;
                              setNewQuiz(prev => ({ ...prev, questions: qs }));
                            }}
                            placeholder={`Opção ${oIdx + 1}`}
                            className={cn(
                              "flex-1 p-3 text-xs bg-gray-50 rounded-xl border border-gray-100 focus:ring-1 focus:ring-emerald-500 outline-none",
                              q.correctAnswer === oIdx && "border-emerald-200 bg-emerald-50/30"
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {(!newQuiz.questions || newQuiz.questions.length === 0) && (
                  <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <Brain size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 font-bold text-sm">Nenhuma questão adicionada.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
