import React, { useState, useMemo } from 'react';
import { Download, Loader2, Trash2, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, LineChart, CartesianGrid, XAxis, 
  YAxis, Tooltip, Legend, Line 
} from 'recharts';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { pdfExportService } from '../../modules/simulados/services/pdfExportService';

interface ReportsViewProps {
  history: any[];
}

export function ReportsView({ history }: ReportsViewProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedCompetency, setSelectedCompetency] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const students = useMemo(() => {
    const uniqueStudents = Array.from(new Set(history.map(h => h.aluno)));
    return uniqueStudents.sort();
  }, [history]);

  const competencies = useMemo(() => {
    const uniqueComps = new Set<string>();
    history.forEach(h => {
      if (h.result?.diagnostico_por_competencia) {
        h.result.diagnostico_por_competencia.forEach((c: any) => {
          uniqueComps.add(c.competencia);
        });
      }
    });
    return Array.from(uniqueComps).sort();
  }, [history]);

  const suggestedStudents = useMemo(() => {
    if (!history.length) return [];
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const suggestions: { aluno: string, reason: string, type: 'recent' | 'variance' }[] = [];
    
    const studentData: Record<string, any[]> = {};
    history.forEach(h => {
      if (!studentData[h.aluno]) studentData[h.aluno] = [];
      studentData[h.aluno].push(h);
    });
    
    Object.entries(studentData).forEach(([aluno, data]) => {
      const getDate = (createdAt: any) => {
        if (!createdAt) return new Date(0);
        if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
        return new Date(createdAt);
      };

      const sorted = [...data].sort((a, b) => getDate(b.createdAt).getTime() - getDate(a.createdAt).getTime());
      
      const mostRecent = getDate(sorted[0].createdAt);
      if (mostRecent >= sevenDaysAgo) {
        suggestions.push({ aluno, reason: 'Diagnóstico recente', type: 'recent' });
      }
      
      if (sorted.length >= 2) {
        const acc1 = sorted[0].result?.summary?.acuracia_geral || 0;
        const acc2 = sorted[1].result?.summary?.acuracia_geral || 0;
        const diff = Math.abs(acc1 - acc2);
        if (diff >= 0.15) {
          suggestions.push({ 
            aluno, 
            reason: `Variação de ${(diff * 100).toFixed(0)}% no desempenho`, 
            type: 'variance' 
          });
        }
      }
    });
    
    const uniqueSuggestions = suggestions.reduce((acc, curr) => {
      const existing = acc.find(s => s.aluno === curr.aluno);
      if (!existing) {
        acc.push(curr);
      } else if (curr.type === 'variance' && existing.type === 'recent') {
        const idx = acc.indexOf(existing);
        acc[idx] = curr;
      }
      return acc;
    }, [] as typeof suggestions);

    return uniqueSuggestions.sort((a, _b) => a.type === 'variance' ? -1 : 1).slice(0, 4);
  }, [history]);

  const chartData = useMemo(() => {
    let filtered = [...history];

    const getDate = (createdAt: any) => {
      if (!createdAt) return new Date(0);
      if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
      return new Date(createdAt);
    };

    if (selectedStudent !== 'all') {
      filtered = filtered.filter(h => h.aluno === selectedStudent);
    }

    if (startDate) {
      const parts = startDate.split('-');
      if(parts.length === 3) {
      	const [year, month, day] = parts.map(Number);
      	const start = new Date(year, month - 1, day, 0, 0, 0);
      	filtered = filtered.filter(h => getDate(h.createdAt) >= start);
      }
    }

    if (endDate) {
      const parts = endDate.split('-');
      if(parts.length === 3) {
      	const [year, month, day] = parts.map(Number);
      	const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      	filtered = filtered.filter(h => getDate(h.createdAt) <= end);
      }
    }

    // Sort by date
    filtered.sort((a, b) => getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime());

    return filtered.map(h => {
      let acuracia = Math.round((h.result?.summary?.acuracia_geral || 0) * 100);
      let acuraciaPonderada = Math.round((h.result?.summary?.acuracia_ponderada || 0) * 100);

      if (selectedCompetency !== 'all') {
        const comp = h.result?.diagnostico_por_competencia?.find((c: any) => c.competencia === selectedCompetency);
        if (comp) {
          acuracia = Math.round(comp.acuracia * 100);
          acuraciaPonderada = Math.round(comp.acuracia_ponderada * 100);
        } else {
          return null; // Skip if student didn't have this competency in this diagnostic
        }
      }

      const dateObj = getDate(h.createdAt);

      return {
        date: dateObj.toLocaleDateString('pt-BR'),
        aluno: h.aluno,
        acuracia,
        acuraciaPonderada,
        timestamp: dateObj.getTime()
      };
    }).filter(Boolean) as any[];
  }, [history, selectedStudent, startDate, endDate, selectedCompetency]);

  const groupedData = useMemo(() => {
    if (selectedStudent !== 'all') return { [selectedStudent]: chartData };
    
    const groups: Record<string, any[]> = {};
    chartData.forEach(d => {
      if (!groups[d.aluno]) groups[d.aluno] = [];
      groups[d.aluno].push(d);
    });
    return groups;
  }, [chartData, selectedStudent]);

  const downloadCSV = () => {
    if (chartData.length === 0) return;
    const isGeral = selectedCompetency === 'all';
    const headers = ['Data', 'Aluno', isGeral ? 'Média Geral (%)' : `Acurácia - ${selectedCompetency} (%)`, isGeral ? 'Média Ponderada (%)' : `Acurácia Ponderada - ${selectedCompetency} (%)`, 'Competência'];
    const rows = chartData.map(d => [
      d.date, 
      `"${d.aluno}"`, 
      d.acuracia, 
      d.acuraciaPonderada, 
      `"${isGeral ? 'Geral' : selectedCompetency}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_desempenho_${selectedStudent === 'all' ? 'geral' : selectedStudent}_${isGeral ? 'geral' : selectedCompetency}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    try {
      const filename = `relatorio_desempenho_${selectedStudent || 'geral'}`;
      await pdfExportService.exportElementToPDF(element, filename);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios de Desempenho</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe a evolução dos alunos ao longo do tempo.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            disabled={chartData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm font-bold"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={downloadPDF}
            disabled={chartData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-bold"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      <div id="report-content" className="space-y-8">
        {/* Summary Table for All Students */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Desempenho dos Alunos {selectedCompetency !== 'all' ? `- ${selectedCompetency}` : '(Geral)'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Média (%)</th>
                  <th className="px-4 py-3">Último Desempenho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {Object.entries(groupedData).map(([aluno, data]) => {
                  const sorted = [...data].sort((a, b) => b.timestamp - a.timestamp);
                  const avg = Math.round(data.reduce((acc, curr) => acc + curr.acuracia, 0) / data.length);
                  return (
                    <tr key={aluno} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{aluno}</td>
                      <td className="px-4 py-3 dark:text-gray-300">{avg}%</td>
                      <td className="px-4 py-3 dark:text-gray-300">{sorted[0].acuracia}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Smart Suggestions */}
      {suggestedStudents.length > 0 && showSuggestions && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              <Loader2 size={18} className="text-emerald-600" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Filtro Inteligente: Alunos Sugeridos</h3>
            </div>
            <button 
              onClick={() => setShowSuggestions(false)}
              className="text-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestedStudents.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedStudent(s.aluno)}
                className={cn(
                  "p-4 bg-white dark:bg-gray-800 rounded-xl border border-emerald-100 dark:border-emerald-900/20 text-left hover:shadow-md transition-all group",
                  selectedStudent === s.aluno && "ring-2 ring-emerald-500"
                )}
              >
                <p className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors truncate">{s.aluno}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{s.reason}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl border transition-all",
              !startDate && !endDate ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            Todo o período
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 7);
              setEndDate(end.toISOString().split('T')[0]);
              setStartDate(start.toISOString().split('T')[0]);
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl border transition-all",
              startDate && endDate && (new Date(endDate).getTime() - new Date(startDate).getTime()) <= 7 * 24 * 60 * 60 * 1000 && (new Date(endDate).getTime() - new Date(startDate).getTime()) > 0 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 30);
              setEndDate(end.toISOString().split('T')[0]);
              setStartDate(start.toISOString().split('T')[0]);
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl border transition-all",
              startDate && endDate && (new Date(endDate).getTime() - new Date(startDate).getTime()) > 7 * 24 * 60 * 60 * 1000 && (new Date(endDate).getTime() - new Date(startDate).getTime()) <= 30 * 24 * 60 * 60 * 1000 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            Últimos 30 dias
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtrar por Aluno</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            >
              <option value="all">Todos os Alunos</option>
              {students.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtrar por Competência</label>
            <select
              value={selectedCompetency}
              onChange={(e) => setSelectedCompetency(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            >
              <option value="all">Geral (Todas)</option>
              {competencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Evolução da Média (%) {selectedCompetency !== 'all' && `- ${selectedCompetency}`}</h3>
        {chartData.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedData).map(([student, data]) => (
              <div key={student} className="mb-8">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{student}</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          backgroundColor: '#fff',
                          color: '#111'
                        }}
                      />
                      <Legend verticalAlign="top" align="right" height={36} />
                      <Line 
                        type="monotone" 
                        dataKey="acuracia" 
                        name={selectedCompetency === 'all' ? "Média Geral" : `Acurácia - ${selectedCompetency}`}
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="acuraciaPonderada" 
                        name={selectedCompetency === 'all' ? "Média Ponderada" : `Acurácia Ponderada - ${selectedCompetency}`}
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 space-y-4">
            <BarChart3 size={48} className="opacity-20" />
            <p>Nenhum dado encontrado para os filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* Table Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Aluno</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedCompetency === 'all' ? 'Média Geral' : `Acurácia - ${selectedCompetency}`}</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedCompetency === 'all' ? 'Média Ponderada' : `Acurácia Ponderada - ${selectedCompetency}`}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {chartData.slice().reverse().map((h, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{h.date}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{h.aluno}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-bold",
                    h.acuracia >= 75 ? "bg-emerald-50 text-emerald-700" :
                    h.acuracia >= 55 ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  )}>
                    {h.acuracia}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-bold",
                    h.acuraciaPonderada >= 75 ? "bg-emerald-50 text-emerald-700" :
                    h.acuraciaPonderada >= 55 ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  )}>
                    {h.acuraciaPonderada}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </motion.div>
  );
}
