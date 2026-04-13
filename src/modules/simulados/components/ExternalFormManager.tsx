import { useState, useEffect } from 'react';
import { 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Loader2,
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { simuladoService } from '../services/simuladoService';
import { testWebhook } from '../../../services/n8nService';
import { SimuladoForm } from '../types';
import { toast } from 'sonner';
import { User } from 'firebase/auth';
import { handleFirestoreError, OperationType } from '../../../services/errorService';

interface ExternalFormManagerProps {
  simuladoId: string;
  user: User | null;
  webhookUrl: string;
}

export function ExternalFormManager({ simuladoId, user, webhookUrl }: ExternalFormManagerProps) {
  const [form, setForm] = useState<SimuladoForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTestConnection = async () => {
    const effectiveUrl = await getEffectiveWebhookUrl();
    if (!effectiveUrl) {
      toast.error("URL do Webhook n8n não configurada.");
      return;
    }
    setIsTesting(true);
    setTestStatus('idle');
    try {
      const success = await testWebhook(effectiveUrl, { action: 'test' });
      if (success) {
        setTestStatus('success');
        toast.success("Conexão com Webhook bem-sucedida!");
      } else {
        setTestStatus('error');
        toast.error("Falha ao conectar com Webhook.");
      }
    } catch (err) {
      setTestStatus('error');
      toast.error("Erro ao testar conexão.");
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (!simuladoId) return;

    const q = query(
      collection(db, 'simulado_forms'),
      where('simuladoId', '==', simuladoId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setForm({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SimuladoForm);
      } else {
        setForm(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'simulado_forms');
    });

    return () => unsubscribe();
  }, [simuladoId]);

  const getEffectiveWebhookUrl = async () => {
    if (webhookUrl) return webhookUrl;
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().webhookUrl) {
        return docSnap.data().webhookUrl;
      }
    } catch (err) {
      console.error("[n8n] Erro ao buscar webhook global:", err);
    }
    return null;
  };

  const handleGenerate = async () => {
    const effectiveUrl = await getEffectiveWebhookUrl();
    if (!effectiveUrl) {
      toast.error("URL do Webhook n8n não configurada nas configurações do perfil ou global.");
      return;
    }

    setIsGenerating(true);
    try {
      await simuladoService.generateExternalForm(simuladoId, effectiveUrl);
      toast.success("Formulário externo gerado com sucesso!");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'simulado_forms');
      toast.error("Erro ao gerar formulário externo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSync = async () => {
    const effectiveUrl = await getEffectiveWebhookUrl();
    if (!form || !user || !effectiveUrl) {
      if (!effectiveUrl) toast.error("URL do Webhook n8n não configurada.");
      return;
    }

    setIsSyncing(true);
    try {
      await simuladoService.syncFormResponses(form.id, effectiveUrl, user.uid);
      toast.success("Sincronização concluída!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `simulado_forms/${form.id}`);
      toast.error("Erro ao sincronizar respostas.");
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado!");
  };

  if (loading) {
    return <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin text-emerald-600" /></div>;
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl space-y-4">
        <div className="p-4 bg-gray-50 rounded-full text-gray-400">
          <ExternalLink size={32} />
        </div>
        <div className="text-center">
          <h5 className="font-bold text-gray-700">Nenhum formulário gerado</h5>
          <p className="text-sm text-gray-500">Gere um formulário externo para que os alunos possam responder via Google Forms ou similar.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          Gerar Formulário Externo
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h5 className="font-bold text-gray-900">Formulário Ativo</h5>
            <p className="text-xs text-gray-500">ID Externo: {form.externalFormId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleTestConnection}
            disabled={isTesting}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2 text-sm font-bold"
            title="Testar Conexão"
          >
            {isTesting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            Testar Conexão
          </button>
          {testStatus !== 'idle' && (
            <div className="flex items-center gap-1 text-sm font-bold">
              {testStatus === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-red-600" />}
            </div>
          )}
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all flex items-center gap-2 text-sm font-bold"
            title="Sincronizar Respostas"
          >
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            Sincronizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Link Público (Alunos)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={form.publicUrl} 
              className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
            />
            <button onClick={() => copyToClipboard(form.publicUrl)} className="text-gray-400 hover:text-emerald-600">
              <Copy size={16} />
            </button>
            <a href={form.publicUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-emerald-600">
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Link Admin (Professor)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={form.adminUrl} 
              className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
            />
            <button onClick={() => copyToClipboard(form.adminUrl)} className="text-gray-400 hover:text-emerald-600">
              <Copy size={16} />
            </button>
            <a href={form.adminUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-emerald-600">
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Users size={16} />
            <span className="text-sm font-medium">{form.responseCount} respostas</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={16} />
            <span className="text-sm font-medium">
              Última sincronização: {form.lastSyncAt ? new Date(form.lastSyncAt.seconds * 1000).toLocaleString() : 'Nunca'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
