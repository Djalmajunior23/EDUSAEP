import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Target,
  Plus,
  Link as LinkIcon
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function ActivityList({ userProfile }: { userProfile: any }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !userProfile?.turmaId) return;

    // Fetch activities for the student's class
    const qAct = query(
      collection(db, 'activities'), 
      where('turmaId', '==', userProfile.turmaId),
      where('status', '==', 'published')
    );
    const unsubAct = onSnapshot(qAct, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch student's submissions
    const qSub = query(
      collection(db, 'activity_submissions'),
      where('studentId', '==', auth.currentUser.uid)
    );
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      const subs: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        subs[data.activityId] = { id: doc.id, ...data };
      });
      setSubmissions(subs);
    });

    return () => {
      unsubAct();
      unsubSub();
    };
  }, [userProfile]);

  const handleSubmit = async (activityId: string) => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'activity_submissions'), {
        activityId,
        studentId: auth.currentUser.uid,
        content: submissionContent,
        status: 'delivered',
        submittedAt: serverTimestamp(),
      });
      
      // Gain XP (simplified feedback)
      toast.success('Atividade enviada! Parabéns!');
      setIsSubmitting(null);
      setSubmissionContent('');
    } catch (error) {
      console.error('Error submitting activity:', error);
      toast.error('Erro ao enviar atividade.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando atividades...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Atividades</h2>
          <p className="text-sm text-gray-500">Acompanhe seus prazos e entregas para ganhar XP.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activities.map((activity) => {
          const submission = submissions[activity.id];
          const isOverdue = activity.deadline && new Date(activity.deadline) < new Date() && !submission;

          return (
            <div 
              key={activity.id}
              className={`bg-white dark:bg-gray-900 p-6 rounded-3xl border shadow-sm transition-all ${
                submission ? 'border-emerald-100 dark:border-emerald-900/20' : 
                isOverdue ? 'border-red-100 dark:border-red-900/20' :
                'border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${
                    submission ? 'bg-emerald-100 text-emerald-600' : 
                    isOverdue ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{activity.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={14} />
                        Prazo: {activity.deadline ? format(new Date(activity.deadline), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Sem prazo'}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                        <Target size={14} />
                        +{activity.xpReward} XP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {submission ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-xl text-xs font-bold">
                      <CheckCircle2 size={16} />
                      {submission.status === 'graded' ? `Nota: ${submission.grade}` : 'Entregue'}
                    </div>
                  ) : isOverdue ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-xl text-xs font-bold">
                      <AlertCircle size={16} />
                      Atrasada
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsSubmitting(activity.id)}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                      Enviar Atividade
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {isSubmitting === activity.id && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800"
                >
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Sua Resposta</label>
                  <textarea 
                    rows={4}
                    value={submissionContent}
                    onChange={e => setSubmissionContent(e.target.value)}
                    placeholder="Escreva sua resposta aqui ou cole links de anexos..."
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm mb-4 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-gray-500 text-xs font-medium hover:text-emerald-600 cursor-pointer">
                        <Plus size={14} />
                        Anexar Arquivo
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => {
                            const MAX_SIZE = 5 * 1024 * 1024;
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              if (file.size > MAX_SIZE) {
                                toast.error('O arquivo excede o limite de 5MB.');
                                e.target.value = '';
                                return;
                              }
                              toast.success(`Arquivo ${file.name} selecionado.`);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[10px] text-gray-400 font-medium">(Máx 5MB)</span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsSubmitting(null)}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl text-xs font-bold"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleSubmit(activity.id)}
                        disabled={!submissionContent.trim()}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Send size={14} />
                        Confirmar Entrega
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
