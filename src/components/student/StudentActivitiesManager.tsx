import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, CheckCircle2, Clock, Send, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Activity, ActivitySubmission, Rubric } from '../../types/edusaep.types';
import Markdown from 'react-markdown';
import { gamificationService } from '../../services/gamificationService';
import { notificationService } from '../../services/notificationService';

export function StudentActivitiesManager({ userProfile }: { userProfile: any }) {
  const [view, setView] = useState<'list' | 'submit' | 'feedback'>('list');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, ActivitySubmission>>({});
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [rubric, setRubric] = useState<Rubric | null>(null);

  useEffect(() => {
    fetchData();
  }, [userProfile.uid]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all active activities (in a real app, filter by classId)
      const qAct = query(collection(db, 'activities'), where('status', '==', 'active'));
      const snapAct = await getDocs(qAct);
      const acts = snapAct.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
      setActivities(acts);

      // Fetch my submissions
      const qSub = query(collection(db, 'activity_submissions'), where('studentId', '==', userProfile.uid));
      const snapSub = await getDocs(qSub);
      const subs: Record<string, ActivitySubmission> = {};
      snapSub.docs.forEach(doc => {
        const data = doc.data() as ActivitySubmission;
        subs[data.activityId] = { id: doc.id, ...data };
      });
      setMySubmissions(subs);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar atividades.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedActivity?.id) return;
    setSubmitting(true);
    try {
      const submissionRef = mySubmissions[selectedActivity.id]?.id 
        ? doc(db, 'activity_submissions', mySubmissions[selectedActivity.id].id!)
        : collection(db, 'activity_submissions');

      const payload = {
        activityId: selectedActivity.id,
        studentId: userProfile.uid,
        studentName: userProfile.displayName || 'Aluno',
        content,
        status: 'draft',
        updatedAt: serverTimestamp()
      };

      if (mySubmissions[selectedActivity.id]?.id) {
        await updateDoc(submissionRef as any, payload);
      } else {
        await addDoc(submissionRef as any, { ...payload, submittedAt: serverTimestamp() });
      }
      
      toast.success("Rascunho salvo com sucesso!");
      fetchData();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Erro ao salvar rascunho.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedActivity?.id) return;
    
    if (selectedActivity.submissionType !== 'file' && !content.trim()) {
      toast.error("Preencha sua resposta antes de enviar.");
      return;
    }

    if (selectedActivity.submissionType !== 'text' && attachments.length === 0 && !content.trim()) {
      toast.error("Anexe um arquivo ou escreva uma resposta.");
      return;
    }

    setSubmitting(true);
    try {
      const isLate = new Date() > new Date(selectedActivity.dueDate);
      if (isLate && !selectedActivity.acceptLate) {
        toast.error("O prazo para esta atividade já encerrou.");
        setSubmitting(false);
        return;
      }

      // Mock file upload metadata for prototype
      const mockAttachments = attachments.map(f => ({
        name: f.name,
        size: f.size,
        url: 'https://placeholder.url/file' // In a real app, upload to Firebase Storage
      }));

      const payload = {
        activityId: selectedActivity.id,
        studentId: userProfile.uid,
        studentName: userProfile.displayName || 'Aluno',
        content,
        attachments: mockAttachments,
        status: isLate ? 'late' : 'submitted',
        submittedAt: serverTimestamp()
      };

      if (mySubmissions[selectedActivity.id]?.id) {
        await updateDoc(doc(db, 'activity_submissions', mySubmissions[selectedActivity.id].id!), payload);
      } else {
        await addDoc(collection(db, 'activity_submissions'), payload);
      }

      // Notify professor
      try {
        await notificationService.createNotification({
          userId: selectedActivity.createdBy,
          title: 'Nova Entrega Recebida',
          message: `${userProfile.displayName} entregou a atividade: ${selectedActivity.title}`,
          type: 'activity_submitted',
          link: '/teacher-activities'
        });
      } catch (notifErr) {
        console.error("Error notifying professor:", notifErr);
      }

      // Award gamification points
      const points = 100 + (!isLate ? 50 : 0);
      await gamificationService.awardPoints(userProfile.uid, points, points);

      toast.success(isLate ? "Atividade enviada com atraso!" : "Atividade enviada com sucesso!");
      setContent('');
      setAttachments([]);
      setView('list');
      fetchData();
    } catch (error) {
      console.error("Error submitting activity:", error);
      toast.error("Erro ao enviar atividade.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && view === 'list') {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-indigo-600" /> Minhas Atividades
          </h2>
          <p className="text-gray-500 mt-1">Acompanhe seus prazos, envie respostas e veja seus feedbacks.</p>
        </div>
        {view !== 'list' && (
          <button
            onClick={() => { setView('list'); setSelectedActivity(null); setContent(''); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Voltar para Lista
          </button>
        )}
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-300" />
              <p>Você não tem atividades pendentes no momento!</p>
            </div>
          ) : (
            activities.map(activity => {
              const submission = mySubmissions[activity.id!];
              const isSubmitted = !!submission;
              const isGraded = submission?.status === 'graded';

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900 line-clamp-2">{activity.title}</h3>
                    {isGraded ? (
                      <span className="px-2 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Avaliada
                      </span>
                    ) : submission?.status === 'late' ? (
                      <span className="px-2 py-1 text-xs font-bold rounded-md bg-red-100 text-red-700 flex items-center gap-1">
                        <Clock size={12} /> Entregue (Atraso)
                      </span>
                    ) : submission?.status === 'draft' ? (
                      <span className="px-2 py-1 text-xs font-bold rounded-md bg-gray-100 text-gray-700 flex items-center gap-1">
                        <FileText size={12} /> Rascunho
                      </span>
                    ) : isSubmitted ? (
                      <span className="px-2 py-1 text-xs font-bold rounded-md bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Clock size={12} /> Entregue
                      </span>
                    ) : new Date() > new Date(activity.dueDate) ? (
                      <span className="px-2 py-1 text-xs font-bold rounded-md bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertCircle size={12} /> Atrasada
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-700 flex items-center gap-1">
                        <AlertCircle size={12} /> Pendente
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-6 flex-1">
                    <p className="line-clamp-2">{activity.description}</p>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                      <p className="flex items-center gap-1 text-xs font-medium"><Clock size={14} /> Prazo: {new Date(activity.dueDate).toLocaleDateString()}</p>
                      <p className="flex items-center gap-1 text-xs font-medium"><CheckCircle2 size={14} /> Valor: {activity.points} pts</p>
                    </div>
                  </div>
                  
                  {isGraded ? (
                    <button
                      onClick={() => { 
                        setSelectedActivity(activity); 
                        setView('feedback'); 
                        if (activity.rubricId) {
                          getDoc(doc(db, 'rubrics', activity.rubricId)).then(snap => {
                            if (snap.exists()) setRubric({ id: snap.id, ...snap.data() } as Rubric);
                          });
                        } else {
                          setRubric(null);
                        }
                      }}
                      className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors"
                    >
                      Ver Feedback e Nota
                    </button>
                  ) : isSubmitted && submission?.status !== 'draft' && !activity.allowResubmission ? (
                    <button disabled className="w-full py-2 bg-gray-50 text-gray-400 rounded-xl font-medium cursor-not-allowed">
                      Aguardando Correção
                    </button>
                  ) : (
                    <button
                      onClick={() => { 
                        setSelectedActivity(activity); 
                        setContent(submission?.content || '');
                        setView('submit'); 
                      }}
                      className="w-full py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send size={16} /> {submission?.status === 'draft' ? 'Continuar Rascunho' : (isSubmitted ? 'Reenviar' : 'Fazer Entrega')}
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Submit View */}
      {view === 'submit' && selectedActivity && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-8 pb-6 border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedActivity.title}</h3>
            <div className="prose prose-sm max-w-none text-gray-600">
              <Markdown>{selectedActivity.description}</Markdown>
            </div>
          </div>

          <div className="space-y-6">
            {(selectedActivity.submissionType === 'text' || selectedActivity.submissionType === 'mixed') && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sua Resposta</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm"
                  placeholder="Escreva sua resposta aqui (suporta Markdown)..."
                />
              </div>
            )}

            {(selectedActivity.submissionType === 'file' || selectedActivity.submissionType === 'mixed') && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Anexos (Máx: {selectedActivity.maxAttachments})</label>
                <input 
                  type="file" 
                  multiple 
                  onChange={(e) => {
                    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
                    if (e.target.files) {
                      const filesArray = Array.from(e.target.files);
                      
                      const oversizedFiles = filesArray.filter(f => f.size > MAX_SIZE);
                      if (oversizedFiles.length > 0) {
                        toast.error(`O limite de tamanho de arquivo é de 5MB. Arquivo(s) excedente(s): ${oversizedFiles.map(f => f.name).join(', ')}`);
                        e.target.value = ''; // Reset input
                        return;
                      }

                      if (filesArray.length > selectedActivity.maxAttachments) {
                        toast.error(`Máximo de ${selectedActivity.maxAttachments} arquivos permitidos.`);
                        e.target.value = ''; // Reset input
                        return;
                      }
                      setAttachments(filesArray);
                    }
                  }}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {attachments.length > 0 && (
                  <div className="mt-2 text-sm text-gray-500 space-y-1">
                    {attachments.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-500 mt-2 font-medium">Limite máximo por arquivo: 5MB</p>
                <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1 leading-tight italic bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <AlertCircle size={14} /> Nota: O upload real de arquivos requer configuração do Firebase Storage. Esta é uma simulação de interface.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleSaveDraft}
                disabled={submitting}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Salvar Rascunho
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                Enviar Atividade
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Feedback View */}
      {view === 'feedback' && selectedActivity && mySubmissions[selectedActivity.id!] && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedActivity.title}</h3>
              <p className="text-gray-500">
                {mySubmissions[selectedActivity.id!].status === 'returned' ? 'Atividade Devolvida para Ajuste' : 'Feedback do Professor'}
              </p>
            </div>
            <div className="flex gap-4">
              {mySubmissions[selectedActivity.id!].concept && (
                <div className="text-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100 min-w-[100px]">
                  <p className="text-sm font-bold text-indigo-600 mb-1">Conceito</p>
                  <p className="text-3xl font-black text-indigo-700">{mySubmissions[selectedActivity.id!].concept}</p>
                </div>
              )}
              <div className={`text-center p-4 rounded-2xl border min-w-[120px] ${mySubmissions[selectedActivity.id!].status === 'returned' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <p className={`text-sm font-bold mb-1 ${mySubmissions[selectedActivity.id!].status === 'returned' ? 'text-red-600' : 'text-emerald-600'}`}>Sua Nota</p>
                <p className={`text-3xl font-black ${mySubmissions[selectedActivity.id!].status === 'returned' ? 'text-red-700' : 'text-emerald-700'}`}>
                  {mySubmissions[selectedActivity.id!].grade} <span className={`text-lg font-medium ${mySubmissions[selectedActivity.id!].status === 'returned' ? 'text-red-500' : 'text-emerald-500'}`}>/ {selectedActivity.points}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {mySubmissions[selectedActivity.id!].status === 'returned' && (
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={18} /> Atenção: Ajustes Necessários
                </h4>
                <p className="text-red-800 text-sm mb-4">O professor solicitou que você revise sua entrega com base no feedback abaixo e envie novamente.</p>
                <button
                  onClick={() => { 
                    setContent(mySubmissions[selectedActivity.id!].content || '');
                    setView('submit'); 
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Send size={16} /> Refazer Entrega
                </button>
              </div>
            )}

            {rubric && mySubmissions[selectedActivity.id!].rubricScores && (
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-indigo-600" /> Avaliação por Critérios (Rubrica)
                </h4>
                <div className="space-y-3">
                  {rubric.criteria.map(criterion => {
                    const scoreData = mySubmissions[selectedActivity.id!].rubricScores![criterion.id];
                    return (
                      <div key={criterion.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{criterion.title}</p>
                            <p className="text-sm text-gray-500">{criterion.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg whitespace-nowrap">
                              {scoreData?.score || 0} / {criterion.maxPoints} pts
                            </span>
                          </div>
                        </div>
                        {scoreData?.feedback && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <strong>Comentário:</strong> {scoreData.feedback}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" /> Comentários Gerais do Professor
              </h4>
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 prose prose-sm max-w-none text-indigo-900">
                <Markdown>{mySubmissions[selectedActivity.id!].feedback || 'Sem comentários adicionais.'}</Markdown>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" /> Sua Resposta Original
              </h4>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 prose prose-sm max-w-none">
                <Markdown>{mySubmissions[selectedActivity.id!].content}</Markdown>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
