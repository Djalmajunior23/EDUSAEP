import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Timer, Award, ArrowRight, Brain, RotateCcw, MessageSquare } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { gamificationEngine } from '../../services/gamificationService';

interface Question {
  id: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: number;
  explicacao: string;
  dificuldade: string;
  competencia?: string;
}

interface QuizProps {
  quizId: string;
  title: string;
  questions: Question[];
  xpPerQuestion?: number;
  userId: string;
  onComplete?: (results: any) => void;
}

export const QuizEngine: React.FC<QuizProps> = ({ 
  quizId, 
  title, 
  questions, 
  xpPerQuestion = 50, 
  userId,
  onComplete 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [startTime] = useState(Date.now());
  const [answers, setAnswers] = useState<any[]>([]);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const handleConfirm = async () => {
    if (selectedOption === null || isAnswered) return;
    
    const correct = selectedOption === currentQuestion.respostaCorreta;
    if (correct) {
      setScore(s => s + 1);
      // Give instant XP bonus for correct answer
      await gamificationEngine.addXP(userId, xpPerQuestion);
    } else {
      // Partial XP for attempting
      await gamificationEngine.addXP(userId, Math.floor(xpPerQuestion * 0.2));
    }

    setAnswers([...answers, {
      questionId: currentQuestion.id,
      selected: selectedOption,
      correct: correct
    }]);

    setIsAnswered(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const results = {
      quizId,
      userId,
      score,
      totalQuestions: questions.length,
      timeSpent,
      answers,
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'quiz_attempts'), {
      ...results,
      createdAt: serverTimestamp()
    });

    // Reward for completion
    await gamificationEngine.addXP(userId, 200);
    
    if (score === questions.length) {
      await gamificationEngine.awardBadge(userId, 'QUIZ_MASTER');
    }

    setShowResults(true);
    if (onComplete) onComplete(results);
  };

  if (showResults) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 text-center max-w-lg mx-auto"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="text-emerald-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completado!</h2>
        <p className="text-gray-500 mb-8">Você arrasou no "{title}"</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <div className="text-sm text-gray-400 mb-1">Pontuação</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round((score/questions.length)*100)}%</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
            <div className="text-sm text-gray-400 mb-1">Tempo</div>
            <div className="text-2xl font-bold text-gray-900">{Math.floor((Date.now() - startTime)/1000)}s</div>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <RotateCcw size={20} />
          Refazer Desafio
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-emerald-700">Pergunta {currentIndex + 1} de {questions.length}</span>
          <div className="flex items-center gap-2 text-gray-500">
            <Timer size={16} />
            <span>{Math.floor((Date.now() - startTime) / 1000)}s</span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            className="h-full bg-emerald-500"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-8"
        >
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 leading-relaxed mb-6">
              {currentQuestion.enunciado}
            </h3>

            <div className="space-y-3">
              {currentQuestion.alternativas.map((alt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group",
                    selectedOption === idx 
                      ? (isAnswered 
                          ? (idx === currentQuestion.respostaCorreta ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50')
                          : 'border-emerald-300 bg-emerald-50 ring-4 ring-emerald-50')
                      : (isAnswered && idx === currentQuestion.respostaCorreta 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30')
                  )}
                >
                  <span className={cn(
                    "font-medium",
                    selectedOption === idx ? 'text-emerald-900' : 'text-gray-600'
                  )}>
                    {alt}
                  </span>
                  {selectedOption === idx && !isAnswered && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                  {isAnswered && idx === currentQuestion.respostaCorreta && (
                    <CheckCircle2 className="text-emerald-500" size={24} />
                  )}
                  {isAnswered && selectedOption === idx && idx !== currentQuestion.respostaCorreta && (
                    <XCircle className="text-red-500" size={24} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {isAnswered && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-6 rounded-2xl border",
                  selectedOption === currentQuestion.respostaCorreta 
                    ? "bg-emerald-50 border-emerald-100" 
                    : "bg-red-50 border-red-100"
                )}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    selectedOption === currentQuestion.respostaCorreta ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {selectedOption === currentQuestion.respostaCorreta ? <Brain size={20} /> : <RotateCcw size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      {selectedOption === currentQuestion.respostaCorreta ? 'Sensacional!' : 'Oops, quase lá!'}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {currentQuestion.explicacao}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end pt-4">
            {!isAnswered ? (
              <button
                onClick={handleConfirm}
                disabled={selectedOption === null}
                className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200"
              >
                Confirmar Resposta
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"
              >
                {currentIndex < questions.length - 1 ? 'Próxima Pergunta' : 'Finalizar Quiz'}
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Utility function duplicated for standalone use if needed
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
