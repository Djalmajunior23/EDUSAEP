import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { observatoryService, StudentObservatoryData } from '../../services/observatoryService';
import { MapaCompetencias } from './MapaCompetencias';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer } from 'recharts';
import { Target, AlertTriangle, TrendingUp, TrendingDown, Minus, BookOpen, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ObservatorioAlunoView() {
  const { userProfile, user } = useAuth();
  const [data, setData] = useState<StudentObservatoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      observatoryService.getStudentObservatoryData(user.uid).then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) return null;

  const radarData = data.competencies.map(c => ({
    subject: c.name,
    A: c.score,
    fullMark: 100
  }));

  const riskColors = {
    'Baixo': 'text-green-600 bg-green-50 border-green-200',
    'Médio': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    'Alto': 'text-orange-600 bg-orange-50 border-orange-200',
    'Crítico': 'text-red-700 bg-red-50 border-red-200',
  };

  const TrendIcon = data.riskData.trend === 'Up' ? TrendingUp : data.riskData.trend === 'Down' ? TrendingDown : Minus;
  const trendColor = data.riskData.trend === 'Up' ? 'text-green-500' : data.riskData.trend === 'Down' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Risk and Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={cn("p-4 rounded-xl border flex flex-col justify-between", riskColors[data.riskData.riskLevel])}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm opacity-80">Nível de Risco</h3>
            <AlertTriangle className="w-5 h-5 opacity-80" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold">{data.riskData.riskLevel}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <h3 className="font-semibold text-sm">Desempenho Médio</h3>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{data.riskData.averageGrade.toFixed(1)}</span>
            <span className="text-sm font-medium text-gray-500">/ 100</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <h3 className="font-semibold text-sm">Taxa de Entrega</h3>
            <BookOpen className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold text-gray-900">{data.riskData.deliveryRate}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <h3 className="font-semibold text-sm">Tendência</h3>
            <TrendIcon className={cn("w-5 h-5", trendColor)} />
          </div>
          <div className="mt-2">
            <span className="text-lg font-medium text-gray-900">
              {data.riskData.trend === 'Up' ? 'Evoluindo' : data.riskData.trend === 'Down' ? 'Em queda' : 'Estável'}
            </span>
          </div>
        </div>
      </div>

      {data.riskData.factors.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-md">
          <h4 className="text-sm font-medium text-orange-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Fatores de Atenção
          </h4>
          <ul className="mt-2 text-sm text-orange-700 list-disc list-inside">
             {data.riskData.factors.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Module 9: Mapa de Competências embedded here */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Mapa de Competências</h2>
            <p className="text-sm text-gray-500">Seu domínio nas principais áreas de conhecimento.</p>
          </div>
          <MapaCompetencias data={radarData} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
             {data.competencies.map(c => (
               <div key={c.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                 <span className="truncate pr-2 font-medium text-gray-700">{c.name}</span>
                 <span className={cn(
                   "px-2 py-0.5 rounded-full font-semibold",
                   c.masteryLevel === 'Alto' ? 'bg-green-100 text-green-700' :
                   c.masteryLevel === 'Médio' ? 'bg-yellow-100 text-yellow-700' :
                   'bg-red-100 text-red-700'
                 )}>{c.score}%</span>
               </div>
             ))}
          </div>
        </div>

        {/* Historico Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Evolução de Notas</h2>
            <p className="text-sm text-gray-500">Seu histórico recente de avaliações.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.recentGrades}>
                <defs>
                  <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 100]} dx={-10}/>
                <LineTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value}`, 'Nota']}
                />
                <Area type="monotone" dataKey="grade" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorGrade)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
