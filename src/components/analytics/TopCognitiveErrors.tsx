import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { AlertCircle, FileText } from 'lucide-react';
// import { analyzeStudentError } from '../../server/pedagogical/errorIntelligenceEngine';
// import { PedagogicalEngine } from '../../services/pedagogicalEngine';

// Representação de dados baseada em resultados hipotéticos do pedagogicalEngine e analyzeStudentError
const ERROR_DATA = [
  { error: 'Interpretação de Enunciado Complexo', frequencia: 45, comp: 'Leitura e Interpretação' },
  { error: 'Confusão Sintática (Sujeito x Objeto)', frequencia: 32, comp: 'Sintaxe Básica' },
  { error: 'Falta de Coesão Textual', frequencia: 28, comp: 'Produção Textual' },
];

export function TopCognitiveErrors() {
  const [data, setData] = useState(ERROR_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Aqui seria feita a integração com:
    // const engine = new PedagogicalEngine();
    // const results = alunos.map(a => engine.evaluateStudent(a, ...));
    // const analises = results.map(r => analyzeStudentError(...));
  }, []);

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
          <AlertCircle className="text-rose-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Top 3 Erros Cognitivos em Português</h2>
          <p className="text-sm text-gray-500 font-medium">Extraídos das justificativas e avaliação de competências do aluno</p>
        </div>
      </div>

      <div className="h-[250px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="error" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              width={250}
              tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
            />
            <Tooltip 
              cursor={{fill: '#F3F4F6'}}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="frequencia" fill="#EF4444" radius={[0, 8, 8, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 flex flex-col gap-3">
         {data.map((item, idx) => (
           <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col gap-1 w-[70%]">
                 <span className="text-sm font-bold text-gray-900">{item.error}</span>
                 <span className="text-[10px] uppercase font-black text-rose-500 flex items-center gap-1">
                   <FileText size={10} /> {item.comp}
                 </span>
              </div>
              <div className="text-xl font-black text-rose-600 bg-white px-3 py-1 rounded-xl shadow-sm border border-rose-100">
                {item.frequencia} <span className="text-xs text-rose-400 font-medium ml-1">ocorrências</span>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
