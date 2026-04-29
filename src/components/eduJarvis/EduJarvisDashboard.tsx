import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, query, limit, orderBy, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Activity, Zap, Users, AlertTriangle, TrendingUp, Cpu, BarChart3, Target } from 'lucide-react';

export function EduJarvisDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mockMLData = [
    { name: 'Seg', engajamento: 45, risco: 20, predicao: 40 },
    { name: 'Ter', engajamento: 52, risco: 18, predicao: 45 },
    { name: 'Qua', engajamento: 48, risco: 25, predicao: 35 },
    { name: 'Qui', engajamento: 61, risco: 15, predicao: 55 },
    { name: 'Sex', engajamento: 55, risco: 22, predicao: 50 },
  ];

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const q = query(collection(db, 'jarvis_logs'), orderBy('createdAt', 'desc'), limit(100));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => doc.data());
        
        const counts = data.reduce((acc: any, curr: any) => {
          acc[curr.tipoAcao] = (acc[curr.tipoAcao] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.keys(counts).map(key => ({
          name: key,
          total: counts[key]
        }));

        setMetrics(chartData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-gray-900 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">BI & Machine Learning</h2>
          <p className="text-sm text-gray-500">Inteligência Preditiva EduJarvis Ultra</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
            <Cpu size={12} /> IA Ativa
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={<Zap className="text-yellow-500" />} label="Comandos IA" value="1.4k" trend="+12%" />
        <MetricCard icon={<Activity className="text-blue-500" />} label="Engajamento" value="92%" trend="+5%" />
        <MetricCard icon={<Target className="text-purple-500" />} label="Trilhas Geradas" value="458" trend="+20%" />
        <MetricCard icon={<AlertTriangle className="text-red-500" />} label="Risco Acadêmico" value="14" trend="-2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Distribuição de Intenções</h3>
            <BarChart3 size={18} className="text-indigo-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Análise Preditiva (Engajamento)</h3>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMLData}>
                <defs>
                  <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="engajamento" stroke="#10b981" fillOpacity={1} fill="url(#colorEngage)" strokeWidth={3} />
                <Line type="monotone" dataKey="predicao" stroke="#6366f1" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-indigo-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2">IA Preditiva de Sucesso Acadêmico</h3>
          <p className="text-indigo-100 text-sm max-w-md">O EduJarvis identificou que turmas com trilhas de aprendizagem personalizadas têm 40% mais retenção de conteúdo em Banco de Dados.</p>
        </div>
        <button className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors relative z-10">
          Ver Relatório Deep Learning
        </button>
        <div className="absolute top-0 right-0 opacity-10 -rotate-12 translate-x-1/4 -translate-y-1/4">
          <Cpu size={240} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          {icon}
        </div>
        <span className={clsx(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {trend}
        </span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</div>
      <div className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{value}</div>
    </div>
  );
}

import clsx from 'clsx';
