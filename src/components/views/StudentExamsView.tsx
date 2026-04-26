import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Info, Loader2, CheckSquare, ExternalLink 
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Exam, ExamSubmission, UserProfile, SimuladoForm } from '../../types';
import { User } from 'firebase/auth';
import { toast } from 'sonner';
import { ExamTakingView } from './ExamTakingView';

interface StudentExamsViewProps {
  user: User | null;
  userProfile: UserProfile | null;
  selectedModel: string;
}

export function StudentExamsView({ user, userProfile, selectedModel }: StudentExamsViewProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [forms, setForms] = useState<SimuladoForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingExam, setTakingExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch published exams (Simulados only)
    const examsQuery = query(
      collection(db, 'avaliacoes'), 
      where('status', '==', 'publicado'),
      where('type', '==', 'simulado')
    );
    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExams(examsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'avaliacoes');
    });

    // Fetch user submissions
    const submissionsQuery = query(collection(db, 'resultados'), where('studentId', '==', user.uid));
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSubmission));
      setSubmissions(submissionsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'resultados');
    });

    // Fetch active forms
    const formsQuery = query(collection(db, 'simulado_forms'), where('status', '==', 'active'));
    const unsubscribeForms = onSnapshot(formsQuery, (snapshot) => {
      const formsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SimuladoForm));
      setForms(formsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'simulado_forms');
    });

    return () => {
      unsubscribeExams();
      unsubscribeSubmissions();
      unsubscribeForms();
    };
  }, [user]);

  if (takingExam) {
    // Check for date restrictions
    const now = new Date();
    if (takingExam.startDate && now < new Date(takingExam.startDate.seconds * 1000)) {
      toast.error("Este simulado ainda não está aberto.");
      setTakingExam(null);
      return null;
    }
    if (takingExam.endDate && now > new Date(takingExam.endDate.seconds * 1000)) {
      toast.error("Este simulado já foi encerrado.");
      setTakingExam(null);
      return null;
    }

    // Check for max attempts
    const userSubmissions = submissions.filter(s => s.resourceId === takingExam.id);
    if (takingExam.maxAttempts && userSubmissions.length >= takingExam.maxAttempts) {
      toast.error(`Você já atingiu o limite de ${takingExam.maxAttempts} tentativas para este simulado.`);
      setTakingExam(null);
      return null;
    }

    return <ExamTakingView exam={takingExam} user={user} userProfile={userProfile} onCancel={() => setTakingExam(null)} selectedModel={selectedModel} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
            <BookOpen size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Simulados Oficiais</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Foco em <span className="text-emerald-600 font-bold">diagnóstico e avaliação formal</span> para monitoramento de desempenho</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
          <Info size={16} className="text-emerald-600 dark:text-emerald-400" />
          <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
            Avaliações formais para medir seu progresso real. O feedback detalhado vem após o envio.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => {
            const submission = submissions.find(s => s.resourceId === exam.id);
            return (
              <motion.div 
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[8px] font-bold uppercase tracking-tighter">
                        Avaliação
                      </span>
                      <h3 className="font-bold text-gray-900 dark:text-white">{exam.title}</h3>
                    </div>
                    <p className="text-xs text-emerald-600 font-bold">{exam.subject}</p>
                  </div>
                  {submission && (
                    <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Concluído
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">{exam.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare size={14} />
                      <span className="text-[10px] font-bold">{exam.questions.length} Questões</span>
                    </div>
                  </div>
                  
                  {submission ? (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sua Nota</p>
                      <p className="text-lg font-bold text-emerald-600">{submission.score.toFixed(1)} / {submission.maxScore}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {(exam.applicationMode === 'internal' || exam.applicationMode === 'hybrid' || !exam.applicationMode) && (
                        <button 
                          onClick={() => setTakingExam(exam)}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-none transition-all text-sm"
                        >
                          Iniciar na Plataforma
                        </button>
                      )}
                      {(exam.applicationMode === 'external' || exam.applicationMode === 'hybrid') && (
                        <a 
                          href={forms.find(f => f.simuladoId === exam.id)?.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-2 bg-white dark:bg-gray-800 text-emerald-600 border-2 border-emerald-600 rounded-xl font-bold hover:bg-emerald-50 dark:hover:bg-gray-700 transition-all text-sm text-center flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={16} />
                          Responder em Formulário
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {exams.length === 0 && (
            <div className="col-span-full bg-white dark:bg-gray-800 p-12 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-600 mx-auto">
                <BookOpen size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum simulado disponível</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Aguarde até que seus professores disponibilizem novas avaliações.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
