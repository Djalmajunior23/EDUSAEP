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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  BarChart3, 
  Cpu, 
  Settings2, 
  History, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Zap,
  TrendingDown,
  DollarSign,
  Info,
  Save,
  Plus
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

export const AIGovernanceView: React.FC = () => {
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
      
      // Calculate basic stats for the last 50 requests
      if (data.length > 0) {
        const successes = data.filter(l => l.success).length;
        const totalLat = data.reduce((acc, curr) => acc + (curr.latency || 0), 0);
        setStats({
          totalRequests: data.length,
          successRate: (successes / data.length) * 100,
          avgLatency: totalLat / data.length,
          estimatedCost: 0 // Placeholder
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
      { name: 'Google Gemini', providerKey: 'gemini', enabled: true, priority: 1, defaultModel: 'gemini-1.5-flash', supportedTasks: ['generic'] },
      { name: 'OpenAI GPT', providerKey: 'openai', enabled: true, priority: 2, defaultModel: 'gpt-4o-mini', supportedTasks: ['complex'] },
      { name: 'Groq (Llama)', providerKey: 'groq', enabled: true, priority: 3, defaultModel: 'llama-3.3-70b-versatile', supportedTasks: ['speed'] }
    ];

    try {
      for (const p of defaults) {
        await addDoc(collection(db, 'aiProviders'), {
          ...p,
          createdAt: Timestamp.now(),
          currentUsage: 0,
          monthlyLimit: 10000,
          costPer1kTokens: 0.002
        });
      }
    } catch (error) {
      console.error("Error adding default providers:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header & Stats Bundle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Governança de IA Multi-Provedor
          </h1>
          <p className="text-gray-500 mt-1">Gerencie redundância, custos e latência da Camada de Inteligência.</p>
        </div>
        
        {providers.length === 0 && (
          <button 
            onClick={addDefaultProviders}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Inicializar Provedores Padrão
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Taxa de Sucesso', value: `${stats.successRate.toFixed(1)}%`, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Latência Média', value: `${stats.avgLatency.toFixed(0)}ms`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Requisições (Logs)', value: stats.totalRequests, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Custo Estimado', value: 'R$ 0,00', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className={cn("p-3 rounded-lg", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Providers Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" />
              Provedores Ativos
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode='popLayout'>
              {providers.map((provider) => (
                <motion.div
                  layout
                  key={provider.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "p-5 bg-white rounded-2xl border transition-all duration-300 shadow-sm",
                    provider.enabled ? "border-gray-100" : "border-gray-200 grayscale opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        provider.providerKey === 'gemini' ? "bg-blue-50 text-blue-600" :
                        provider.providerKey === 'openai' ? "bg-emerald-50 text-emerald-600" :
                        "bg-indigo-50 text-indigo-600"
                      )}>
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{provider.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{provider.defaultModel}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase">Prioridade</p>
                        {editingProvider === provider.id ? (
                          <input 
                            type="number"
                            defaultValue={provider.priority}
                            className="w-12 text-center border rounded font-bold"
                            autoFocus
                            onBlur={(e) => updatePriority(provider.id, parseInt(e.target.value))}
                          />
                        ) : (
                          <button 
                            onClick={() => setEditingProvider(provider.id)}
                            className="text-lg font-bold text-indigo-600 hover:underline"
                          >
                            #{provider.priority}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => toggleProvider(provider.id, provider.enabled)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                          provider.enabled ? "bg-indigo-600" : "bg-gray-200"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          provider.enabled ? "translate-x-6" : "translate-x-1"
                        )} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2 text-xs">
                    {provider.supportedTasks?.map(task => (
                      <span key={task} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md font-medium">
                        {task}
                      </span>
                    ))}
                    <div className="ml-auto flex items-center gap-4 text-gray-400">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Usage: {provider.currentUsage || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Cost: ${provider.costPer1kTokens || 0}/1k
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Real-time Logs Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Fluxo de Operações
          </h2>
          <div className="bg-gray-950 rounded-2xl border border-gray-800 shadow-xl overflow-hidden h-[500px] flex flex-col">
            <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Live AI Logs</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
              {logs.length === 0 && <p className="text-gray-600">Nenhuma atividade registrada ainda...</p>}
              {logs.map((log) => (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id} 
                  className="group"
                >
                  <p className="text-gray-500 mb-1">
                    [{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'now'}]
                  </p>
                  <div className="flex items-start gap-2">
                    {log.success ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <span className={cn(
                        "font-bold",
                        log.success ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {log.provider?.toUpperCase()}
                      </span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="text-indigo-400">{log.task}</span>
                      <div className="text-gray-500 truncate group-hover:text-gray-400">
                        {log.success ? (
                          `Latency: ${log.latency}ms | Model: ${log.model}`
                        ) : (
                          `ERROR: ${log.errorMessage}`
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Area */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-4">
        <Info className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-bold">Nota de Arquitetura</p>
          <p className="mt-1">
            A Camada de IA está configurada para **Fail-Fast** e **Fallback Automático**. Se o provedor #1 falhar ou atingir a cota (HTTP 429), 
            o sistema tentará automaticamente o provedor #2 em milissegundos. Todos os logs são imutáveis para auditoria.
          </p>
        </div>
      </div>
    </div>
  );
};
