import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle2, Clock, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { LearningSituation, SASubmission } from '../../types/edusaep.types';
import Markdown from 'react-markdown';

export function StudentLearningSituationsView({ userProfile }: { userProfile: any }) {
  const [situations, setSituations] = useState<LearningSituation[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SASubmission>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSA, setSelectedSA] = useState<LearningSituation | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch published SAs
      // In a real app, you'd filter by the student's classId: where('classId', '==', userProfile.classId)
      const saQuery = query(collection(db, 'learning_situations'), where('status', '==', 'published'));
      const saSnap = await getDocs(saQuery);
      const saData = saSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningSituation));
      setSituations(saData);

      // Fetch student's submissions
      const subQuery = query(collection(db, 'sa_submissions'), where('studentId', '==', userProfile.uid));
      const subSnap = await getDocs(subQuery);
      const subData: Record<string, SASubmission> = {};
      subSnap.docs.forEach(doc => {
        const data = doc.data() as SASubmission;
        subData[data.saId] = { id: doc.id, ...data };
      });
      setSubmissions(subData);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar Situações de Aprendizagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSA || !submissionContent.trim()) {
      toast.error('Preencha sua resposta antes de enviar.');
      return;
    }

    setSubmitting(true);
    try {
      const newSubmission: Omit<SASubmission, 'id'> = {
        saId: selectedSA.id!,
        studentId: userProfile.uid,
        studentName: userProfile.displayName || 'Aluno',
        content: submissionContent,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      const docRef = await addDoc(collection(db, 'sa_submissions'), {
        ...newSubmission,
        createdAt: serverTimestamp()
      });

      setSubmissions(prev => ({
        ...prev,
        [selectedSA.id!]: { id: docRef.id, ...newSubmission }
      }));
      
      toast.success('Atividade entregue com sucesso!');
      setSelectedSA(null);
      setSubmissionContent('');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar atividade.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (selectedSA) {
    const submission = submissions[selectedSA.id!];
    
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <button onClick={() => setSelectedSA(null)} className="text-indigo-600 hover:underline font-medium">
          &larr; Voltar para lista
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSA.title}</h2>
          <div className="flex gap-2 mb-6">
            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{selectedSA.course}</span>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">{selectedSA.complexity}</span>
          </div>

          <div className="prose max-w-none mb-8">
            <h3>Contexto</h3>
            <p>{selectedSA.context}</p>
            <h3>Desafio Central</h3>
            <p>{selectedSA.centralChallenge}</p>
            <h3>Entregáveis Esperados</h3>
            <ul>
              {selectedSA.deliverables.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Sua Entrega</h3>
            
            {submission ? (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-emerald-600 font-medium mb-4">
                  <CheckCircle2 size={20} /> Atividade Entregue
                </div>
                <div className="prose max-w-none text-gray-700">
                  <Markdown>{submission.content}</Markdown>
                </div>
                {submission.status === 'graded' && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                    <p className="font-bold text-indigo-900">Nota: {submission.grade}</p>
                    <p className="text-indigo-800 mt-1">{submission.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={submissionContent}
                  onChange={e => setSubmissionContent(e.target.value)}
                  placeholder="Escreva sua resposta ou cole o link do seu trabalho aqui... (Suporta Markdown)"
                  className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  Enviar Atividade
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="text-indigo-600" /> Situações de Aprendizagem
        </h2>
        <p className="text-gray-500">Resolva desafios práticos baseados no mercado de trabalho.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {situations.map(sa => {
          const isSubmitted = !!submissions[sa.id!];
          return (
            <motion.div
              key={sa.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSelectedSA(sa)}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{sa.course}</span>
                {isSubmitted ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircle2 size={14} /> Entregue
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <Clock size={14} /> Pendente
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{sa.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-grow">{sa.centralChallenge}</p>
              <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-400">{sa.duration}</span>
                <span className="text-indigo-600 text-sm font-medium">Ver detalhes &rarr;</span>
              </div>
            </motion.div>
          );
        })}
        {situations.length === 0 && (
          <div className="col-span-full text-center p-12 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
            <p className="text-gray-500">Nenhuma Situação de Aprendizagem disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
