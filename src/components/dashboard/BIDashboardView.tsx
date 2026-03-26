import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { DashboardKPIs } from './DashboardKPIs';
import { DashboardCharts } from './DashboardCharts';
import { DashboardFilters } from './DashboardFilters';
import { PainelInsightsIA } from './PainelInsightsIA';
import { PainelRecomendacoes } from './PainelRecomendacoes';
import { ClassRanking } from './ClassRanking';
import { Discipline } from '../../types';
import { getDashboardData } from '../../services/dashboardService';

export function BIDashboardView() {
  const [filters, setFilters] = useState<{ disciplineId?: string }>({});
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const disciplinesSnap = await getDocs(collection(db, 'disciplines'));
        const disciplinesData = disciplinesSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Discipline))
          .filter(d => d.status === 'active');
        setDisciplines(disciplinesData);

        const dashboardData = await getDashboardData(filters);
        setData(dashboardData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  if (loading) return <div className="p-8 text-center">Carregando dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inteligência Educacional</h1>
      <DashboardFilters disciplines={disciplines} onFilterChange={setFilters} />
      {data && (
        <>
          <DashboardKPIs data={data.kpi} />
          <DashboardCharts data={data.charts} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PainelInsightsIA />
            <PainelRecomendacoes />
          </div>
          <ClassRanking data={data.charts.ranking} />
        </>
      )}
    </div>
  );
}
