import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { observatoryService } from '../../services/observatoryService';
import { Users, AlertCircle, CheckCircle2, Target, TrendingDown } from 'lucide-react';

export function ObservatorioTurmaView() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Hardcoded class ID for MVP demonstration. In reality, should be selected from a list Context.
  const currentClassId = "class_123";

  useEffect(() => {
    observatoryService.getClassObservatoryData(currentClassId).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [currentClassId]);

  if (loading) return (
     <div className="flex justify-center items-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
     </div>
  );
  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Observatório da Turma</h1>
          <p className="text-gray-500">Visão analítica agregada para tomada de decisão.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
          <Users className="w-4 h-4" /> Turma 3A - Matemática
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 ml:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Média da Turma</p>
            <h4 className="text-2xl font-bold text-gray-900">{data.averageClassGrade.toFixed(1)}</h4>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Taxa de Entrega</p>
            <h4 className="text-2xl font-bold text-gray-900">{data.averageDeliveryRate}%</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-lg text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Alunos em Risco</p>
            <h4 className="text-2xl font-bold text-gray-900">{data.studentsAtRisk}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Queda Recente</p>
            <h4 className="text-2xl font-bold text-gray-900">2</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Competencies */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1">
          <h3 className="font-bold text-gray-900 mb-4">Competências Críticas</h3>
          <p className="text-sm text-gray-500 mb-4">Habilidades com desempenho médio abaixo de 60% na turma.</p>
          <div className="space-y-3">
            {data.criticalCompetencies.map((comp: string, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="font-medium text-red-800 text-sm">{comp}</span>
                <span className="text-xs bg-white text-red-600 px-2 py-1 rounded-full font-bold shadow-sm border border-red-200">Revisar</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collective Alerts */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
          <h3 className="font-bold text-gray-900 mb-4">Alertas Coletivos</h3>
          <div className="space-y-4">
            {data.recentAlerts.map((alert: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-orange-900">{alert.type}</h4>
                  <p className="text-sm text-orange-800 mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
            {data.recentAlerts.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">Nenhum alerta recente.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
