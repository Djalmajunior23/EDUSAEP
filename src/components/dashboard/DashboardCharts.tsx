// src/components/dashboard/DashboardCharts.tsx
// import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;

  if (payload.isMaxVariation) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#ef4444" fillOpacity={0.3} />
        <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#fff" strokeWidth={2} />
      </g>
    );
  }

  return (
    <circle cx={cx} cy={cy} r={4} fill="#10b981" stroke="#fff" strokeWidth={1} />
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-xl">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        <p className="text-emerald-600 font-medium">Média: {data.value}%</p>
        {data.isMaxVariation && (
          <p className="text-xs text-red-500 font-bold mt-1 bg-red-50 px-2 py-1 rounded-md">
            Maior Variação
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function DashboardCharts({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2 lg:col-span-1">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Desempenho por Competência</h3>
        <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
          <BarChart data={data.competencias} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
            <Tooltip cursor={{fill: 'transparent'}} />
            <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-1 lg:col-span-1">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Evolução da Turma</h3>
        <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
          <LineChart data={data.evolucao}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={<CustomDot />} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-1 lg:col-span-1">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Análise Multidimensional</h3>
        <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radar}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{fontSize: 11}} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Turma A" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
            <Radar name="Média Geral" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
