import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AggregatedBIViewProps {
  data: { name: string; media: number; alunos: number }[];
}

export function AggregatedBIView({ data }: AggregatedBIViewProps) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Desempenho por Disciplina</h3>
        <p className="text-xs text-gray-500">Média de desempenho de todos os alunos por disciplina</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: 'none', 
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="media" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.media >= 70 ? '#10b981' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
