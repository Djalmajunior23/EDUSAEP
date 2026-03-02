import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  Upload, 
  FileText, 
  BarChart3, 
  BookOpen, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Download,
  Copy,
  LayoutDashboard,
  Calendar,
  Settings
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { generateDiagnostic, DiagnosticResult } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import PinComponent from './components/PinComponent';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'dashboard' | 'plan' | 'json'>('input');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        setData(results.data);
        setError(null);
      },
      error: (err) => {
        setError("Erro ao processar CSV: " + err.message);
      }
    });
  };

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const json = JSON.parse(e.target.value);
      setData(Array.isArray(json) ? json : [json]);
      setError(null);
    } catch (err) {
      // If not JSON, try to parse as CSV-like text if needed, but let's stick to JSON for paste
      setError("Formato JSON inválido para colagem.");
    }
  };

  const processDiagnostic = async () => {
    if (data.length === 0) {
      setError("Nenhum dado para processar.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await generateDiagnostic(data);
      setResult(res);
      setActiveTab('dashboard');
    } catch (err) {
      setError("Erro ao gerar diagnóstico. Verifique sua chave API e os dados.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Emerald, Amber, Red

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.diagnostico_por_competencia.map(d => ({
      name: d.competencia.length > 20 ? d.competencia.substring(0, 20) + '...' : d.competencia,
      acuracia: d.acuracia_ponderada * 100,
      nivel: d.nivel
    }));
  }, [result]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">EduDiagnóstico SAEP</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Especialista em Avaliação</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'input', label: 'Dados', icon: Upload },
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: !result },
            { id: 'plan', label: 'Plano', icon: Calendar, disabled: !result },
            { id: 'json', label: 'JSON', icon: Settings, disabled: !result },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
              disabled={tab.disabled}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-white text-emerald-700 shadow-sm" 
                  : tab.disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-emerald-600 hover:bg-white/50"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'input' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Importar Dados</h2>
                    <p className="text-gray-500">Carregue o arquivo CSV do simulado ou cole o JSON bruto.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700 mb-2 block">Arquivo CSV</span>
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center group-hover:border-emerald-400 transition-colors bg-gray-50">
                          <Upload className="mx-auto text-gray-400 mb-3 group-hover:text-emerald-500 transition-colors" size={32} />
                          <p className="text-sm text-gray-600">
                            {data.length > 0 ? `${data.length} linhas carregadas` : "Clique ou arraste o arquivo CSV aqui"}
                          </p>
                        </div>
                      </div>
                    </label>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 uppercase tracking-widest text-[10px] font-bold">OU</span>
                      </div>
                    </div>

                    <label className="block">
                      <span className="text-sm font-semibold text-gray-700 mb-2 block">Colar JSON</span>
                      <textarea
                        onChange={handlePaste}
                        placeholder='[{"aluno": "João", "competencia": "C1", "acertou": 1, "bloom": "Médio"}, ...]'
                        className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                    </label>
                  </div>

                  <button
                    onClick={processDiagnostic}
                    disabled={loading || data.length === 0}
                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                    {loading ? "Processando..." : "Gerar Diagnóstico"}
                  </button>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-emerald-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                      <h3 className="text-xl font-bold">Instruções de Mapeamento</h3>
                      <ul className="space-y-3 text-emerald-100 text-sm">
                        <li className="flex gap-2">
                          <ChevronRight size={16} className="shrink-0 text-emerald-400" />
                          <span>O sistema detecta automaticamente colunas como <b>competencia</b>, <b>bloom</b> e <b>acertou</b>.</span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight size={16} className="shrink-0 text-emerald-400" />
                          <span>Pesos automáticos: Fácil (1.0), Médio (1.5), Difícil (2.0), Superdifícil (3.0).</span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight size={16} className="shrink-0 text-emerald-400" />
                          <span>Gere diagnósticos individuais ou por turma (o sistema agrupa por aluno).</span>
                        </li>
                      </ul>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
                  </div>

                  <PinComponent />

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Prévia dos Dados</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {data.length > 0 && Object.keys(data[0]).slice(0, 4).map(k => (
                              <th key={k} className="pb-2 font-semibold text-gray-600">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              {Object.values(row).slice(0, 4).map((v: any, j) => (
                                <td key={j} className="py-2 text-gray-500 truncate max-w-[100px]">{String(v)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {data.length === 0 && <p className="text-center py-8 text-gray-400 italic">Nenhum dado carregado</p>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Acurácia Geral</p>
                  <p className="text-3xl font-light">{(result.summary.acuracia_geral * 100).toFixed(1)}%</p>
                  <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${result.summary.acuracia_geral * 100}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Acurácia Ponderada</p>
                  <p className="text-3xl font-light">{(result.summary.acuracia_ponderada * 100).toFixed(1)}%</p>
                  <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${result.summary.acuracia_ponderada * 100}%` }}
                    />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Questões</p>
                  <p className="text-3xl font-light">{result.summary.total_questoes}</p>
                  <p className="text-xs text-gray-500 mt-2">{result.summary.acertos} acertos totais</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Aluno</p>
                  <p className="text-xl font-bold text-emerald-900 truncate">{result.aluno}</p>
                  <p className="text-xs text-emerald-700 mt-2">Diagnóstico Individual</p>
                </div>
              </div>

              {/* Alerts */}
              {result.summary.alertas_dados.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-center">
                  <AlertCircle className="text-amber-600" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900">Alertas de Dados</p>
                    <p className="text-xs text-amber-700">{result.summary.alertas_dados.join(', ')}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold">Desempenho por Competência</h3>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Forte</span>
                      <span className="flex items-center gap-1.5 text-amber-600"><div className="w-2 h-2 rounded-full bg-amber-500" /> Atenção</span>
                      <span className="flex items-center gap-1.5 text-red-600"><div className="w-2 h-2 rounded-full bg-red-500" /> Crítico</span>
                    </div>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={150} 
                          tick={{ fontSize: 11, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="acuracia" radius={[0, 4, 4, 0]} barSize={20}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.nivel === 'Forte' ? '#10b981' : entry.nivel === 'Atenção' ? '#f59e0b' : '#ef4444'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Message for student */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold mb-6">Feedback Personalizado</h3>
                  <div className="flex-1 bg-gray-50 rounded-xl p-6 relative">
                    <div className="absolute top-0 left-6 -translate-y-1/2 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                      <UserCheck size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700 italic">
                      "{result.mensagem_para_o_aluno}"
                    </p>
                  </div>
                  <div className="mt-6 p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">Ações Sugeridas para Instrutor</p>
                    <ul className="space-y-2">
                      {result.acoes_para_o_instrutor.slice(0, 3).map((acao, i) => (
                        <li key={i} className="text-xs text-emerald-900 flex gap-2">
                          <span className="text-emerald-400">•</span> {acao}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Detailed Competency Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {result.diagnostico_por_competencia.map((comp, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className={cn(
                      "px-6 py-4 border-b flex items-center justify-between",
                      comp.nivel === 'Forte' ? "bg-emerald-50 border-emerald-100" : 
                      comp.nivel === 'Atenção' ? "bg-amber-50 border-amber-100" : 
                      "bg-red-50 border-red-100"
                    )}>
                      <h4 className="font-bold text-sm truncate pr-2">{comp.competencia}</h4>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        comp.nivel === 'Forte' ? "bg-emerald-200 text-emerald-800" : 
                        comp.nivel === 'Atenção' ? "bg-amber-200 text-amber-800" : 
                        "bg-red-200 text-red-800"
                      )}>
                        {comp.nivel}
                      </span>
                    </div>
                    <div className="p-6 space-y-4 flex-1">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acurácia Ponderada</p>
                          <p className="text-2xl font-light">{(comp.acuracia_ponderada * 100).toFixed(0)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Questões</p>
                          <p className="text-sm font-medium">{comp.acertos}/{comp.total_questoes}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conhecimentos Críticos</p>
                        <div className="flex flex-wrap gap-1.5">
                          {comp.conhecimentos_fracos.map((c, j) => (
                            <span key={j} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                              {c}
                            </span>
                          ))}
                          {comp.conhecimentos_fracos.length === 0 && <span className="text-[10px] text-gray-400 italic">Nenhum identificado</span>}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-50">
                        <p className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-bold text-gray-900">Recomendação:</span> {comp.recomendacoes}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'plan' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Plano de Estudos - 7 Dias</h2>
                <p className="text-gray-500">Cronograma intensivo baseado nas competências em nível crítico.</p>
              </div>

              <div className="space-y-4">
                {result.plano_de_estudos_7_dias.map((dia) => (
                  <div key={dia.dia} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex">
                    <div className="w-24 bg-emerald-600 flex flex-col items-center justify-center text-white shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Dia</span>
                      <span className="text-4xl font-light">{dia.dia}</span>
                    </div>
                    <div className="p-8 flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-emerald-900">{dia.tema}</h3>
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 size={12} />
                          Meta do Dia
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atividades</p>
                          <ul className="space-y-2">
                            {dia.atividades.map((atv, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                {atv}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Critério de Sucesso</p>
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 italic">
                            "{dia.criterio_sucesso}"
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-4 pt-8">
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                  <Download size={18} /> Baixar PDF
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                  <Calendar size={18} /> Adicionar ao Google Agenda
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'json' && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Saída JSON Estruturada</h2>
                  <p className="text-gray-500">Formato pronto para integração com sistemas externos.</p>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all"
                >
                  <Copy size={16} /> Copiar JSON
                </button>
              </div>
              <div className="bg-[#1A1A1A] text-emerald-400 p-8 rounded-2xl font-mono text-xs overflow-auto max-h-[600px] shadow-2xl border border-white/10">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <BarChart3 size={18} />
              </div>
              <span className="font-bold tracking-tight">EduDiagnóstico</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Transformando dados de avaliações em caminhos claros para o sucesso acadêmico através de inteligência artificial especializada.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Padrões Suportados</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>SAEP (Pernambuco)</li>
              <li>SAEB (Nacional)</li>
              <li>Matriz de Referência BNCC</li>
              <li>Taxonomia de Bloom</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Segurança</h4>
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 size={16} />
              Processamento Local & Seguro
            </div>
            <p className="text-xs text-gray-400">
              Seus dados são processados via API Gemini e não são armazenados permanentemente em nossos servidores.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">© 2024 EduDiagnóstico SAEP - Versão 1.0.0</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Privacidade</a>
            <a href="#" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Termos</a>
            <a href="#" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
