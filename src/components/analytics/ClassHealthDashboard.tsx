import { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Target,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { AnalyticsHubService, ClassHealthData } from '../../services/analyticsHubService';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export function ClassHealthDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<ClassHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const snap = await getDocs(collection(db, 'classes'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClasses(data);
      if (data.length > 0) setSelectedClassId(data[0].id);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      handleRefresh();
    }
  }, [selectedClassId]);

  const handleRefresh = async () => {
    setLoading(true);
    const health = await AnalyticsHubService.calculateClassHealth(selectedClassId);
    const comp = await AnalyticsHubService.comparePeriods(selectedClassId, 'curr', 'prev');
    setHealthData(health);
    setComparison(comp);
    setLoading(false);
  };

  if (!healthData) return null;

  const getHealthColor = (indicator: string) => {
    switch (indicator) {
      case 'saudável': return 'text-emerald-500 bg-emerald-50';
      case 'atenção': return 'text-amber-500 bg-amber-50';
      case 'crítico': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-emerald-600" />
            Saúde Pedagógica da Turma
          </h2>
          <p className="text-sm text-gray-500">Monitoramento em tempo real de métricas estratégicas.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:animate-spin"
          >
            <RefreshCw size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Main Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Geral</span>
            <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${getHealthColor(healthData.healthIndicator)}`}>
              {healthData.healthIndicator}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">{healthData.engagementScore}%</span>
            <span className="text-xs text-emerald-500 font-bold flex items-center">
              <ArrowUpRight size={12} /> {comparison?.growth}%
            </span>
          </div>
          <p className="text-[10px] text-gray-400">Engajamento calculado por IA + Regras</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Taxa de Entrega</span>
          <div className="text-3xl font-black">{healthData.deliveryRate}%</div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${healthData.deliveryRate}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Desempenho Médio</span>
          <div className="text-3xl font-black">{healthData.avgPerformance}%</div>
          <p className="text-[10px] text-gray-400">Objetivo institucional: 70%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alunos em Risco</span>
          <div className="text-3xl font-black text-red-500">{healthData.studentsAtRiskCount}</div>
          <button className="text-[10px] font-bold text-emerald-600 hover:underline">Ver Alunos</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution Chart Placeholder */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Evolução por Competência</h3>
            <TrendingUp size={18} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {Object.entries(comparison?.competencyEvolution || {}).map(([comp, val]: any) => (
              <div key={comp} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{comp}</span>
                <div className="flex items-center gap-3 flex-1 px-8">
                  <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${60 + val}%` }} />
                  </div>
                </div>
                <span className={`text-xs font-bold ${val >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {val >= 0 ? '+' : ''}{val}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Readiness Info */}
        <div className="bg-emerald-600 p-8 rounded-2xl text-white shadow-lg space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Target size={24} />
            </div>
            <div>
              <h3 className="font-bold">Prontidão para Avaliações Externas</h3>
              <p className="text-xs text-white/70">Probabilidade de atingir metas institucionais.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.72)} className="text-white" />
              </svg>
              <span className="absolute text-xl font-black">72%</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Pontos de Atenção:</p>
              <ul className="text-xs space-y-1 text-white/80">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Lógica Matemática (Descritor D12)</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Interpretação de Texto (OK)</li>
              </ul>
            </div>
          </div>

          <button className="w-full py-3 bg-white text-emerald-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-50 transition-colors">
            Ver Plano de Ação Personalizado
          </button>
        </div>
      </div>
    </div>
  );
}
