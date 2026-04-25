import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Zap, CheckCircle2, XCircle,
  Loader2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, addDoc, serverTimestamp, doc, getDocFromServer, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Exam, UserProfile, ExamSubmission } from '../../types';
import { User } from 'firebase/auth';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { n8nEvents } from '../../services/n8nService';
import { analyzeCognitiveErrors } from '../../services/geminiService';

interface ExamTakingViewProps {
  exam: Exam;
  user: User | null;
  userProfile: UserProfile | null;
  onCancel: () => void;
  selectedModel: string;
}

export function ExamTakingView({ exam, user, userProfile, onCancel, selectedModel }: ExamTakingViewProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => {
    const saved = localStorage.getItem(`exam_progress_${exam.id}`);
    return saved ? JSON.parse(saved) : new Array(exam.questions.length).fill(-1);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [finalSubmission, setFinalSubmission] = useState<ExamSubmission | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Auto-save progress
  useEffect(() => {
    localStorage.setItem(`exam_progress_${exam.id}`, JSON.stringify(answers));
  }, [answers, exam.id]);

  const currentQuestion = exam.questions[currentQuestionIdx];

  const handleAnswer = (optionIdx: number) => {
    if (exam.type === 'exercicio' && isAnswerChecked) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIdx < exam.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setIsAnswerChecked(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
      setIsAnswerChecked(exam.type === 'exercicio' && answers[currentQuestionIdx - 1] !== -1);
    }
  };

  const handleSubmit = async () => {
    if (answers.includes(-1)) {
      toast.warning("Enviando com questões sem resposta...");
    }

    setIsSubmitting(true);
    try {
      let score = 0;
      let maxScore = 0;
      const competencyResults: { [key: string]: { correct: number, total: number } } = {};

      exam.questions.forEach((q, idx) => {
        const correctIdx = q.alternativas?.findIndex(a => a.id === q.respostaCorreta) ?? -1;
        const isCorrect = answers[idx] === (correctIdx !== -1 ? correctIdx : 0);
        const weight = 1;
        maxScore += weight;
        if (isCorrect) score += weight;

        if (q.competenciaNome) {
          if (!competencyResults[q.competenciaNome]) {
            competencyResults[q.competenciaNome] = { correct: 0, total: 0 };
          }
          competencyResults[q.competenciaNome].total += weight;
          if (isCorrect) competencyResults[q.competenciaNome].correct += weight;
        }
      });

      const submission: Omit<ExamSubmission, 'id'> = {
        resourceId: exam.id,
        type: exam.type === 'exercicio' ? 'exercise' : 'exam',
        studentId: user?.uid || '',
        studentName: userProfile?.displayName || 'Aluno',
        answers,
        score,
        maxScore,
        completedAt: serverTimestamp(),
        competencyResults
      };

      const docRef = await addDoc(collection(db, 'resultados'), submission);
      
      await n8nEvents.examCompleted({
        studentId: user?.uid || '',
        examId: exam.id,
        score,
        proficiency: (score / maxScore) * 100
      });
      
      if (score < maxScore) {
        analyzeCognitiveErrors(submission, exam.questions, selectedModel, userProfile?.role as any || 'professor').then(async (result) => {
          if (result.errors && result.errors.length > 0) {
            await addDoc(collection(db, 'cognitive_error_analyses'), {
              userId: user?.uid || '',
              submissionId: docRef.id,
              errors: result.errors,
              createdAt: serverTimestamp()
            });
          }
        }).catch(err => console.error("Error generating cognitive analysis:", err));
      }
      
      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDocFromServer(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentXp = userData.xp || 0;
            const earnedXp = score * 10;
            const newXp = currentXp + earnedXp;
            const newLevel = Math.floor(newXp / 100) + 1;
            
            await updateDoc(userRef, {
              xp: newXp,
              level: newLevel
            });
            
            if (newLevel > (userData.level || 1)) {
              toast.success(`🎉 Parabéns! Você alcançou o nível ${newLevel}!`);
            } else if (earnedXp > 0) {
              toast.success(`✨ Você ganhou ${earnedXp} XP!`);
            }
          }
        } catch (e) {
          console.error("Error updating gamification:", e);
        }
      }

      setFinalSubmission({ id: docRef.id, ...submission } as ExamSubmission);
      setShowResult(true);
      localStorage.removeItem(`exam_progress_${exam.id}`);
      toast.success("Avaliação enviada com sucesso!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'resultados');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResult && finalSubmission) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{exam.type === 'exercicio' ? 'Exercício Concluído!' : 'Simulado Concluído!'}</h2>
            <p className="text-gray-500 dark:text-gray-400">Confira seu desempenho detalhado abaixo.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nota Final</p>
              <p className="text-3xl font-bold text-emerald-600">{finalSubmission.score.toFixed(1)}</p>
              <p className="text-xs text-gray-400">de {finalSubmission.maxScore} pontos</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Aproveitamento</p>
              <p className="text-3xl font-bold text-blue-600">{((finalSubmission.score / finalSubmission.maxScore) * 100).toFixed(0)}%</p>
              <p className="text-xs text-gray-400">acertos totais</p>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Desempenho por Competência</h3>
            <div className="space-y-3">
              {Object.entries(finalSubmission.competencyResults).map(([comp, res]) => (
                <div key={comp} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-700 dark:text-gray-300">{comp}</span>
                    <span className="text-emerald-600">{((res.correct / res.total) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${(res.correct / res.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={onCancel}
            className="w-full py-4 bg-gray-900 dark:bg-emerald-600 text-white rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-emerald-700 transition-all shadow-lg"
          >
            Voltar para {exam.type === 'exercicio' ? 'Exercícios' : 'Simulados'}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600">
            <ChevronLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter",
                exam.type === 'exercicio' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
              )}>
                {exam.type === 'exercicio' ? 'Modo Prática' : 'Modo Simulado'}
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{exam.title}</h2>
            </div>
            <p className="text-xs text-gray-500">Questão {currentQuestionIdx + 1} de {exam.questions.length}</p>
          </div>
        </div>
        <div className="w-32 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all",
              exam.type === 'exercicio' ? "bg-blue-500" : "bg-emerald-500"
            )}
            style={{ width: `${((currentQuestionIdx + 1) / exam.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {exam.type === 'exercicio' && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Zap size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-900 dark:text-blue-400">Aprendizado Ativo</p>
            <p className="text-[10px] text-blue-700 dark:text-blue-500/70">Feedback imediato e correção comentada habilitados para esta sessão.</p>
          </div>
        </div>
      )}

      <motion.div 
        key={currentQuestionIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-8"
      >
        <div className="space-y-4">
          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {currentQuestion.competenciaNome || 'Geral'}
          </span>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white leading-relaxed">
            {currentQuestion.enunciado}
          </h3>
        </div>

        <div className="space-y-3">
          {currentQuestion.alternativas?.map((opt, idx) => {
            const correctIdx = currentQuestion.alternativas?.findIndex(a => a.id === currentQuestion.respostaCorreta) ?? -1;
            const isCorrectOption = idx === (correctIdx !== -1 ? correctIdx : 0);
            
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={exam.type === 'exercicio' && isAnswerChecked}
                className={cn(
                  "w-full p-4 text-left rounded-2xl border transition-all flex items-center gap-4 group",
                  answers[currentQuestionIdx] === idx 
                    ? (exam.type === 'exercicio' && isAnswerChecked 
                        ? (isCorrectOption ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-sm" : "bg-red-50 dark:bg-red-900/20 border-red-500 shadow-sm")
                        : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-sm")
                    : (exam.type === 'exercicio' && isAnswerChecked && isCorrectOption
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-sm"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-200 hover:bg-white dark:hover:bg-gray-700")
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                  answers[currentQuestionIdx] === idx 
                    ? (exam.type === 'exercicio' && isAnswerChecked
                        ? (isCorrectOption ? "bg-emerald-500 text-white" : "bg-red-500 text-white")
                        : "bg-emerald-500 text-white")
                    : (exam.type === 'exercicio' && isAnswerChecked && isCorrectOption
                        ? "bg-emerald-500 text-white"
                        : "bg-white dark:bg-gray-700 text-gray-400 group-hover:text-emerald-600")
                )}>
                  {opt.id}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className={cn(
                    "font-bold text-sm transition-colors",
                    answers[currentQuestionIdx] === idx ? "text-emerald-900 dark:text-emerald-300" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                  )}>
                    {opt.texto}
                  </span>
                  {exam.type === 'exercicio' && isAnswerChecked && (
                    isCorrectOption ? <CheckCircle2 className="text-emerald-500" size={18} /> : 
                    (answers[currentQuestionIdx] === idx && <XCircle className="text-red-500" size={18} />)
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIdx === 0}
            className="flex-1 py-4 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-white rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-30"
          >
            Anterior
          </button>
          
          {exam.type === 'exercicio' && !isAnswerChecked && answers[currentQuestionIdx] !== -1 ? (
             <button
               onClick={() => setIsAnswerChecked(true)}
               className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
             >
               Verificar Resposta
             </button>
          ) : (
            currentQuestionIdx === exam.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Finalizar Simulado"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 py-4 bg-gray-900 dark:bg-emerald-600 text-white rounded-2xl font-bold hover:bg-gray-800 dark:hover:bg-emerald-700 transition-all shadow-lg"
              >
                Próxima
              </button>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}
