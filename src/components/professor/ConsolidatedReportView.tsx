import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { TrendingUp, Target, Award, AlertTriangle, Users, BookOpen, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ConsolidatedReportViewProps {
  history: any[];
  onReset: () => void;
}

export function ConsolidatedReportView({ history, onReset }: ConsolidatedReportViewProps) {
  const [timeframe, setTimeframe] = useState<'all' | '30d' | '7d'>('all');

  const filteredHistory = useMemo(() => {
    if (timeframe === 'all') return history;
    
    const now = new Date();
    const daysToSubtract = timeframe === '30d' ? 30 : 7;
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));

    return history.filter(item => {
      const itemDate = item.createdAt?.seconds 
        ? new Date(item.createdAt.seconds * 1000) 
        : new Date(item.createdAt);
      return itemDate >= cutoffDate;
    });
  }, [history, timeframe]);

  const reportData = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0) return null;

    const competencyStats: Record<string, { totalAccuracy: number; count: number }> = {};
    let totalAccuracySum = 0;
    let totalStudents = new Set();
    const trendDataMap: Record<string, { date: string; accuracy: number; count: number }> = {};

    filteredHistory.forEach(diagnostic => {
      totalStudents.add(diagnostic.aluno);
      
      // Handle data from different sources (diagnostics, submissions, forms)
      const accuracy = diagnostic.summary?.acuracia_geral ?? 
                       (diagnostic.score / diagnostic.maxScore) ?? 0;
      
      totalAccuracySum += accuracy;

      // Trend Data (Group by Date)
      const dateObj = diagnostic.createdAt?.seconds 
        ? new Date(diagnostic.createdAt.seconds * 1000) 
        : new Date(diagnostic.createdAt);
      
      if (!isNaN(dateObj.getTime())) {
        const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!trendDataMap[dateStr]) {
          trendDataMap[dateStr] = { date: dateStr, accuracy: 0, count: 0 };
        }
        trendDataMap[dateStr].accuracy += accuracy;
        trendDataMap[dateStr].count += 1;
      }

      // Competency Stats
      const competencies = diagnostic.diagnostico_por_competencia || 
                           Object.entries(diagnostic.competencyResults || {}).map(([name, res]: any) => ({
                             competencia: name,
                             acuracia: res.correct / res.total
                           }));

      competencies.forEach((comp: any) => {
        if (!competencyStats[comp.competencia]) {
          competencyStats[comp.competencia] = { totalAccuracy: 0, count: 0 };
        }
        competencyStats[comp.competencia].totalAccuracy += comp.acuracia;
        competencyStats[comp.competencia].count += 1;
      });
    });

    const overallAverage = filteredHistory.length > 0 ? totalAccuracySum / filteredHistory.length : 0;

    const competencyAverages = Object.entries(competencyStats).map(([name, stats]) => ({
      name,
      average: stats.totalAccuracy / stats.count,
      count: stats.count
    })).sort((a, b) => b.average - a.average);

    const strengths = competencyAverages.slice(0, 3);
    const weaknesses = competencyAverages.slice(-3).reverse();

    const trendData = Object.values(trendDataMap)
      .map(t => ({
        date: t.date,
        average: t.accuracy / t.count
      }))
      .sort((a, b) => {
        if (!a.date || !b.date || typeof a.date !== 'string' || typeof b.date !== 'string') return 0;
        const partsA = a.date.split('/');
        const partsB = b.date.split('/');
        if (partsA.length < 2 || partsB.length < 2) return 0;
        const [dayA, monthA] = partsA;
        const [dayB, monthB] = partsB;
        return new Date(2024, parseInt(monthA)-1, parseInt(dayA)).getTime() - new Date(2024, parseInt(monthB)-1, parseInt(dayB)).getTime();
      });

    return {
      overallAverage,
      totalStudents: totalStudents.size,
      totalDiagnostics: filteredHistory.length,
      competencyAverages,
      strengths,
      weaknesses,
      trendData
    };
  }, [filteredHistory]);

  const handleReset = () => {
    onReset();
    toast.success("Análise reiniciada com sucesso.");
  };

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <BookOpen size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nenhum dado disponível</h3>
        <p className="text-gray-500 dark:text-gray-400">Não há dados suficientes para gerar o relatório consolidado.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatório Consolidado</h2>
          <p className="text-gray-500 dark:text-gray-400">Visão geral do desempenho de todos os alunos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            <RefreshCw size={16} />
            Reiniciar Análise
          </button>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todo o Período</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="7d">Últimos 7 dias</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Target size={20} />
            </div>
            <h3 className="font-bold text-gray-700 dark:text-gray-300">Média Geral</h3>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {(reportData.overallAverage * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-gray-700 dark:text-gray-300">Alunos Avaliados</h3>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {reportData.totalStudents}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Em {reportData.totalDiagnostics} diagnósticos</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-gray-700 dark:text-gray-300">Tendência</h3>
          </div>
          <div className="h-16 mt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={reportData.trendData}>
                <Line type="monotone" dataKey="average" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competency Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Desempenho por Disciplina/Competência</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={reportData.competencyAverages} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Média']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                  {reportData.competencyAverages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.average >= 0.7 ? '#10b981' : entry.average >= 0.5 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-emerald-500" size={20} />
              <h3 className="font-bold text-gray-900 dark:text-white">Áreas de Força</h3>
            </div>
            <div className="space-y-3">
              {reportData.strengths.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                  <span className="font-medium text-emerald-900 dark:text-emerald-100 text-sm">{comp.name}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{(comp.average * 100).toFixed(1)}%</span>
                </div>
              ))}
              {reportData.strengths.length === 0 && <p className="text-sm text-gray-500">Dados insuficientes.</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-rose-500" size={20} />
              <h3 className="font-bold text-gray-900 dark:text-white">Áreas de Fraqueza</h3>
            </div>
            <div className="space-y-3">
              {reportData.weaknesses.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                  <span className="font-medium text-rose-900 dark:text-rose-100 text-sm">{comp.name}</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400">{(comp.average * 100).toFixed(1)}%</span>
                </div>
              ))}
              {reportData.weaknesses.length === 0 && <p className="text-sm text-gray-500">Dados insuficientes.</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
