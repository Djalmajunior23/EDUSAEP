import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

interface CompetencyNode {
  subject: string;
  A: number; // Student score
  fullMark: number;
}

interface MapaCompetenciasProps {
  data: CompetencyNode[];
}

export function MapaCompetencias({ data }: MapaCompetenciasProps) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-500 text-center py-4">Nenhum dado de competência disponível.</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
          <Radar name="Aluno" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
          <Tooltip 
            formatter={(value: number) => [`${value}%`, 'Domínio']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
