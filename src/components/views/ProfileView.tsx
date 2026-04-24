import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Settings, 
  Zap, 
  Sun, 
  Moon, 
  Loader2, 
  CheckCircle2, 
  Bell
} from 'lucide-react';
import { User } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { testWebhook } from '../../services/n8nService';

interface ProfileViewProps {
  user: User | null;
  profile: UserProfile | null;
}

export function ProfileView({ user, profile }: ProfileViewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState(profile?.settings?.theme || 'light');
  const [notifications, setNotifications] = useState(profile?.settings?.notifications ?? true);
  const [webhookUrl, setWebhookUrl] = useState(profile?.settings?.webhookUrl || '');
  const [globalWebhookUrl, setGlobalWebhookUrl] = useState('');
  const [defaultGrade, setDefaultGrade] = useState(profile?.preferences?.defaultGrade || '');
  const [language, setLanguage] = useState(profile?.preferences?.language || 'Português');
  const [isTesting, setIsTesting] = useState<'user' | 'global' | null>(null);

  useEffect(() => {
    if (profile) {
      setTheme(profile.settings?.theme || 'light');
      setNotifications(profile.settings?.notifications ?? true);
      setWebhookUrl(profile.settings?.webhookUrl || '');
      setDefaultGrade(profile.preferences?.defaultGrade || '');
      setLanguage(profile.preferences?.language || 'Português');
    }
  }, [profile]);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalWebhookUrl(docSnap.data().webhookUrl || '');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'settings/global');
      }
    };
    fetchGlobalSettings();
  }, []);

  const handleTestWebhook = async (url: string, type: 'user' | 'global') => {
    if (!url) {
      toast.error('Informe uma URL para testar.');
      return;
    }
    setIsTesting(type);
    try {
      const success = await testWebhook(url, {
        message: 'Este é um teste de integração do Plano de Estudos Automático.',
        user: user?.email
      });
      
      if (success) {
        toast.success('Webhook testado com sucesso!');
      } else {
        toast.error('Erro no teste do webhook. Verifique os logs do n8n.');
      }
    } catch (err) {
      toast.error('Erro ao conectar com o webhook. Verifique a URL e o CORS.');
    } finally {
      setIsTesting(null);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        settings: { theme, notifications, webhookUrl },
        preferences: { defaultGrade, language },
        updatedAt: new Date().toISOString()
      });

      if (profile?.role === 'ADMIN') {
        await setDoc(doc(db, 'settings', 'global'), {
          webhookUrl: globalWebhookUrl,
          updatedBy: user.uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar perfil.');
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Perfil do Usuário</h2>
        <p className="text-gray-500">Gerencie suas configurações de conta e preferências pedagógicas.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
        <div className="flex items-center gap-6 pb-8 border-b border-gray-100">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-2xl border border-gray-200 shadow-sm" referrerPolicy="no-referrer" crossOrigin="anonymous" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl shadow-sm">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user?.displayName}</h3>
            <p className="text-gray-500">{user?.email}</p>
            {profile?.matricula && (
              <p className="text-sm font-bold text-emerald-600 mt-1">Matrícula: {profile.matricula}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                user?.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {user?.emailVerified ? 'E-mail Verificado' : 'E-mail não verificado'}
              </span>
              {profile && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  profile.role === 'ADMIN' ? "bg-purple-100 text-purple-700" :
                  profile.role === 'TEACHER' ? "bg-blue-100 text-blue-700" :
                  profile.role === 'COORDINATOR' ? "bg-amber-100 text-amber-700" :
                  profile.role === 'MONITOR' ? "bg-cyan-100 text-cyan-700" :
                  "bg-emerald-100 text-emerald-700"
                )}>
                  {profile.role}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tema da Interface</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Idioma Preferido</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              >
                <option value="Português">Português</option>
                <option value="English">English</option>
                <option value="Español">Español</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Série/Ano Padrão</label>
            <input 
              type="text"
              value={defaultGrade}
              onChange={(e) => setDefaultGrade(e.target.value)}
              placeholder="Ex: 9º Ano Ensino Fundamental"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Webhook URL (n8n / Automação)</label>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tighter">Opcional</span>
            </div>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                  <input 
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://seu-n8n.com/webhook/..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => handleTestWebhook(webhookUrl, 'user')}
                  disabled={isTesting === 'user' || !webhookUrl}
                  className="px-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-bold text-xs hover:bg-emerald-100 transition-all disabled:opacity-50"
                >
                  {isTesting === 'user' ? <Loader2 className="animate-spin" size={16} /> : 'Testar'}
                </button>
              </div>
            <p className="text-[10px] text-gray-400 italic">Sempre que um diagnóstico for gerado, os dados serão enviados para esta URL.</p>
          </div>

          {profile?.role === 'ADMIN' && (
            <div className="space-y-2 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                  <Settings size={14} />
                  Webhook Global (n8n / Automação)
                </label>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded uppercase tracking-tighter">Admin Only</span>
              </div>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" size={18} />
                    <input 
                      type="url"
                      value={globalWebhookUrl}
                      onChange={(e) => setGlobalWebhookUrl(e.target.value)}
                      placeholder="https://seu-n8n.com/webhook/global/..."
                      className="w-full pl-12 pr-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={() => handleTestWebhook(globalWebhookUrl, 'global')}
                    disabled={isTesting === 'global' || !globalWebhookUrl}
                    className="px-4 bg-purple-100 text-purple-700 rounded-xl border border-purple-200 font-bold text-xs hover:bg-purple-200 transition-all disabled:opacity-50"
                  >
                    {isTesting === 'global' ? <Loader2 className="animate-spin" size={16} /> : 'Testar'}
                  </button>
                </div>
              <p className="text-[10px] text-purple-600 italic">Esta URL será usada como padrão para todos os usuários que não tiverem um webhook pessoal configurado.</p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-gray-900">Notificações por E-mail</p>
              <p className="text-xs text-gray-500">Receba alertas sobre novos diagnósticos e tarefas.</p>
            </div>
            <button 
              onClick={() => setNotifications(!notifications)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                notifications ? "bg-emerald-500" : "bg-gray-300"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                notifications ? "left-7" : "left-1"
              )} />
            </button>
          </div>
        </div>

        <button 
          onClick={saveProfile}
          disabled={isSaving}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
          {isSaving ? 'Salvando Alterações...' : 'Salvar Perfil'}
        </button>
      </div>
    </motion.div>
  );
}
