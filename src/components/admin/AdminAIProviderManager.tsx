import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Plus, Trash2, CheckCircle2, XCircle, Loader2, Webhook, Play } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { AIProviderConfig } from '../../types/edusaep.types';

export function AdminAIProviderManager() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProvider, setNewProvider] = useState<Partial<AIProviderConfig>>({
    name: '',
    provider: 'openai',
    apiKey: '',
    isActive: true,
    priority: 1,
    allowedRoles: ['admin', 'professor', 'aluno']
  });

  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const snap = await getDocs(collection(db, 'ai_providers'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIProviderConfig));
      setProviders(data.sort((a, b) => a.priority - b.priority));
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar provedores de IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newProvider.name || !newProvider.apiKey) {
      toast.error('Nome e API Key são obrigatórios.');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'ai_providers'), {
        ...newProvider,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setProviders([...providers, { id: docRef.id, ...newProvider } as AIProviderConfig]);
      setIsAdding(false);
      setNewProvider({ name: '', provider: 'openai', apiKey: '', isActive: true, priority: 1, allowedRoles: ['admin', 'professor', 'aluno'] });
      toast.success('Provedor adicionado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar provedor.');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ai_providers', id), { isActive: !currentStatus, updatedAt: new Date().toISOString() });
      setProviders(providers.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
      toast.success('Status atualizado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este provedor?')) return;
    try {
      await deleteDoc(doc(db, 'ai_providers', id));
      setProviders(providers.filter(p => p.id !== id));
      toast.success('Provedor excluído!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir provedor.');
    }
  };

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('/api/n8n/ai-webhook-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Teste de integração n8n via painel admin",
          model: "gemini-3-flash-preview"
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Webhook simulado com sucesso! Verifique o n8n.');
        console.log('n8n Response:', data.n8nResponse);
      } else {
        toast.error(`Erro na simulação: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao conectar com o servidor local.');
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-gray-400" /> Gestão de Provedores de IA
          </h2>
          <p className="text-gray-500">Configure chaves de API, fallback e permissões por perfil.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSimulateWebhook}
            disabled={isSimulating}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-200 transition-colors disabled:opacity-50"
          >
            {isSimulating ? <Loader2 size={18} className="animate-spin" /> : <Webhook size={18} />}
            Simular Webhook n8n
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} /> Adicionar Provedor
          </button>
        </div>
      </div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Novo Provedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Exibição</label>
              <input type="text" value={newProvider.name} onChange={e => setNewProvider({...newProvider, name: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Ex: OpenAI Principal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provedor</label>
              <select value={newProvider.provider} onChange={e => setNewProvider({...newProvider, provider: e.target.value as any})} className="w-full p-2 border rounded-lg">
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="deepseek">DeepSeek</option>
                <option value="groq">Groq</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input type="password" value={newProvider.apiKey} onChange={e => setNewProvider({...newProvider, apiKey: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="sk-..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade (menor = mais alta)</label>
              <input type="number" value={newProvider.priority} onChange={e => setNewProvider({...newProvider, priority: parseInt(e.target.value)})} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button onClick={handleAdd} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Salvar</button>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Provedor</th>
              <th className="p-4 font-medium">Prioridade</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {providers.map(provider => (
              <tr key={provider.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{provider.name}</td>
                <td className="p-4 text-gray-600 capitalize">{provider.provider}</td>
                <td className="p-4 text-gray-600">{provider.priority}</td>
                <td className="p-4">
                  <button onClick={() => toggleActive(provider.id!, provider.isActive)} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${provider.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {provider.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {provider.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => handleDelete(provider.id!)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum provedor configurado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
