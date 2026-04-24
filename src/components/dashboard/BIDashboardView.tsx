import { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { DashboardKPIs } from './DashboardKPIs';
import { DashboardCharts } from './DashboardCharts';
import { DashboardFilters } from './DashboardFilters';
import { PainelInsightsIA } from './PainelInsightsIA';
import { PainelRecomendacoes } from './PainelRecomendacoes';
import { ClassRanking } from './ClassRanking';
import { AggregatedBIView } from './AggregatedBIView';
import { Discipline } from '../../types';
import { getDashboardData } from '../../services/dashboardService';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { FileText, Loader2 } from 'lucide-react';
import { pdfExportService } from '../../services/pdfExportService';
import { toast } from 'sonner';

export function BIDashboardView() {
  const [filters, setFilters] = useState<{ disciplineId?: string }>({});
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

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
        handleFirestoreError(err, OperationType.GET, 'disciplines/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    toast.info('Preparando relatório em PDF...');
    try {
      await pdfExportService.exportElementToPDF(dashboardRef.current, 'Relatorio_Inteligencia_Educacional');
      toast.success('Relatório exportado com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao gerar o PDF: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inteligência Educacional</h1>
        <button
          onClick={handleExportPDF}
          disabled={isExporting || !data}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-100"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          {isExporting ? 'Gerando PDF...' : 'Exportar Relatório'}
        </button>
      </div>
      
      <DashboardFilters disciplines={disciplines} onFilterChange={setFilters} />
      
      {data && (
        <div ref={dashboardRef} className="space-y-8 bg-[#F8F9FA] p-2 rounded-xl">
          <DashboardKPIs data={data.kpi} />
          <DashboardCharts data={data.charts} />
          <AggregatedBIView data={data.charts.performancePorDisciplina} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PainelInsightsIA data={data} />
            <PainelRecomendacoes />
          </div>
          <ClassRanking data={data.charts.ranking} />
        </div>
      )}
    </div>
  );
}
