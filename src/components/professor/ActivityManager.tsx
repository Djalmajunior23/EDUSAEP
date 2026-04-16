import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Users,
  ChevronRight,
  Filter,
  MoreVertical,
  Target
} from 'lucide-react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function ActivityManager() {
  const [activities, setActivities] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    type: 'exercise',
    turmaId: '',
    deadline: '',
    xpReward: 50,
    status: 'published'
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch activities
    const q = query(
      collection(db, 'activities'), 
      where('professorId', '==', auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch classes
    const qTurmas = query(collection(db, 'classes'));
    const unsubTurmas = onSnapshot(qTurmas, (snapshot) => {
      setTurmas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubTurmas();
    };
  }, []);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'activities'), {
        ...newActivity,
        professorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewActivity({
        title: '',
        description: '',
        type: 'exercise',
        turmaId: '',
        deadline: '',
        xpReward: 50,
        status: 'published'
      });
      toast.success('Atividade criada com sucesso!');
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Erro ao criar atividade.');
    }
  };

  const filteredActivities = activities.filter(act => {
    if (filter === 'all') return true;
    return act.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Atividades</h2>
          <p className="text-sm text-gray-500">Crie, gerencie e acompanhe as atividades pedagógicas.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm"
        >
          <Plus size={20} />
          Nova Atividade
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por título ou turma..." 
            className="flex-1 bg-transparent border-none outline-none text-sm p-2"
          />
        </div>
        <div className="h-8 w-px bg-gray-100 dark:bg-gray-800" />
        <div className="flex items-center gap-1 p-1">
          {['all', 'published', 'draft', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === f 
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {f === 'all' ? 'Tudo' : f === 'published' ? 'Publicadas' : f === 'draft' ? 'Rascunhos' : 'Encerradas'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${
                  activity.type === 'essay' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'project' ? 'bg-purple-100 text-purple-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  <FileText size={24} />
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    activity.status === 'published' ? 'bg-emerald-100 text-emerald-600' :
                    activity.status === 'draft' ? 'bg-gray-100 text-gray-500' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {activity.status}
                  </span>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{activity.title}</h3>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">{activity.description}</p>

              <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Users size={14} />
                    Turma
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {turmas.find(t => t.id === activity.turmaId)?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Calendar size={14} />
                    Prazo
                  </span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {activity.deadline ? format(new Date(activity.deadline), "dd 'de' MMM", { locale: ptBR }) : 'Sem prazo'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Target size={14} />
                    Recompensa
                  </span>
                  <span className="font-bold text-amber-600">+{activity.xpReward} XP</span>
                </div>
              </div>

              <button className="w-full mt-6 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-gray-100 dark:border-gray-800">
                Ver Entregas
                <ChevronRight size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAdding && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Criar Nova Atividade</h3>
              <form onSubmit={handleCreateActivity} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título</label>
                  <input 
                    required
                    type="text" 
                    value={newActivity.title}
                    onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                    placeholder="Ex: Resenha Crítica sobre Revolução Industrial"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição</label>
                  <textarea 
                    required
                    rows={3}
                    value={newActivity.description}
                    onChange={e => setNewActivity({...newActivity, description: e.target.value})}
                    placeholder="Instruções para os alunos..."
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo</label>
                    <select 
                      value={newActivity.type}
                      onChange={e => setNewActivity({...newActivity, type: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm"
                    >
                      <option value="exercise">Exercício</option>
                      <option value="essay">Redação</option>
                      <option value="project">Projeto</option>
                      <option value="research">Pesquisa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Turma</label>
                    <select 
                      required
                      value={newActivity.turmaId}
                      onChange={e => setNewActivity({...newActivity, turmaId: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm"
                    >
                      <option value="">Selecionar...</option>
                      {turmas.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Prazo</label>
                    <input 
                      type="datetime-local" 
                      value={newActivity.deadline}
                      onChange={e => setNewActivity({...newActivity, deadline: e.target.value})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">XP</label>
                    <input 
                      type="number" 
                      value={newActivity.xpReward}
                      onChange={e => setNewActivity({...newActivity, xpReward: parseInt(e.target.value)})}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm"
                  >
                    Salvar Atividade
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
