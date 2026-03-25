// src/components/dashboard/ClassRanking.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RankingItem {
  id: string;
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

export function ClassRanking({ data }: { data: RankingItem[] }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Ranking Analítico da Turma</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 rounded-tl-lg">Posição</th>
              <th scope="col" className="px-6 py-3">Aluno</th>
              <th scope="col" className="px-6 py-3 text-center">Pontuação Global</th>
              <th scope="col" className="px-6 py-3 text-center rounded-tr-lg">Tendência</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  #{index + 1}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                    item.score >= 80 ? 'bg-green-100 text-green-800' :
                    item.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.score}%
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center">
                  {item.trend === 'up' && <TrendingUp className="text-green-500" size={20} />}
                  {item.trend === 'down' && <TrendingDown className="text-red-500" size={20} />}
                  {item.trend === 'stable' && <Minus className="text-gray-400" size={20} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
