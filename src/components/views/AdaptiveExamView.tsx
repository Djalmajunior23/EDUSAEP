import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, CheckCircle2, 
  ArrowRight, Brain, Trophy 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Question } from '../../types';
import { User } from 'firebase/auth';
import { toast } from 'sonner';

interface AdaptiveExamViewProps {
  user: User | null;
  userProfile: UserProfile | null;
  selectedModel: string;
}

export function AdaptiveExamView({ user, userProfile, selectedModel }: AdaptiveExamViewProps) {
  const { competency } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(
          collection(db, 'questions'), 
          where('competenciaId', '==', competency),
          where('status', '==', 'publicado')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        
        // If not enough questions, generate a variation or just shuffle
        if (list.length < 5) {
          // In a real scenario, we'd trigger AI generation here
          // For now, let's just shuffle what we have
        }
        
        setQuestions(list.sort(() => Math.random() - 0.5).slice(0, 10));
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar simulado.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [competency]);

  const handleAnswer = (answerId: string) => {
    setSelectedAnswer(answerId);
  };

  const nextQuestion = () => {
    if (!selectedAnswer) return;
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.respostaCorreta;
    
    setAnswers([...answers, {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      isCorrect,
      timeSpent: Date.now() - startTime
    }]);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    setFinished(true);
    if (!user) return;

    try {
      const score = answers.filter(a => a.isCorrect).length;
      await addDoc(collection(db, 'exam_submissions'), {
        studentId: user.uid,
        studentName: userProfile?.displayName || 'Aluno',
        competencyId: competency,
        score,
        total: questions.length,
        answers,
        createdAt: serverTimestamp()
      });
      toast.success("Simulado finalizado!");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  if (finished) {
    const score = answers.filter(a => a.isCorrect).length;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto py-20 text-center space-y-8"
      >
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
          <Trophy size={48} />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-gray-900">Simulado Concluído!</h2>
          <p className="text-gray-500 text-lg">Parabéns. Você completou sua avaliação adaptativa.</p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sua Pontuação</p>
            <p className="text-5xl font-black text-emerald-600">{score}/{questions.length}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Precisão</p>
            <p className="text-5xl font-black text-blue-600">{Math.round((score / questions.length) * 100)}%</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/learning-path')}
          className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2 mx-auto"
        >
          Voltar para Trilha <ArrowRight size={20} />
        </button>
      </motion.div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Simulado Adaptativo</h2>
          <p className="text-lg font-bold text-gray-900">{competency}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase">Questão</p>
          <p className="text-xl font-black text-emerald-600">{currentIndex + 1} de {questions.length}</p>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          className="h-full bg-emerald-500 rounded-full"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <Brain size={14} /> Nível {currentQ.dificuldade}
          </div>
          <p className="text-2xl font-bold text-gray-900 leading-relaxed">{currentQ.enunciado}</p>
          
          <div className="grid gap-4">
            {currentQ.alternativas?.map((alt) => (
              <button
                key={alt.id}
                onClick={() => handleAnswer(alt.id)}
                className={`p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                  selectedAnswer === alt.id 
                    ? 'border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-500/10' 
                    : 'border-gray-50 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                    selectedAnswer === alt.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                  }`}>
                    {alt.id}
                  </div>
                  <span className={`font-bold ${selectedAnswer === alt.id ? 'text-emerald-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                    {alt.texto}
                  </span>
                </div>
                {selectedAnswer === alt.id && <CheckCircle2 size={24} className="text-emerald-500" />}
              </button>
            ))}
          </div>

          <button 
            disabled={!selectedAnswer}
            onClick={nextQuestion}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-200 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-gray-400"
          >
            {currentIndex === questions.length - 1 ? 'Finalizar Simulado' : 'Próxima Questão'} <ArrowRight size={20} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
