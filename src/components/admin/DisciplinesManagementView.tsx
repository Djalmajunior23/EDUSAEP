// src/components/admin/DisciplinesManagementView.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Discipline } from '../../types';
import { Plus, Pencil, Trash2, X, Check, Search, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export function DisciplinesManagementView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [professors, setProfessors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Discipline | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Discipline>>({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchDisciplines();
    fetchProfessors();
  }, []);

  const fetchDisciplines = async () => {
    try {
      const snap = await getDocs(collection(db, 'disciplines'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Discipline));
      setDisciplines(data);
    } catch (error) {
      console.error('Error fetching disciplines:', error);
      toast.error('Erro ao carregar disciplinas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessors = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'professor')));
      const data = snap.docs.map(doc => {
        const userData = doc.data() as any;
        return { id: doc.id, name: userData.displayName || userData.email || 'Professor' };
      });
      setProfessors(data);
    } catch (error) {
      console.error('Error fetching professors:', error);
    }
  };

  const handleCreate = async () => {
    if (!editForm.name || !editForm.code) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    try {
      const newDiscipline = {
        name: editForm.name,
        code: editForm.code,
        description: editForm.description || '',
        area: editForm.area || 'Geral',
        teacherId: editForm.teacherId || null,
        status: editForm.status || 'active',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'disciplines'), newDiscipline);
      toast.success('Disciplina criada com sucesso!');
      setIsCreating(false);
      setEditForm({});
      fetchDisciplines();
    } catch (error) {
      console.error('Error creating discipline:', error);
      toast.error('Erro ao criar disciplina.');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.name || !editForm.code) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    try {
      await updateDoc(doc(db, 'disciplines', id), {
        name: editForm.name,
        code: editForm.code,
        description: editForm.description || '',
        area: editForm.area || 'Geral',
        teacherId: editForm.teacherId || null,
        status: editForm.status
      });
      toast.success('Disciplina atualizada com sucesso!');
      setIsEditing(null);
      setEditForm({});
      fetchDisciplines();
    } catch (error) {
      console.error('Error updating discipline:', error);
      toast.error('Erro ao atualizar disciplina.');
    }
  };

  const handleDelete = async (id: string) => {
    // if (!window.confirm('Tem certeza que deseja excluir esta disciplina?')) return;
    toast.info('Excluindo disciplina...');
    try {
      await deleteDoc(doc(db, 'disciplines', id));
      toast.success('Disciplina excluída com sucesso!');
      fetchDisciplines();
    } catch (error) {
      console.error('Error deleting discipline:', error);
      toast.error('Erro ao excluir disciplina.');
    }
  };

  const handleSort = (key: keyof Discipline) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredDisciplines = disciplines
    .filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestão de Disciplinas</h1>
          <p className="text-gray-500 mt-1">Cadastre e gerencie as disciplinas e competências principais.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar disciplinas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
            />
          </div>
          <button
            onClick={() => {
              setIsCreating(true);
              setEditForm({ status: 'active', area: 'Geral' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus size={18} />
            Nova Disciplina
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('code')}>Código {sortConfig.key === 'code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>Nome da Disciplina {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('area')}>Área {sortConfig.key === 'area' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('teacherId')}>Professor {sortConfig.key === 'teacherId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isCreating && (
              <tr className="bg-indigo-50/50">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Ex: UC-001"
                    value={editForm.code || ''}
                    onChange={e => setEditForm({...editForm, code: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Ex: Desenvolvimento Web"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Ex: Tecnologia"
                    value={editForm.area || ''}
                    onChange={e => setEditForm({...editForm, area: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={editForm.teacherId || ''}
                    onChange={e => setEditForm({...editForm, teacherId: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                  >
                    <option value="">Selecione um professor</option>
                    {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
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
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando disciplinas...</td></tr>
            ) : filteredDisciplines.length === 0 && !isCreating ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p>Nenhuma disciplina encontrada.</p>
                </td>
              </tr>
            ) : (
              filteredDisciplines.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  {isEditing === d.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.code || ''}
                          onChange={e => setEditForm({...editForm, code: e.target.value})}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                        />
                      </td>
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
                          value={editForm.area || ''}
                          onChange={e => setEditForm({...editForm, area: e.target.value})}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editForm.teacherId || ''}
                          onChange={e => setEditForm({...editForm, teacherId: e.target.value})}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                        >
                          <option value="">Selecione um professor</option>
                          {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
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
                        <button onClick={() => handleUpdate(d.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                          <Check size={18} />
                        </button>
                        <button onClick={() => setIsEditing(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                          <X size={18} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{d.code}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{d.name}</td>
                      <td className="px-6 py-4 text-gray-600">{d.area}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {professors.find(p => p.id === d.teacherId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {d.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => {
                            setIsEditing(d.id);
                            setEditForm(d);
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(d.id)}
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
