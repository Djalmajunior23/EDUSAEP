import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../../services/errorService';

interface TasksViewProps {
  user: User | null;
}

export function TasksView({ user }: TasksViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('tasks_draft_title');
    if (draft) {
      setNewTaskTitle(draft);
    }
  }, []);

  // Save draft to localStorage whenever newTaskTitle changes
  useEffect(() => {
    if (newTaskTitle) {
      localStorage.setItem('tasks_draft_title', newTaskTitle);
    } else {
      localStorage.removeItem('tasks_draft_title');
    }
  }, [newTaskTitle]);

  useEffect(() => {
    if (!user) return;

    const path = 'tasks';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;

    const path = 'tasks';
    const newTaskDesc = {
      id: 'temp-' + Date.now(),
      userId: user.uid,
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Optimistic Update
    setTasks(prev => [newTaskDesc, ...prev]);
    setNewTaskTitle('');
    localStorage.removeItem('tasks_draft_title');

    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        title: newTaskDesc.title,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Tarefa adicionada!');
    } catch (err) {
      // Rollback
      setTasks(prev => prev.filter(t => t.id !== newTaskDesc.id));
      toast.error('Erro ao adicionar tarefa.');
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const toggleTask = async (task: any) => {
    const path = `tasks/${task.id}`;
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));

    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: !task.completed,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      // Rollback
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
      toast.error('Erro ao atualizar tarefa.');
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    const path = `tasks/${id}`;
    
    // Optimistic Update
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await deleteDoc(doc(db, 'tasks', id));
      toast.success('Tarefa excluída!');
    } catch (err) {
      // Rollback
      if (taskToDelete) setTasks(prev => [...prev, taskToDelete].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      toast.error('Erro ao excluir tarefa.');
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const startEditing = (task: any) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const saveEdit = async (id: string) => {
    if (!editingTaskTitle.trim()) return;
    const path = `tasks/${id}`;
    try {
      await updateDoc(doc(db, 'tasks', id), {
        title: editingTaskTitle.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingTaskId(null);
      toast.success('Tarefa atualizada!');
    } catch (err) {
      toast.error('Erro ao atualizar tarefa.');
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold dark:text-white">Lista de Tarefas</h2>
        <p className="text-gray-500 dark:text-gray-400">Gerencie suas atividades pedagógicas e metas.</p>
      </div>

      <form onSubmit={addTask} className="flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Adicionar nova tarefa..."
          className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-sm dark:text-white"
        />
        <button
          type="submit"
          disabled={!newTaskTitle.trim()}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100 dark:shadow-none"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </form>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-12 rounded-2xl border border-gray-200 dark:border-gray-800 text-center space-y-4">
            <CheckSquare className="mx-auto text-gray-200 dark:text-gray-700" size={48} />
            <p className="text-gray-500 dark:text-gray-400 italic">Sua lista está vazia. Comece adicionando uma tarefa acima!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div
              layout
              key={task.id}
              className={cn(
                "bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 group transition-all",
                task.completed && "bg-gray-50/50 dark:bg-gray-800/50 opacity-75"
              )}
            >
              <button
                onClick={() => toggleTask(task)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  task.completed 
                    ? "bg-emerald-500 border-emerald-500 text-white" 
                    : "border-gray-300 dark:border-gray-600 hover:border-emerald-500"
                )}
              >
                {task.completed && <CheckCircle2 size={14} />}
              </button>

              {editingTaskId === task.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editingTaskTitle}
                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                    className="flex-1 px-2 py-1 border-b-2 border-emerald-500 outline-none bg-transparent font-medium dark:text-white"
                  />
                  <button 
                    onClick={() => saveEdit(task.id)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Salvar
                  </button>
                  <button 
                    onClick={() => setEditingTaskId(null)}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-gray-900 dark:text-gray-100 truncate",
                    task.completed && "line-through text-gray-400 dark:text-gray-500"
                  )}>
                    {task.title}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Criado em {task.createdAt?.seconds ? new Date(task.createdAt.seconds * 1000).toLocaleDateString() : new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEditing(task)}
                  className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
