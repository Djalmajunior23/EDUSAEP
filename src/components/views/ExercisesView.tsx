import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, BookOpen, Search, Info, Loader2, ArrowRight, Zap, CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Exam, ExamSubmission, UserProfile } from '../../types';
import { User } from 'firebase/auth';
import { cn } from '../../lib/utils';
import { ExamTakingView } from './ExamTakingView';

interface ExercisesViewProps {
  user: User | null;
  userProfile: UserProfile | null;
  selectedModel: string;
}

export function ExercisesView({ user, userProfile, selectedModel }: ExercisesViewProps) {
  const [exercises, setExercises] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState<Exam | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Todos');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'exams'), 
      where('type', '==', 'exercicio'),
      where('status', '==', 'published')
    );
    const unsubscribeExams = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExercises(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exams');
    });

    const submissionsQuery = query(collection(db, 'exam_submissions'), where('studentId', '==', user.uid), where('type', '==', 'exercise'));
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSubmission));
      setSubmissions(submissionsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
    });

    return () => {
      unsubscribeExams();
      unsubscribeSubmissions();
    };
  }, [user]);

  const subjects = useMemo(() => {
    const s = new Set(exercises.map(ex => ex.subject));
    return ['Todos', ...Array.from(s)];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           ex.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === 'Todos' || ex.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [exercises, searchTerm, selectedSubject]);

  if (activeExercise) {
    return (
      <ExamTakingView 
        user={user} 
        userProfile={userProfile} 
        exam={activeExercise} 
        onCancel={() => setActiveExercise(null)} 
        selectedModel={selectedModel} 
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
            <CheckSquare size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Módulo de Exercícios</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Foco em <span className="text-blue-600 font-bold">prática e aprendizado</span> com feedback imediato e correção comentada</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl">
          <Info size={16} className="text-blue-600 dark:text-blue-400" />
          <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
            Diferente dos simulados, aqui você recebe correção na hora para acelerar seu aprendizado.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar exercícios por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm dark:text-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                selectedSubject === subject 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none" 
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-600 mx-auto">
            <BookOpen size={32} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum exercício encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((ex) => {
            const submission = submissions.find(s => s.resourceId === ex.id);
            const isCompleted = !!submission;
            const scorePercentage = isCompleted ? Math.round((submission.score / (submission.maxScore || 100)) * 100) : 0;

            return (
              <motion.div 
                key={ex.id} 
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {ex.subject}
                  </span>
                  {isCompleted ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                      <CheckCircle2 size={12} /> Concluído ({scorePercentage}%)
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-[8px] font-bold uppercase tracking-tighter">
                      <Zap size={8} /> Prática
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{ex.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 flex-1">{ex.description}</p>
                <button 
                  onClick={() => setActiveExercise(ex)}
                  className={cn(
                    "w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                    isCompleted 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white" 
                      : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white"
                  )}
                >
                  {isCompleted ? 'Praticar Novamente' : 'Praticar Agora'} <ArrowRight size={18} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
