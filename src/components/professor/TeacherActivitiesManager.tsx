import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Plus, Users, Calendar, CheckCircle2, XCircle, Clock, Loader2, Sparkles, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Activity, ActivitySubmission, Rubric } from '../../types/edusaep.types';
import Markdown from 'react-markdown';
import { generateContentWrapper, getSystemInstruction } from '../../services/geminiService';
import { TeacherActivitiesDashboard } from './TeacherActivitiesDashboard';
import { notificationService } from '../../services/notificationService';

export function TeacherActivitiesManager({ userProfile, selectedModel }: { userProfile: any, selectedModel: string }) {
  const [view, setView] = useState<'list' | 'create' | 'grade' | 'dashboard'>('list');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ActivitySubmission | null>(null);
  const [loading, setLoading] = useState(true);

  // Create Form State
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: 100,
    submissionType: 'mixed' as 'text' | 'file' | 'mixed',
    allowResubmission: false,
    acceptLate: true,
    maxAttachments: 3,
    rubricId: ''
  });

  // Grade Form State
  const [gradeData, setGradeData] = useState({
    grade: 0,
    concept: 'A',
    feedback: '',
    privateNotes: '',
    status: 'graded' as 'graded' | 'returned',
    rubricScores: {} as Record<string, { score: number; feedback: string }>
  });
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  useEffect(() => {
    fetchActivities();
    fetchRubrics();
  }, [userProfile.uid]);

  const fetchRubrics = async () => {
    try {
      const q = query(
        collection(db, 'rubrics'),
        where('createdBy', '==', userProfile.uid),
        where('isArchived', '==', false)
      );
      const snap = await getDocs(q);
      setRubrics(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rubric)));
    } catch (error) {
      console.error("Error fetching rubrics:", error);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'activities'),
        where('createdBy', '==', userProfile.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Erro ao carregar atividades.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (activityId: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'activity_submissions'),
        where('activityId', '==', activityId)
      );
      const snap = await getDocs(q);
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivitySubmission)));
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Erro ao carregar entregas.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async () => {
    if (!newActivity.title || !newActivity.description || !newActivity.dueDate) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await addDoc(collection(db, 'activities'), {
        ...newActivity,
        rubricId: newActivity.rubricId || null,
        createdBy: userProfile.uid,
        createdAt: serverTimestamp(),
        status: 'active'
      });

      // Notify all students
      try {
        const studentsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'aluno')));
        const studentIds = studentsSnapshot.docs.map(d => d.id);
        if (studentIds.length > 0) {
          await notificationService.notifyMultipleUsers(studentIds, {
            title: 'Nova Atividade Publicada',
            message: `O professor publicou a atividade: ${newActivity.title}`,
            type: 'activity_published',
            link: '/student-activities'
          });
        }
      } catch (notifErr) {
        console.error("Error notifying students:", notifErr);
      }

      toast.success("Atividade criada com sucesso!");
      setView('list');
      fetchActivities();
      setNewActivity({ 
        title: '', description: '', dueDate: '', points: 100, 
        submissionType: 'mixed', allowResubmission: false, acceptLate: true, maxAttachments: 3, rubricId: '' 
      });
    } catch (error) {
      console.error("Error creating activity:", error);
      toast.error("Erro ao criar atividade.");
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission?.id) return;

    try {
      const submissionRef = doc(db, 'activity_submissions', selectedSubmission.id);
      
      await updateDoc(submissionRef, {
        status: gradeData.status,
        grade: gradeData.grade,
        concept: gradeData.concept,
        feedback: gradeData.feedback,
        privateNotes: gradeData.privateNotes,
        rubricScores: gradeData.rubricScores,
        gradedAt: serverTimestamp(),
        gradedBy: userProfile.uid
      });

      // Notify student
      try {
        await notificationService.createNotification({
          userId: selectedSubmission.studentId,
          title: gradeData.status === 'returned' ? 'Atividade Devolvida' : 'Atividade Corrigida',
          message: gradeData.status === 'returned' 
            ? `Sua entrega de "${selectedActivity.title}" foi devolvida para ajustes.` 
            : `Sua entrega de "${selectedActivity.title}" foi avaliada. Nota: ${gradeData.grade}`,
          type: gradeData.status === 'returned' ? 'activity_returned' : 'activity_graded',
          link: '/student-activities'
        });
      } catch (notifErr) {
        console.error("Error notifying student:", notifErr);
      }

      // Log to history
      await addDoc(collection(db, 'submission_history'), {
        submissionId: selectedSubmission.id,
        action: gradeData.status === 'returned' ? 'returned' : 'graded',
        actorId: userProfile.uid,
        actorName: userProfile.displayName || 'Professor',
        timestamp: serverTimestamp(),
        comment: gradeData.status === 'returned' ? 'Devolvido para ajuste' : 'Avaliação concluída'
      });

      toast.success(gradeData.status === 'returned' ? "Atividade devolvida para ajuste!" : "Avaliação salva com sucesso!");
      setSelectedSubmission(null);
      if (selectedActivity?.id) {
        fetchSubmissions(selectedActivity.id);
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("Erro ao salvar avaliação.");
    }
  };

  const handleAIFeedback = async () => {
    if (!selectedSubmission || !selectedActivity) return;
    
    setIsGeneratingFeedback(true);
    try {
      const rubric = selectedActivity.rubricId ? rubrics.find(r => r.id === selectedActivity.rubricId) : null;
      
      let prompt = `
        Atue como um professor avaliador sênior.
        Atividade: ${selectedActivity.title}
        Descrição da Atividade: ${selectedActivity.description}
        Pontuação Máxima: ${selectedActivity.points}
        
        Resposta do Aluno:
        "${selectedSubmission.content}"
      `;

      if (rubric) {
        prompt += `
        Esta atividade utiliza uma RUBRICA de avaliação. Avalie o aluno em cada critério abaixo:
        ${rubric.criteria.map(c => `- ${c.title} (Máx: ${c.maxPoints} pts): ${c.description}`).join('\n')}
        
        Sua análise deve ser criteriosa e pedagógica.
        Retorne sua avaliação OBRIGATORIAMENTE no seguinte formato JSON:
        {
          "rubricScores": {
            ${rubric.criteria.map(c => `"${c.id}": { "score": number, "feedback": "string" }`).join(',\n            ')}
          },
          "generalFeedback": "string (inclua pontos fortes, lacunas identificadas e recomendações de estudo)",
          "totalGrade": number,
          "suggestedConcept": "A" | "B" | "C" | "D"
        }
        `;
      } else {
        prompt += `
        Sua análise deve destacar:
        1. Pontos Fortes da entrega;
        2. Lacunas de conhecimento ou erros cometidos;
        3. Recomendações de estudo específicas.

        Retorne sua avaliação OBRIGATORIAMENTE no seguinte formato JSON:
        {
          "generalFeedback": "string",
          "totalGrade": number,
          "suggestedConcept": "A" | "B" | "C" | "D"
        }
        `;
      }

      const response = await generateContentWrapper({
        model: selectedModel || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: getSystemInstruction('professor', 'smart_content'),
          responseMimeType: 'application/json'
        }
      });

      const result = JSON.parse(response.text);

      setGradeData(prev => ({ 
        ...prev, 
        feedback: result.generalFeedback,
        grade: result.totalGrade,
        concept: result.suggestedConcept || prev.concept,
        rubricScores: result.rubricScores || prev.rubricScores
      }));

      toast.success("Avaliação sugerida pela IA carregada com sucesso!");
    } catch (error) {
      console.error("Error generating AI feedback:", error);
      toast.error("Erro ao gerar feedback com IA. Verifique se o modelo suporta JSON.");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  if (loading && view === 'list') {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-indigo-600" /> Gestão de Atividades e Entregas
          </h2>
          <p className="text-gray-500 mt-1">Crie atividades, acompanhe entregas e forneça feedback aos alunos.</p>
        </div>
        {view === 'list' && (
          <div className="flex gap-3">
            <button
              onClick={() => setView('dashboard')}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2"
            >
              <TrendingUp size={20} /> Dashboard
            </button>
            <button
              onClick={() => setView('create')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Nova Atividade
            </button>
          </div>
        )}
        {view !== 'list' && view !== 'dashboard' && (
          <button
            onClick={() => { setView('list'); setSelectedActivity(null); setSelectedSubmission(null); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Voltar para Lista
          </button>
        )}
      </div>

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <TeacherActivitiesDashboard userProfile={userProfile} onBack={() => setView('list')} />
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhuma atividade criada ainda.</p>
            </div>
          ) : (
            activities.map(activity => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-gray-900 line-clamp-2">{activity.title}</h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${activity.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {activity.status === 'active' ? 'Ativa' : 'Encerrada'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-6 flex-1">
                  <p className="flex items-center gap-2"><Calendar size={16} /> Prazo: {new Date(activity.dueDate).toLocaleDateString()}</p>
                  <p className="flex items-center gap-2"><CheckCircle2 size={16} /> Valor: {activity.points} pts</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedActivity(activity);
                    fetchSubmissions(activity.id!);
                    setView('grade');
                  }}
                  className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Users size={18} /> Ver Entregas
                </button>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create View */}
      {view === 'create' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Criar Nova Atividade</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título da Atividade *</label>
              <input
                type="text"
                value={newActivity.title}
                onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: Resenha Crítica sobre IA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Instruções *</label>
              <textarea
                value={newActivity.description}
                onChange={e => setNewActivity({...newActivity, description: e.target.value})}
                className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Descreva o que o aluno deve fazer..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega *</label>
                <input
                  type="date"
                  value={newActivity.dueDate}
                  onChange={e => setNewActivity({...newActivity, dueDate: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rubrica de Avaliação (Opcional)</label>
                <select
                  value={newActivity.rubricId}
                  onChange={e => {
                    const rubricId = e.target.value;
                    const selectedRubric = rubrics.find(r => r.id === rubricId);
                    setNewActivity({
                      ...newActivity, 
                      rubricId,
                      points: selectedRubric ? selectedRubric.totalPoints : newActivity.points
                    });
                  }}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Nenhuma (Nota Manual)</option>
                  {rubrics.map(r => (
                    <option key={r.id} value={r.id}>{r.title} ({r.totalPoints} pts)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pontuação Máxima</label>
                <input
                  type="number"
                  value={newActivity.points}
                  onChange={e => setNewActivity({...newActivity, points: Number(e.target.value)})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                  disabled={!!newActivity.rubricId}
                  title={newActivity.rubricId ? "A pontuação é definida pela rubrica selecionada" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entrega</label>
                <select
                  value={newActivity.submissionType}
                  onChange={e => setNewActivity({...newActivity, submissionType: e.target.value as any})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="text">Apenas Texto</option>
                  <option value="file">Apenas Arquivo</option>
                  <option value="mixed">Texto e Arquivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Anexos</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newActivity.maxAttachments}
                  onChange={e => setNewActivity({...newActivity, maxAttachments: Number(e.target.value)})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={newActivity.submissionType === 'text'}
                />
              </div>
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newActivity.allowResubmission}
                  onChange={e => setNewActivity({...newActivity, allowResubmission: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                Permitir Reenvio
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newActivity.acceptLate}
                  onChange={e => setNewActivity({...newActivity, acceptLate: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                Aceitar Entrega com Atraso
              </label>
            </div>

            <button
              onClick={handleCreateActivity}
              className="w-full py-3 mt-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Publicar Atividade
            </button>
          </div>
        </motion.div>
      )}

      {/* Grade View */}
      {view === 'grade' && selectedActivity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <div className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-[calc(100vh-12rem)] overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-4 px-2">Entregas ({submissions.length})</h3>
            <div className="space-y-2">
              {submissions.length === 0 ? (
                <p className="text-sm text-gray-500 p-2">Nenhuma entrega recebida ainda.</p>
              ) : (
                submissions.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setGradeData({ 
                        grade: sub.grade || 0, 
                        concept: sub.concept || 'A',
                        feedback: sub.feedback || '',
                        privateNotes: sub.privateNotes || '',
                        status: sub.status === 'returned' ? 'returned' : 'graded',
                        rubricScores: sub.rubricScores || {}
                      });
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${selectedSubmission?.id === sub.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">{sub.studentName}</span>
                      {sub.status === 'graded' ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : sub.status === 'returned' ? (
                        <AlertCircle size={16} className="text-red-500" />
                      ) : (
                        <Clock size={16} className="text-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {sub.status === 'graded' ? `Nota: ${sub.grade}/${selectedActivity.points}` : sub.status === 'returned' ? 'Devolvida' : 'Aguardando Correção'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Grading Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[calc(100vh-12rem)] overflow-y-auto flex flex-col">
            {!selectedSubmission ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <FileText size={48} className="mb-4 text-gray-200" />
                <p>Selecione uma entrega ao lado para avaliar.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Entrega de {selectedSubmission.studentName}</h3>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 prose prose-sm max-w-none">
                    <Markdown>{selectedSubmission.content}</Markdown>
                  </div>
                  {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Anexos:</h4>
                      <ul className="space-y-1">
                        {selectedSubmission.attachments.map((att, i) => (
                          <li key={i} className="text-sm text-indigo-600 hover:underline cursor-pointer flex items-center gap-1">
                            <FileText size={14} /> {att.name} ({(att.size / 1024).toFixed(1)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900">Avaliação</h4>
                    <button
                      onClick={handleAIFeedback}
                      disabled={isGeneratingFeedback}
                      className="text-sm px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingFeedback ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Sugerir Feedback (IA)
                    </button>
                  </div>

                  {selectedActivity.rubricId && rubrics.find(r => r.id === selectedActivity.rubricId) ? (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h5 className="font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-indigo-600" /> 
                        Rubrica: {rubrics.find(r => r.id === selectedActivity.rubricId)?.title}
                      </h5>
                      {rubrics.find(r => r.id === selectedActivity.rubricId)?.criteria.map(criterion => (
                        <div key={criterion.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-sm text-gray-900">{criterion.title}</p>
                              <p className="text-xs text-gray-500">{criterion.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={criterion.maxPoints}
                                value={gradeData.rubricScores[criterion.id]?.score || 0}
                                onChange={e => {
                                  const score = Number(e.target.value);
                                  const newScores = {
                                    ...gradeData.rubricScores,
                                    [criterion.id]: { ...gradeData.rubricScores[criterion.id], score }
                                  };
                                  const totalGrade = Object.values(newScores).reduce((sum, s) => sum + s.score, 0);
                                  setGradeData({ ...gradeData, rubricScores: newScores, grade: totalGrade });
                                }}
                                className="w-16 p-1 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                              />
                              <span className="text-sm font-bold text-gray-400">/ {criterion.maxPoints}</span>
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Feedback específico para este critério (opcional)..."
                            value={gradeData.rubricScores[criterion.id]?.feedback || ''}
                            onChange={e => {
                              const newScores = {
                                ...gradeData.rubricScores,
                                [criterion.id]: { ...gradeData.rubricScores[criterion.id], feedback: e.target.value }
                              };
                              setGradeData({ ...gradeData, rubricScores: newScores });
                            }}
                            className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none mt-2"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nota Total (Máx: {selectedActivity.points})</label>
                      <input
                        type="number"
                        value={gradeData.grade}
                        onChange={e => setGradeData({...gradeData, grade: Number(e.target.value)})}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        disabled={!!selectedActivity.rubricId}
                        title={selectedActivity.rubricId ? "A nota é calculada automaticamente pela rubrica" : ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conceito</label>
                      <select
                        value={gradeData.concept}
                        onChange={e => setGradeData({...gradeData, concept: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="A">A - Excelente</option>
                        <option value="B">B - Bom</option>
                        <option value="C">C - Regular</option>
                        <option value="D">D - Insuficiente</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Pedagógico (Visível ao Aluno)</label>
                    <textarea
                      value={gradeData.feedback}
                      onChange={e => setGradeData({...gradeData, feedback: e.target.value})}
                      className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      placeholder="Escreva seus comentários sobre a entrega..."
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações Privadas (Apenas Professor)</label>
                    <textarea
                      value={gradeData.privateNotes}
                      onChange={e => setGradeData({...gradeData, privateNotes: e.target.value})}
                      className="w-full h-20 p-3 border border-amber-200 bg-amber-50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                      placeholder="Anotações internas..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setGradeData(prev => ({ ...prev, status: 'returned' }));
                        handleGradeSubmission();
                      }}
                      className="flex-1 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors"
                    >
                      Devolver para Ajuste
                    </button>
                    <button
                      onClick={() => {
                        setGradeData(prev => ({ ...prev, status: 'graded' }));
                        handleGradeSubmission();
                      }}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                    >
                      Finalizar Avaliação
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
