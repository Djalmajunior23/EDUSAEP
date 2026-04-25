import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Activity, 
  BarChart3, 
  Cpu, 
  History,
  Zap,
  DollarSign,
  Info,
  Plus,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AIProvider {
  id: string;
  name: string;
  providerKey: string;
  enabled: boolean;
  priority: number;
  defaultModel: string;
  supportedTasks?: string[];
  currentUsage: number;
  monthlyLimit?: number;
  costPer1kTokens?: number;
}

interface AIUsageLog {
  id: string;
  userId: string;
  userRole: string;
  provider: string;
  model: string;
  task: string;
  success: boolean;
  latency: number;
  errorMessage?: string;
  timestamp: any;
}

export function AdminAIProviderManager() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    successRate: 0,
    avgLatency: 0,
    estimatedCost: 0
  });

  useEffect(() => {
    // Note: The collection name is 'aiProviders' as defined in our blueprint
    const qProviders = query(collection(db, 'aiProviders'), orderBy('priority', 'asc'));
    const unsubProviders = onSnapshot(qProviders, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AIProvider[];
      setProviders(data);
      setLoading(false);
    });

    const qLogs = query(collection(db, 'aiUsageLogs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AIUsageLog[];
      setLogs(data);
      
      if (data.length > 0) {
        const successes = data.filter(l => l.success).length;
        const totalLat = data.reduce((acc, curr) => acc + (curr.latency || 0), 0);
        setStats({
          totalRequests: data.length,
          successRate: (successes / data.length) * 100,
          avgLatency: totalLat / data.length,
          estimatedCost: 0 
        });
      }
    });

    return () => {
      unsubProviders();
      unsubLogs();
    };
  }, []);

  const toggleProvider = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'aiProviders', id), {
        enabled: !currentStatus
      });
    } catch (error) {
      console.error("Error toggling provider:", error);
    }
  };

  const updatePriority = async (id: string, newPriority: number) => {
    try {
      await updateDoc(doc(db, 'aiProviders', id), {
        priority: newPriority
      });
      setEditingProvider(null);
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const addDefaultProviders = async () => {
    const defaults = [
      { name: 'Google Gemini Pro', providerKey: 'gemini', enabled: true, priority: 1, defaultModel: 'gemini-1.5-flash', supportedTasks: ['pedagogical_gen', 'generic'] },
      { name: 'OpenAI GPT-4o', providerKey: 'openai', enabled: true, priority: 2, defaultModel: 'gpt-4o-mini', supportedTasks: ['complex_analysis'] },
      { name: 'Groq (Llama 3.3)', providerKey: 'groq', enabled: true, priority: 3, defaultModel: 'llama-3.3-70b-versatile', supportedTasks: ['fast_chat'] },
      { name: 'DeepSeek Chat', providerKey: 'deepseek', enabled: true, priority: 4, defaultModel: 'deepseek-chat', supportedTasks: ['coding', 'logic'] }
    ];

    try {
      for (const p of defaults) {
        await addDoc(collection(db, 'aiProviders'), {
          ...p,
          createdAt: Timestamp.now(),
          currentUsage: 0,
          monthlyLimit: 50000,
          costPer1kTokens: 0.001
        });
      }
    } catch (error) {
      console.error("Error adding default providers:", error);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" /> Governança de IA Ultra
          </h2>
          <p className="text-gray-500">Controle o roteamento centralizado, custos e fallback das APIs.</p>
        </div>
        
        {providers.length === 0 && (
          <button 
            onClick={addDefaultProviders}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Inicializar Gateways de IA
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Saúde do Core', value: `${stats.successRate.toFixed(1)}%`, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Latência Router', value: `${stats.avgLatency.toFixed(0)}ms`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Volume (Last 50)', value: stats.totalRequests, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Custo Estimado', value: 'R$ 0,00', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={cn("p-3 rounded-lg", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Providers Section */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Configuração de Gateway
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode='popLayout'>
              {providers.map((provider) => (
                <motion.div
                  layout
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 bg-white rounded-xl border transition-all duration-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",
                    provider.enabled ? "border-gray-100 ring-1 ring-emerald-500/10" : "border-gray-200 grayscale opacity-60"
                  )}
                >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        provider.providerKey === 'gemini' ? "bg-blue-50 text-blue-600" :
                        provider.providerKey === 'openai' ? "bg-emerald-50 text-emerald-600" :
                        "bg-indigo-50 text-indigo-600"
                      )}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{provider.name}</h4>
                        <p className="text-[10px] text-gray-500 font-mono bg-gray-50 px-1 inline-block rounded">{provider.defaultModel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Prioridade</p>
                        {editingProvider === provider.id ? (
                          <input 
                            type="number"
                            defaultValue={provider.priority}
                            className="w-10 text-center border-b-2 border-indigo-600 font-black focus:outline-none"
                            autoFocus
                            onBlur={(e) => updatePriority(provider.id, parseInt(e.target.value))}
                            onKeyDown={(e) => e.key === 'Enter' && updatePriority(provider.id, parseInt(e.currentTarget.value))}
                          />
                        ) : (
                          <button 
                            onClick={() => setEditingProvider(provider.id)}
                            className="text-lg font-black text-indigo-600 hover:scale-110 transition-transform"
                          >
                            #{provider.priority}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col items-end">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Status</p>
                        <button
                          onClick={() => toggleProvider(provider.id, provider.enabled)}
                          className={cn(
                            "relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                            provider.enabled ? "bg-indigo-600" : "bg-gray-300"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                            provider.enabled ? "translate-x-6" : "translate-x-1"
                          )} />
                        </button>
                      </div>
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Real-time Logs Terminal */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4" /> AI Event Log
          </h3>
          <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden h-[450px] flex flex-col font-mono text-[10px]">
            <div className="px-3 py-1.5 bg-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-gray-400 font-bold">MONITOR_CORE_v1.0</span>
              </div>
              <span className="text-indigo-400">WS_ACTIVE</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border-l border-gray-800 pl-2 pb-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-gray-600">
                      [{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : '---'}]
                    </span>
                    <span className={cn(
                      "px-1 rounded",
                      log.success ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {log.success ? 'SUCCESS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-indigo-400">[{log.provider?.toUpperCase()}]</span>
                    <span className="text-gray-300 truncate">{log.task}</span>
                  </div>
                  {!log.success && (
                    <div className="text-rose-500/80 italic mt-0.5 break-all">
                      {log.errorMessage}
                    </div>
                  )}
                  {log.success && (
                    <div className="text-gray-500 mt-0.5">
                      {log.latency}ms • {log.model}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notice */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 text-xs text-indigo-800">
        <Info className="w-4 h-4 shrink-0" />
        <p>
          <strong>Segurança:</strong> Todas as API Keys foram movidas para variáveis de ambiente seguras no backend. 
          Este painel gerencia apenas o **motor de decisão** e a **prioridade de fallback**. 
          O roteamento é centralizado em <code>/api/ai/completions</code>.
        </p>
      </div>
    </div>
  );
}

