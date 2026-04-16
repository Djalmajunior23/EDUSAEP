import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Plus, Trash2, Copy, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Rubric, RubricCriterion } from '../../types/edusaep.types';

export function TeacherRubricsManager({ userProfile }: { userProfile: any }) {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'editor'>('list');
  
  // Editor State
  const [editingRubric, setEditingRubric] = useState<Partial<Rubric> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRubrics();
  }, [userProfile.uid]);

  const fetchRubrics = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'rubrics'),
        where('createdBy', '==', userProfile.uid),
        where('isArchived', '==', false),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setRubrics(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rubric)));
    } catch (error) {
      console.error("Error fetching rubrics:", error);
      toast.error("Erro ao carregar rubricas.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingRubric({
      title: '',
      description: '',
      criteria: [
        { id: Date.now().toString(), title: '', description: '', maxPoints: 10 }
      ],
      totalPoints: 10
    });
    setView('editor');
  };

  const handleEdit = (rubric: Rubric) => {
    setEditingRubric(JSON.parse(JSON.stringify(rubric))); // Deep copy
    setView('editor');
  };

  const handleDuplicate = async (rubric: Rubric) => {
    try {
      const newRubric = {
        ...rubric,
        title: `${rubric.title} (Cópia)`,
        createdBy: userProfile.uid,
        createdAt: serverTimestamp(),
        isArchived: false
      };
      delete newRubric.id;
      
      await addDoc(collection(db, 'rubrics'), newRubric);
      toast.success("Rubrica duplicada com sucesso!");
      fetchRubrics();
    } catch (error) {
      console.error("Error duplicating rubric:", error);
      toast.error("Erro ao duplicar rubrica.");
    }
  };

  const handleArchive = async (rubricId: string) => {
    if (!window.confirm("Tem certeza que deseja arquivar esta rubrica? Ela não aparecerá mais na lista, mas continuará funcionando nas atividades já vinculadas.")) return;
    
    try {
      await updateDoc(doc(db, 'rubrics', rubricId), { isArchived: true });
      toast.success("Rubrica arquivada com sucesso!");
      fetchRubrics();
    } catch (error) {
      console.error("Error archiving rubric:", error);
      toast.error("Erro ao arquivar rubrica.");
    }
  };

  const handleSave = async () => {
    if (!editingRubric?.title) {
      toast.error("O título da rubrica é obrigatório.");
      return;
    }
    if (!editingRubric.criteria || editingRubric.criteria.length === 0) {
      toast.error("Adicione pelo menos um critério.");
      return;
    }
    
    // Validate criteria
    for (const c of editingRubric.criteria) {
      if (!c.title || c.maxPoints <= 0) {
        toast.error("Todos os critérios devem ter título e pontuação maior que zero.");
        return;
      }
    }

    setSaving(true);
    try {
      const totalPoints = editingRubric.criteria.reduce((sum, c) => sum + Number(c.maxPoints), 0);
      const payload = {
        ...editingRubric,
        totalPoints,
        createdBy: userProfile.uid,
        isArchived: false,
        updatedAt: serverTimestamp()
      };

      if (editingRubric.id) {
        await updateDoc(doc(db, 'rubrics', editingRubric.id), payload);
        toast.success("Rubrica atualizada com sucesso!");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'rubrics'), payload);
        toast.success("Rubrica criada com sucesso!");
      }
      
      setView('list');
      fetchRubrics();
    } catch (error) {
      console.error("Error saving rubric:", error);
      toast.error("Erro ao salvar rubrica.");
    } finally {
      setSaving(false);
    }
  };

  const addCriterion = () => {
    if (!editingRubric) return;
    setEditingRubric({
      ...editingRubric,
      criteria: [
        ...(editingRubric.criteria || []),
        { id: Date.now().toString(), title: '', description: '', maxPoints: 10 }
      ]
    });
  };

  const updateCriterion = (id: string, field: keyof RubricCriterion, value: any) => {
    if (!editingRubric) return;
    const updatedCriteria = editingRubric.criteria?.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ) || [];
    
    setEditingRubric({
      ...editingRubric,
      criteria: updatedCriteria,
      totalPoints: updatedCriteria.reduce((sum, c) => sum + Number(c.maxPoints), 0)
    });
  };

  const removeCriterion = (id: string) => {
    if (!editingRubric) return;
    const updatedCriteria = editingRubric.criteria?.filter(c => c.id !== id) || [];
    setEditingRubric({
      ...editingRubric,
      criteria: updatedCriteria,
      totalPoints: updatedCriteria.reduce((sum, c) => sum + Number(c.maxPoints), 0)
    });
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
            <CheckCircle2 className="text-indigo-600" /> Banco de Rubricas
          </h2>
          <p className="text-gray-500 mt-1">Crie e gerencie critérios estruturados de avaliação.</p>
        </div>
        {view === 'list' ? (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} /> Nova Rubrica
          </button>
        ) : (
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Voltar
          </button>
        )}
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rubrics.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhuma rubrica criada ainda.</p>
              <button
                onClick={handleCreateNew}
                className="mt-4 text-indigo-600 font-medium hover:underline"
              >
                Criar sua primeira rubrica
              </button>
            </div>
          ) : (
            rubrics.map(rubric => (
              <motion.div
                key={rubric.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{rubric.title}</h3>
                  <span className="px-2 py-1 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 whitespace-nowrap">
                    {rubric.totalPoints} pts
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{rubric.description || 'Sem descrição'}</p>
                <div className="text-xs text-gray-400 mb-4">
                  {rubric.criteria.length} critério(s) definidos
                </div>
                
                <div className="flex gap-2 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => handleEdit(rubric)}
                    className="flex-1 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDuplicate(rubric)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="Duplicar"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => handleArchive(rubric.id!)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Arquivar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Editor View */}
      {view === 'editor' && editingRubric && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informações Gerais</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título da Rubrica *</label>
                <input
                  type="text"
                  value={editingRubric.title}
                  onChange={e => setEditingRubric({...editingRubric, title: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Avaliação de Redação Dissertativa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={editingRubric.description}
                  onChange={e => setEditingRubric({...editingRubric, description: e.target.value})}
                  className="w-full h-24 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Descreva o propósito desta rubrica..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Critérios de Avaliação</h3>
              <div className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                Total: {editingRubric.totalPoints || 0} pts
              </div>
            </div>

            <div className="space-y-4">
              {editingRubric.criteria?.map((criterion, index) => (
                <div key={criterion.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative group">
                  <button
                    onClick={() => removeCriterion(criterion.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pr-8">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Critério {index + 1}</label>
                      <input
                        type="text"
                        value={criterion.title}
                        onChange={e => updateCriterion(criterion.id, 'title', e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Ex: Clareza e Coesão"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pontuação Máx.</label>
                      <input
                        type="number"
                        min="1"
                        value={criterion.maxPoints}
                        onChange={e => updateCriterion(criterion.id, 'maxPoints', Number(e.target.value))}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descrição do Critério</label>
                    <textarea
                      value={criterion.description}
                      onChange={e => updateCriterion(criterion.id, 'description', e.target.value)}
                      className="w-full h-20 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                      placeholder="Descreva o que é esperado para atingir a nota máxima neste critério..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addCriterion}
              className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl font-medium hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Adicionar Critério
            </button>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => setView('list')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              Salvar Rubrica
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
