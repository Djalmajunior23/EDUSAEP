import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Zap, 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Users, 
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import { cn } from "../../lib/utils";
import { db } from "../../firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export function EduJarvisUltraDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'costs' | 'insights'>('overview');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "ai_usage_logs"), orderBy("timestamp", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mb-2">
            <Zap size={14} className="fill-current" />
            EduJarvis 2.0 Ultra
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Orquestrador de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">Inteligência Pedagógica</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mt-2 leading-relaxed">
            Gestão centralizada de agentes multi-instância, motor de regras locais e otimização de custo de processamento.
          </p>
        </div>
        
        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {['overview', 'agents', 'costs', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                activeTab === tab 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Saúde da Orquestração" 
          value="99.8%" 
          trend="+0.2%" 
          icon={BrainCircuit}
          color="indigo"
        />
        <MetricCard 
          title="Economia via Cache" 
          value="42%" 
          trend="+5%" 
          icon={Zap}
          color="emerald"
        />
        <MetricCard 
          title="Latência Média" 
          value="1.2s" 
          trend="-0.4s" 
          icon={TrendingUp}
          color="blue"
        />
        <MetricCard 
          title="Alertas de Drift" 
          value="2" 
          trend="Estável" 
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Agents Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Status dos Agentes</h3>
                <p className="text-sm text-gray-500">Multiprocessamento em tempo real</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Engine</span>
              </div>
            </div>
            
            <div className="p-0">
              <AgentRow name="Professor Agent" desc="Curadoria de conteúdo e planos" status="online" load={12} icon={Users} />
              <AgentRow name="EduTutor Socrático" desc="Apoio direto ao aluno (GPT-4o Mini)" status="online" load={64} icon={Target} />
              <AgentRow name="BI Advanced Engine" desc="Análise preditiva e risco" status="standby" load={0} icon={BarChart3} />
              <AgentRow name="Gamification Scorer" desc="Motor de XP e Missões" status="online" load={8} icon={Sparkles} />
              <AgentRow name="Vision Validator" desc="Análise de caligrafia e imagens" status="online" load={5} icon={Layers} />
            </div>
          </div>

          <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black">Modo Econômico Ativado</h3>
              <p className="text-indigo-200 max-w-lg">
                Seu sistema está priorizando modelos Lite (Flash/Mini) e cache inteligente para reduzir custos sem comprometer a pedagogia.
              </p>
              <button className="flex items-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-all text-sm">
                Configurar Custo <ArrowRight size={16} />
              </button>
            </div>
            <Zap className="absolute -bottom-8 -right-8 w-64 h-64 text-white/5 group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>

        {/* Real-time Logs */}
        <div className="space-y-6">
          <div className="bg-gray-900 dark:bg-black rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Activity Log</h3>
                  <p className="text-gray-500 text-[10px] font-mono">Real-time processing</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-4 max-h-[500px] overflow-auto custom-scrollbar">
              {logs.length > 0 ? logs.map((log, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-2xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                  )}></div>
                  <div className="space-y-1">
                    <p className="text-xs text-white font-medium">
                      <span className="text-indigo-400">@{log.agent}</span> trigger action <span className="text-gray-300">{log.action}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-gray-500 uppercase">{log.source}</span>
                      <span className="text-[10px] font-mono text-gray-600">{new Date(log.timestamp?.toDate ? log.timestamp.toDate() : Date.now()).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center space-y-4">
                  <p className="text-gray-600 font-mono text-xs italic">Aguardando telemetria...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color }: any) {
  const colors: any = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100"
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4"
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-2xl border", colors[color])}>
          <Icon size={24} />
        </div>
        <span className={cn(
          "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
          trend.startsWith('+') ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
        )}>
          {trend}
        </span>
      </div>
      <div>
        <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest">{title}</h4>
        <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
    </motion.div>
  );
}

function AgentRow({ name, desc, status, load, icon: Icon }: any) {
  return (
    <div className="px-8 py-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border-b border-gray-50 dark:border-gray-700 last:border-0 group">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
          <Icon size={22} />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white">{name}</h4>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Carga</p>
          <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${load}%` }}></div>
          </div>
        </div>
        <div className="text-right min-w-[80px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-wider",
            status === 'online' ? "text-emerald-600" : "text-amber-600"
          )}>{status}</span>
        </div>
      </div>
    </div>
  );
}
