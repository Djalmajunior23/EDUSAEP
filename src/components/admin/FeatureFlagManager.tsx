import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Settings, 
  Activity, 
  Cpu, 
  Database, 
  Terminal,
  Clock,
  AlertOctagon,
  RefreshCw,
  Zap,
  DollarSign,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { ConfigService, FeatureFlag } from '../../services/configService';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

export function FeatureFlagManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'flags' | 'health' | 'ai'>('flags');

  useEffect(() => {
    const unsubFlags = onSnapshot(collection(db, 'feature_flags'), (snap) => {
      setFlags(snap.docs.map(d => ({ key: d.id, ...d.data() } as any)));
    });

    const unsubLogs = onSnapshot(
      query(collection(db, 'ai_prompt_logs'), orderBy('timestamp', 'desc'), limit(10)),
      (snap) => {
        setLogs(snap.docs.map(d => d.data()));
      }
    );

    return () => { unsubFlags(); unsubLogs(); };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-emerald-600" />
            Governança e Saúde Operacional
          </h2>
          <p className="text-sm text-gray-500">Controle técnico, financeiro e de rollout do sistema.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit">
        {[
          { id: 'flags', label: 'Feature Flags', icon: Settings },
          { id: 'health', label: 'Saúde Operacional', icon: Activity },
          { id: 'ai', label: 'Auditoria de IA', icon: Terminal },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'flags' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {flags.map((flag) => (
            <div key={flag.key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${flag.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{flag.key}</h3>
                    <p className="text-xs text-gray-500">{flag.description}</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${flag.enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Rollout</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${flag.rolloutPercentage}%` }} />
                    </div>
                    <span className="text-xs font-bold">{flag.rolloutPercentage}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Beta Users</span>
                  <span className="text-xs font-medium">{flag.allowedUsers.length || 'Nenhum'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-3 text-emerald-600 mb-4">
                <Cpu size={20} />
                <h3 className="font-bold">Tempo de Resposta Médio</h3>
              </div>
              <div className="text-3xl font-black text-emerald-700">240ms</div>
              <p className="text-xs text-emerald-600/70 mt-2">SLA: {"<"} 500ms</p>
            </div>
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertOctagon size={20} />
                <h3 className="font-bold">Erros (Últimas 24h)</h3>
              </div>
              <div className="text-3xl font-black text-amber-700">12</div>
              <p className="text-xs text-amber-600/70 mt-2">Nível: Médio</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 text-blue-600 mb-4">
                <Database size={20} />
                <h3 className="font-bold">Uso de Banco (Leitura)</h3>
              </div>
              <div className="text-3xl font-black text-blue-700">4.2k</div>
              <p className="text-xs text-blue-600/70 mt-2">Dentro da cota gratuita</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Layers size={18} className="text-gray-400" />
              Filas de Processamento (n8n / Webhooks)
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Sincronização de Google Forms', status: 'Online', delay: '2s' },
                { name: 'Geração de Trilhas IA', status: 'Offline', delay: '-' },
              ].map((q) => (
                <div key={q.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${q.status === 'Online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-bold">{q.name}</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Fila: {q.delay}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold">Logs de Auditoria de IA</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <DollarSign size={14} />
              Custo Estimado Mês: $12.45
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-black">Versão Prompt</th>
                  <th className="px-6 py-4 font-black">Módulo</th>
                  <th className="px-6 py-4 font-black">Tokens (In/Out)</th>
                  <th className="px-6 py-4 font-black">Custo</th>
                  <th className="px-6 py-4 font-black">Data</th>
                  <th className="px-6 py-4 font-black">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono">{log.promptVersion || '1.0.0'}</td>
                    <td className="px-6 py-4">{log.moduleName}</td>
                    <td className="px-6 py-4 font-medium">{log.inputTokens} / {log.outputTokens}</td>
                    <td className="px-6 py-4 text-emerald-600 font-bold">${log.costEstimate?.toFixed(4)}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(log.timestamp?.toDate()).toLocaleString()}</td>
                    <td className="px-6 py-4"><CheckCircle2 size={16} className="text-emerald-500" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
