// src/components/admin/ClassesManagementView.tsx
import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Class } from '../../types';
import { Plus, Pencil, Trash2, X, Check, Search, Users, AlertCircle, Loader2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { n8nEvents } from '../../services/n8nService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

// Sub-component to list students for a specific class
function StudentListModal({ classId, className, onClose }: { classId: string, className: string, onClose: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'STUDENT'), where('turmaId', '==', classId));
        const snap = await getDocs(q);
        setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [classId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-indigo-600" /> Alunos da Turma
            </h3>
            <p className="text-sm text-gray-500">{className}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : students.length === 0 ? (
            <p className="text-center text-gray-500 p-8">Nenhum aluno vinculado a esta turma ainda.</p>
          ) : (
            <ul className="space-y-3">
              {students.map(student => (
                <li key={student.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{student.name || student.displayName || 'Sem nome'}</p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                  {student.matricula && (
                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200">
                      {student.matricula}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function ClassesManagementView() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Class>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [classToShowStudents, setClassToShowStudents] = useState<Class | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const snap = await getDocs(collection(db, 'classes'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
      setClasses(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'classes');
      toast.error('Erro ao carregar turmas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!editForm.name || !editForm.period) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    try {
      const newClass = {
        name: editForm.name,
        period: editForm.period,
        status: editForm.status || 'active',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'classes'), newClass);
      
      // Trigger n8n automation
      await n8nEvents.classCreated({
        name: newClass.name,
        period: newClass.period,
        status: newClass.status
      });

      toast.success('Turma criada com sucesso!');
      setIsCreating(false);
      setEditForm({});
      fetchClasses();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classes');
      toast.error('Erro ao criar turma.');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.name || !editForm.period) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    try {
      await updateDoc(doc(db, 'classes', id), {
        name: editForm.name,
        period: editForm.period,
        status: editForm.status
      });
      toast.success('Turma atualizada com sucesso!');
      setIsEditing(null);
      setEditForm({});
      fetchClasses();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'classes');
      toast.error('Erro ao atualizar turma.');
    }
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    try {
      await deleteDoc(doc(db, 'classes', classToDelete));
      toast.success('Turma excluída com sucesso!');
      fetchClasses();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'classes');
      toast.error('Erro ao excluir turma.');
    } finally {
      setClassToDelete(null);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.period.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestão de Turmas</h1>
          <p className="text-gray-500 mt-1">Cadastre e gerencie as turmas da instituição.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar turmas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
            />
          </div>
          <button
            onClick={() => {
              setIsCreating(true);
              setEditForm({ status: 'active' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus size={18} />
            Nova Turma
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Nome da Turma</th>
              <th className="px-6 py-4">Período/Semestre</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isCreating && (
              <tr className="bg-indigo-50/50">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Ex: TDS 2024.1"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Ex: 2024.1"
                    value={editForm.period || ''}
                    onChange={e => setEditForm({...editForm, period: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={editForm.status || 'active'}
                    onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                  >
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={handleCreate} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                    <Check size={18} />
                  </button>
                  <button onClick={() => setIsCreating(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X size={18} />
                  </button>
                </td>
              </tr>
            )}

            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Carregando turmas...</td></tr>
            ) : filteredClasses.length === 0 && !isCreating ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p>Nenhuma turma encontrada.</p>
                </td>
              </tr>
            ) : (
              filteredClasses.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  {isEditing === c.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.period || ''}
                          onChange={e => setEditForm({...editForm, period: e.target.value})}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editForm.status || 'active'}
                          onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                        >
                          <option value="active">Ativa</option>
                          <option value="inactive">Inativa</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleUpdate(c.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                          <Check size={18} />
                        </button>
                        <button onClick={() => setIsEditing(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                          <X size={18} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-4 text-gray-600">{c.period}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {c.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => setClassToShowStudents(c)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver Alunos"
                        >
                          <Users size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditing(c.id);
                            setEditForm(c);
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar Turma"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => setClassToDelete(c.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir Turma"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {classToShowStudents && (
          <StudentListModal 
            classId={classToShowStudents.id} 
            className={`${classToShowStudents.name} (${classToShowStudents.period})`}
            onClose={() => setClassToShowStudents(null)} 
          />
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {classToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Turma?</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Tem certeza? Esta ação apagará o cadastro da turma, mas os alunos continuarão ativos no sistema.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setClassToDelete(null)}
                  className="flex-1 py-3 text-gray-700 font-bold bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 text-white font-bold bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
