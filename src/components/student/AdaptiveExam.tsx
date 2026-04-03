import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Target, 
  Zap, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  ArrowRight,
  Trophy
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { getNextAdaptiveQuestion, SAEPQuestion } from '../../services/geminiService';
import { handleFirestoreError, OperationType } from '../../services/errorService';

interface AdaptiveExamProps {
  examId: string;
  competency: string;
  onComplete: (score: number) => void;
}

export function AdaptiveExam({ examId, competency, onComplete }: AdaptiveExamProps) {
  const [currentQuestion, setCurrentQuestion] = useState<SAEPQuestion | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [proficiency, setProficiency] = useState(50); // Start at medium
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions] = useState(10); // Adaptive exams are usually shorter
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const STORAGE_KEY = `adaptive_exam_progress_${examId}`;

  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setHistory(parsed.history || []);
        setProficiency(parsed.proficiency || 50);
        setQuestionCount(parsed.questionCount || 0);
        setSessionId(parsed.sessionId || null);
        setCurrentQuestion(parsed.currentQuestion || null);
        setSelectedOption(parsed.selectedOption !== undefined ? parsed.selectedOption : null);
        setShowFeedback(parsed.showFeedback || false);
        return; // Don't start a new session if we loaded one
      } catch (e) {
        console.error("Failed to parse saved progress", e);
      }
    }
    startSession();
  }, [examId]);

  useEffect(() => {
    if (sessionId) {
      const progress = {
        history,
        proficiency,
        questionCount,
        sessionId,
        currentQuestion,
        selectedOption,
        showFeedback
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [history, proficiency, questionCount, sessionId, currentQuestion, selectedOption, showFeedback, examId]);

  const startSession = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      const sessionRef = await addDoc(collection(db, 'adaptive_sessions'), {
        userId: auth.currentUser.uid,
        examId,
        currentProficiency: 50,
        questionHistory: [],
        status: 'active',
        createdAt: serverTimestamp()
      });
      setSessionId(sessionRef.id);
      fetchNextQuestion(50, []);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'adaptive_sessions');
    }
  };

  const fetchNextQuestion = async (p: number, h: any[]) => {
    setIsLoading(true);
    try {
      const question = await getNextAdaptiveQuestion(p, competency, h);
      setCurrentQuestion(question);
      setQuestionCount(prev => prev + 1);
    } catch (error) {
      console.error("Error fetching next adaptive question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (selectedOption === null || !currentQuestion || !sessionId) return;

    const isCorrect = selectedOption === currentQuestion.correctOption;
    const newHistory = [...history, { ...currentQuestion, selectedOption, isCorrect }];
    setHistory(newHistory);
    setShowFeedback(true);

    // Simple TRI-like adjustment
    let newProficiency = proficiency;
    if (isCorrect) {
      newProficiency = Math.min(100, proficiency + (currentQuestion.difficulty === 'difícil' ? 15 : 10));
    } else {
      newProficiency = Math.max(0, proficiency - (currentQuestion.difficulty === 'fácil' ? 15 : 10));
    }
    setProficiency(newProficiency);

    // Update Firestore
    try {
      await updateDoc(doc(db, 'adaptive_sessions', sessionId), {
        currentProficiency: newProficiency,
        questionHistory: newHistory
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'adaptive_sessions');
    }
  };

  const handleNext = () => {
    if (questionCount >= maxQuestions) {
      finishExam();
    } else {
      setSelectedOption(null);
      setShowFeedback(false);
      fetchNextQuestion(proficiency, history);
    }
  };

  const finishExam = async () => {
    if (!sessionId || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'adaptive_sessions', sessionId), {
        status: 'completed'
      });
      
      // Save final submission
      const score = (history.filter(h => h.isCorrect).length / maxQuestions) * 100;
      await addDoc(collection(db, 'exam_submissions'), {
        studentId: auth.currentUser.uid,
        examId,
        score,
        maxScore: 100,
        completedAt: new Date().toISOString(),
        isAdaptive: true,
        finalProficiency: proficiency
      });

      localStorage.removeItem(STORAGE_KEY);
      onComplete(score);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'adaptive_sessions/exam_submissions');
    }
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-gray-500 font-medium animate-pulse">IA selecionando a melhor questão para seu nível...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Simulado Adaptativo</h2>
            <p className="text-xs text-gray-500">Questão {questionCount} de {maxQuestions}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proficiência</p>
            <p className="text-lg font-bold text-emerald-600">{Math.round(proficiency)}%</p>
          </div>
          <div className="w-24 bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${proficiency}%` }}
            ></div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={questionCount}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800"
          >
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                  currentQuestion.difficulty === 'fácil' ? 'bg-emerald-100 text-emerald-600' :
                  currentQuestion.difficulty === 'médio' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">{currentQuestion.skill}</span>
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                {currentQuestion.text}
              </h3>
            </div>

            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => !showFeedback && setSelectedOption(idx)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between group ${
                    selectedOption === idx
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${
                    showFeedback && idx === currentQuestion.correctOption
                      ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : ''
                  } ${
                    showFeedback && selectedOption === idx && idx !== currentQuestion.correctOption
                      ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      : ''
                  }`}
                >
                  <span className="text-sm">{option}</span>
                  {showFeedback && idx === currentQuestion.correctOption && (
                    <CheckCircle2 size={20} />
                  )}
                  {showFeedback && selectedOption === idx && idx !== currentQuestion.correctOption && (
                    <XCircle size={20} />
                  )}
                </button>
              ))}
            </div>

            {showFeedback ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 mb-8"
              >
                <div className="flex items-center gap-2 mb-2 text-gray-900 dark:text-white font-bold text-sm">
                  <AlertCircle size={18} className="text-emerald-600" />
                  Explicação da IA
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            ) : null}

            <div className="flex justify-end">
              {!showFeedback ? (
                <button
                  onClick={handleAnswer}
                  disabled={selectedOption === null}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  Confirmar Resposta
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:opacity-90 transition-all flex items-center gap-2"
                >
                  {questionCount >= maxQuestions ? 'Finalizar Simulado' : 'Próxima Questão'}
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ChevronRight size={18} />}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
