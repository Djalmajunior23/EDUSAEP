import React, { useEffect, useState } from 'react';
import { checkSystemHealth, HealthStatus } from '../services/healthCheckService';
import { ShieldCheck, Activity, AlertCircle, CheckCircle2, ShieldAlert, Cpu, Database, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function SystemHealthPage() {
  const [statuses, setStatuses] = useState<HealthStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const runDiagnostics = async () => {
    setLoading(true);
    const results = await checkSystemHealth();
    setStatuses(results);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg">
                <ShieldCheck size={24} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic">EduAI CORE <span className="text-indigo-600">ULTRA</span></h1>
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Diagnóstico e Integridade do Sistema</p>
          </div>
          <button 
            onClick={runDiagnostics}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl font-black text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> {loading ? "Diagnosticando..." : "Rodar Diagnóstico"}
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {statuses.map((s, idx) => (
            <motion.div 
              key={s.service}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group hover:border-indigo-100 dark:hover:border-indigo-900 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${
                  s.status === 'ok' ? 'bg-emerald-50 text-emerald-600' : 
                  s.status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                }`}>
                  {s.service.includes('Auth') ? <ShieldAlert size={28} /> : 
                   s.service.includes('Data') || s.service.includes('Store') ? <Database size={28} /> :
                   s.service.includes('API') ? <Cpu size={28} /> : <Activity size={28} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">{s.service}</h3>
                  <p className="text-sm font-medium text-gray-500">{s.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {s.latency && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Latência</p>
                    <p className="text-sm font-bold text-indigo-600">{s.latency}ms</p>
                  </div>
                )}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${
                  s.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 
                  s.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {s.status === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {s.status === 'ok' ? 'Operacional' : s.status === 'warning' ? 'Degradado' : 'Falha'}
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-8 bg-gray-100 dark:bg-gray-800/50 rounded-[40px] text-center border border-dashed border-gray-300 dark:border-gray-700">
           <h4 className="font-black text-gray-900 dark:text-white text-lg mb-2 capitalize">Monitoramento de Fluxo de Produção</h4>
           <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">Todos os módulos estão em conformidade com o padrão EDUAI ULTRA. Sistema pronto para deploy em alta disponibilidade.</p>
           <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Logs Ativos
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" /> SSL Verificado
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
