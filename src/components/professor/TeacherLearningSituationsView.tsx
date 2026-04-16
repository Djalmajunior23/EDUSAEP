import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle2, Clock, Users, Loader2, Eye, Edit2, Copy, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { LearningSituation, SASubmission } from '../../types/edusaep.types';

export function TeacherLearningSituationsView({ userProfile }: { userProfile: any }) {
  const [situations, setSituations] = useState<LearningSituation[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SASubmission[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSA, setSelectedSA] = useState<LearningSituation | null>(null);
  const [editingSA, setEditingSA] = useState<LearningSituation | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch teacher's SAs
      const saQuery = query(collection(db, 'learning_situations'), where('createdBy', '==', userProfile.uid));
      const saSnap = await getDocs(saQuery);
      const saData = saSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningSituation));
      setSituations(saData);

      // Fetch submissions for these SAs
      if (saData.length > 0) {
        const saIds = saData.map(sa => sa.id!);
        // Firestore 'in' query is limited to 10 items, so we fetch all and filter if needed, 
        // or just fetch all submissions and filter locally for simplicity in this prototype
        const subSnap = await getDocs(collection(db, 'sa_submissions'));
        const subData: Record<string, SASubmission[]> = {};
        
        subSnap.docs.forEach(doc => {
          const data = doc.data() as SASubmission;
          if (saIds.includes(data.saId)) {
            if (!subData[data.saId]) subData[data.saId] = [];
            subData[data.saId].push({ id: doc.id, ...data });
          }
        });
        setSubmissions(subData);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar Situações de Aprendizagem.');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (sa: LearningSituation) => {
    try {
      const newStatus = sa.status === 'published' ? 'draft' : 'published';
      await updateDoc(doc(db, 'learning_situations', sa.id!), { status: newStatus });
      setSituations(situations.map(s => s.id === sa.id ? { ...s, status: newStatus } : s));
      toast.success(`Situação de Aprendizagem ${newStatus === 'published' ? 'publicada' : 'ocultada'} com sucesso!`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao alterar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta Situação de Aprendizagem?')) return;
    try {
      await deleteDoc(doc(db, 'learning_situations', id));
      setSituations(situations.filter(s => s.id !== id));
      toast.success('Excluída com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir.');
    }
  };

  const handleDuplicate = async (sa: LearningSituation) => {
    try {
      const { id, ...rest } = sa;
      const duplicatedSA = {
        ...rest,
        title: `${sa.title} (Cópia)`,
        createdAt: new Date().toISOString(),
        status: 'draft' as const
      };
      
      const docRef = await addDoc(collection(db, 'learning_situations'), duplicatedSA);
      setSituations([{ id: docRef.id, ...duplicatedSA }, ...situations]);
      toast.success('Situação de Aprendizagem duplicada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao duplicar.');
    }
  };

  const handleUpdate = async () => {
    if (!editingSA || !editingSA.id) return;
    setIsSaving(true);
    try {
      const { id, ...data } = editingSA;
      await updateDoc(doc(db, 'learning_situations', id), data as any);
      setSituations(situations.map(s => s.id === id ? editingSA : s));
      setEditingSA(null);
      toast.success('Situação de Aprendizagem atualizada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (editingSA) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Situação de Aprendizagem</h2>
            <p className="text-sm text-gray-500">Ajuste os detalhes do cenário pedagógico</p>
          </div>
          <button 
            onClick={() => setEditingSA(null)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Título</label>
              <input 
                type="text" 
                value={editingSA.title}
                onChange={e => setEditingSA({...editingSA, title: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Curso</label>
              <input 
                type="text" 
                value={editingSA.course}
                onChange={e => setEditingSA({...editingSA, course: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Contextualização</label>
            <textarea 
              value={editingSA.context}
              onChange={e => setEditingSA({...editingSA, context: e.target.value})}
              className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Desafio Central</label>
            <textarea 
              value={editingSA.centralChallenge}
              onChange={e => setEditingSA({...editingSA, centralChallenge: e.target.value})}
              className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Complexidade</label>
              <select 
                value={editingSA.complexity}
                onChange={e => setEditingSA({...editingSA, complexity: e.target.value as any})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="fácil">Fácil</option>
                <option value="médio">Médio</option>
                <option value="difícil">Difícil</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Duração</label>
              <input 
                type="text" 
                value={editingSA.duration}
                onChange={e => setEditingSA({...editingSA, duration: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Competência</label>
              <input 
                type="text" 
                value={editingSA.competency}
                onChange={e => setEditingSA({...editingSA, competency: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Recursos (um por linha)</label>
              <textarea 
                value={editingSA.resources.join('\n')}
                onChange={e => setEditingSA({...editingSA, resources: e.target.value.split('\n').filter(r => r.trim())})}
                className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Entregáveis (um por linha)</label>
              <textarea 
                value={editingSA.deliverables.join('\n')}
                onChange={e => setEditingSA({...editingSA, deliverables: e.target.value.split('\n').filter(d => d.trim())})}
                className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button 
              onClick={() => setEditingSA(null)}
              className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleUpdate}
              disabled={isSaving}
              className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewingSubmissions && selectedSA) {
    const saSubmissions = submissions[selectedSA.id!] || [];
    
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <button onClick={() => { setViewingSubmissions(false); setSelectedSA(null); }} className="text-indigo-600 hover:underline font-medium">
          &larr; Voltar para lista
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Entregas: {selectedSA.title}</h2>
          <p className="text-gray-500 mb-6">Total de entregas: {saSubmissions.length}</p>

          <div className="space-y-4">
            {saSubmissions.map(sub => (
              <div key={sub.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">{sub.studentName}</h4>
                    <p className="text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {sub.status === 'graded' ? `Avaliado: ${sub.grade} pts` : 'Pendente de Avaliação'}
                  </span>
                </div>
                <div className="prose max-w-none text-sm text-gray-700 bg-white p-4 rounded border border-gray-100">
                  {sub.content}
                </div>
              </div>
            ))}
            {saSubmissions.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhuma entrega recebida ainda.</p>
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
          <BookOpen className="text-indigo-600" /> Minhas Situações de Aprendizagem
        </h2>
        <p className="text-gray-500">Gerencie as SAs geradas e acompanhe as entregas dos alunos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {situations.map(sa => {
          const subsCount = submissions[sa.id!]?.length || 0;
          return (
            <motion.div
              key={sa.id}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{sa.course}</span>
                <button
                  onClick={() => togglePublish(sa)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    sa.status === 'published' 
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sa.status === 'published' ? 'Publicado' : 'Rascunho'}
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{sa.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-grow">{sa.centralChallenge}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-50 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1 text-gray-500"><Users size={16} /> {subsCount} entregas</span>
                  <span className="flex items-center gap-1 text-gray-500"><Clock size={16} /> {sa.duration}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedSA(sa); setViewingSubmissions(true); }}
                    className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                    title="Ver entregas dos alunos"
                  >
                    <Eye size={16} /> Entregas
                  </button>
                  <button
                    onClick={() => setEditingSA(sa)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(sa)}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Duplicar/Reutilizar"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(sa.id!)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {situations.length === 0 && (
          <div className="col-span-full text-center p-12 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
            <p className="text-gray-500">Você ainda não gerou nenhuma Situação de Aprendizagem.</p>
            <p className="text-sm text-indigo-600 mt-2">Use o Gerador de SA para criar a primeira.</p>
          </div>
        )}
      </div>
    </div>
  );
}
