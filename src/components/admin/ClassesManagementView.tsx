// src/components/admin/ClassesManagementView.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Class } from '../../types';
import { Plus, Pencil, Trash2, X, Check, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

export function ClassesManagementView() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Class>>({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const snap = await getDocs(collection(db, 'classes'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
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
      toast.success('Turma criada com sucesso!');
      setIsCreating(false);
      setEditForm({});
      fetchClasses();
    } catch (error) {
      console.error('Error creating class:', error);
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
      console.error('Error updating class:', error);
      toast.error('Erro ao atualizar turma.');
    }
  };

  const handleDelete = async (id: string) => {
    // if (!window.confirm('Tem certeza que deseja excluir esta turma?')) return;
    toast.info('Excluindo turma...');
    try {
      await deleteDoc(doc(db, 'classes', id));
      toast.success('Turma excluída com sucesso!');
      fetchClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Erro ao excluir turma.');
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
                          onClick={() => {
                            setIsEditing(c.id);
                            setEditForm(c);
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    </div>
  );
}
