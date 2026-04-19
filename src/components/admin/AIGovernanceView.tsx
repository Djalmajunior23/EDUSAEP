import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, PieChart, Pie 
} from 'recharts';
import { 
  collection, query, orderBy, limit, onSnapshot, Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Cpu, 
  TrendingUp, 
  DollarSign, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter,
  RefreshCw,
  Search,
  Brain,
  Sparkles,
  Hexagon,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AIUsageLog {
  id: string;
  userId: string;
  email: string;
  provider: string;
  model: string;
  timestamp: any;
  success: boolean;
  error?: string;
  costEstimate: number;
}

export const AIGovernanceView: React.FC = () => {
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');

  useEffect(() => {
    const q = query(
      collection(db, 'ai_usage_logs'),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AIUsageLog[];
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const totalCalls = logs.length;
    const successCalls = logs.filter(l => l.success).length;
    const errorCalls = totalCalls - successCalls;
    const successRate = totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0;
    const totalCost = logs.reduce((acc, l) => acc + (l.costEstimate || 0), 0);
    
    const uniqueUsers = new Set(logs.map(l => l.userId)).size;

    const providerDistribution = logs.reduce((acc: any, l) => {
      acc[l.provider] = (acc[l.provider] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(providerDistribution).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));

    return {
      totalCalls,
      successRate,
      totalCost,
      uniqueUsers,
      errorCalls,
      chartData
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvider = filterProvider === 'all' || log.provider === filterProvider;
      return matchesSearch && matchesProvider;
    });
  }, [logs, searchTerm, filterProvider]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Governança de IA Institucional
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Monitoramento de custos, performance e auditabilidade de modelos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full border border-green-200 dark:border-green-800">
            <ShieldCheck size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Sistemas Operacionais</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Requisições', value: stats.totalCalls, icon: Cpu, color: 'blue' },
          { label: 'Taxa de Sucesso', value: `${stats.successRate.toFixed(1)}%`, icon: TrendingUp, color: 'green' },
          { label: 'Custo Estimado', value: `$${stats.totalCost.toFixed(2)}`, icon: DollarSign, color: 'amber' },
          { label: 'Usuários Ativos', value: stats.uniqueUsers, icon: Users, color: 'purple' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn(
                "p-3 rounded-xl transition-colors",
                `bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:bg-${stat.color}-100`
              )}>
                <stat.icon size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Distribution Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-600" />
            Distribuição por Provedor
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={stats.chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 'bold' }} stroke="#9CA3AF" />
                <Tooltip 
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {stats.chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name === 'GEMINI' ? '#3B82F6' : 
                        entry.name === 'OPENAI' ? '#10B981' : '#6366F1'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Summary */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <AlertCircle size={20} className="text-indigo-600" />
            Saúde dos Provedores
          </h3>
          <div className="space-y-6">
            {['gemini', 'openai', 'deepseek'].map(prov => {
              const provLogs = logs.filter(l => l.provider === prov);
              const success = provLogs.filter(l => l.success).length;
              const rate = provLogs.length > 0 ? (success / provLogs.length) * 100 : 100;
              
              return (
                <div key={prov} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {prov === 'gemini' && <Sparkles size={16} className="text-blue-500" />}
                      {prov === 'openai' && <Brain size={16} className="text-emerald-500" />}
                      {prov === 'deepseek' && <Hexagon size={16} className="text-indigo-500" />}
                      <span className="text-sm font-bold capitalize">{prov}</span>
                    </div>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      rate > 90 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      className={cn(
                        "h-full rounded-full transition-all",
                        rate > 90 ? "bg-green-500" : "bg-red-500"
                      )} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Logs de Execução em Tempo Real</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por e-mail ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-full md:w-64"
              />
            </div>
            <select 
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Todos Provedores</option>
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Modelo</th>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Custo Est.</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    {log.success ? (
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-xs uppercase">
                        <CheckCircle2 size={14} />
                        Sucesso
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs uppercase" title={log.error}>
                        <XCircle size={14} />
                        Falha
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{log.email}</span>
                      <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{log.userId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         "px-2 py-0.5 rounded-md text-[10px] font-black uppercase",
                         log.provider === 'gemini' ? "bg-blue-100 text-blue-700" :
                         log.provider === 'openai' ? "bg-emerald-100 text-emerald-700" :
                         "bg-indigo-100 text-indigo-700"
                       )}>
                        {log.provider}
                       </span>
                       <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">{log.model}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                    {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Recent'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      ${log.costEstimate?.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Supporting Icons for charts
function BarChart2(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18"/><path d="M7 16V8"/><path d="M11 16V12"/><path d="M15 16V5"/><path d="M19 16V10"/>
    </svg>
  );
}

function XCircle(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
    </svg>
  );
}

function ExternalLink(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
    </svg>
  );
}
