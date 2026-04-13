import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { 
  Users, FileText, Target, TrendingUp, AlertTriangle, CheckCircle, 
  Filter, Calendar, BookOpen, GraduationCap, ArrowUpRight, ArrowDownRight, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProfessorInsights } from './ProfessorInsights';
import { UserProfile } from '../../App';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DashboardProps {
  userProfile: UserProfile | null;
  stats: {
    totalStudents: number;
    totalExams: number;
    averageScore: number;
    successRate: number;
    evolutionRate: number;
    criticalCompetencies: string[];
  };
  disciplinePerformance: any[];
  studentEvolution: any[];
  competencyDistribution: any[];
  classComparison: any[];
}

export function AdvancedDashboard({ userProfile, stats, disciplinePerformance, studentEvolution, competencyDistribution, classComparison }: DashboardProps) {
  return (
    <div className="space-y-8 p-4 md:p-8 bg-gray-50/50 min-h-screen">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Analítico</h1>
          <p className="text-gray-500">Visão geral do desempenho pedagógico por competências.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Calendar size={18} />
            Últimos 30 dias
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <Filter size={18} />
            Filtros Avançados
          </button>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Sparkles className="text-emerald-600" />
          Insights Gerados por IA
        </h2>
        <ProfessorInsights userProfile={userProfile} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total de Alunos" 
          value={stats.totalStudents} 
          icon={<Users size={24} />} 
          trend="+5%" 
          trendType="up"
          color="blue"
        />
        <KpiCard 
          title="Simulados Realizados" 
          value={stats.totalExams} 
          icon={<FileText size={24} />} 
          trend="+12%" 
          trendType="up"
          color="emerald"
        />
        <KpiCard 
          title="Média Geral" 
          value={`${(stats.averageScore * 100).toFixed(1)}%`} 
          icon={<Target size={24} />} 
          trend="-2%" 
          trendType="down"
          color="amber"
        />
        <KpiCard 
          title="Taxa de Sucesso" 
          value={`${(stats.successRate * 100).toFixed(1)}%`} 
          icon={<CheckCircle size={24} />} 
          trend="+8%" 
          trendType="up"
          color="indigo"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance by Discipline */}
        <ChartCard title="Desempenho por Disciplina" subtitle="Média de acertos por unidade curricular">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={disciplinePerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Student Evolution */}
        <ChartCard title="Evolução Temporal" subtitle="Progresso médio da turma ao longo do semestre">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={studentEvolution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Competency Distribution */}
        <ChartCard title="Distribuição de Competências" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={competencyDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {competencyDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Radar Chart for Skills */}
        <ChartCard title="Mapa de Habilidades" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencyDistribution}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Turma A" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Critical Alerts */}
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-red-100 space-y-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="font-bold text-lg">Alertas Críticos</h3>
          </div>
          <div className="space-y-4">
            {stats.criticalCompetencies.map((comp, idx) => (
              <div key={idx} className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-red-900">{comp}</p>
                  <p className="text-xs text-red-600">Abaixo de 50% de acerto</p>
                </div>
                <button className="p-2 bg-white rounded-lg text-red-600 shadow-sm hover:bg-red-50 transition-all">
                  <ArrowUpRight size={16} />
                </button>
              </div>
            ))}
            <button className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-all">
              Ver todos os alertas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, trend, trendType, color }: { title: string, value: string | number, icon: React.ReactNode, trend: string, trendType: 'up' | 'down', color: string }) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl border", colors[color])}>
          {icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
          trendType === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trendType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-black text-gray-900">{value}</h3>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className }: { title: string, subtitle?: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-white p-8 rounded-3xl shadow-xl border border-gray-100", className)}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
