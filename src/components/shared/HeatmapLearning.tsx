import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  Flame, 
  AlertTriangle
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export function HeatmapLearning() {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const [classStats, setClassStats] = useState<any[]>([]);
  const [riskStudents, setRiskStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTurmas(data);
      if (data.length > 0 && !selectedTurmaId) setSelectedTurmaId(data[0].id);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedTurmaId) return;

    // Simulate heatmap data logic
    // In a production app, we would aggregate submissions by competency for the specific class
    const stats = [
      { name: 'C1 - Interpret.', avg: 85, color: '#10b981' },
      { name: 'C2 - Conceito', avg: 45, color: '#ef4444' },
      { name: 'C3 - Aplicação', avg: 65, color: '#f59e0b' },
      { name: 'C4 - Análise', avg: 25, color: '#ef4444' },
      { name: 'C5 - Síntese', avg: 55, color: '#f59e0b' },
    ];
    setClassStats(stats);

    setRiskStudents([
      { name: 'Ana Souza', score: 32, reason: 'Queda de 20% no engajamento', level: 'Critical' },
      { name: 'Beto Lima', score: 45, reason: 'Baixo acesso às atividades', level: 'High' },
      { name: 'Carla Dias', score: 58, reason: 'Dificuldade na Competência 4', level: 'Medium' },
    ]);

  }, [selectedTurmaId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <Flame className="text-amber-500" />
            Heatmap de Aprendizagem
          </h2>
          <p className="text-sm text-gray-500">Identificação proativa de gargalos pedagógicos.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedTurmaId || ''} 
            onChange={(e) => setSelectedTurmaId(e.target.value)}
            className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            {turmas.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Heatmap/Bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Domínio por Competência</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Bom</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Atenção</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Crítico</span>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={classStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
                  {classStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Alunos em Risco
            </h3>
            <div className="space-y-4">
              {riskStudents.map((student, i) => (
                <div key={i} className="group p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{student.name}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                      student.level === 'Critical' ? 'bg-red-100 text-red-600' :
                      student.level === 'High' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {student.level}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">{student.reason}</p>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${student.level === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`} 
                      style={{ width: `${student.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-lg overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="font-bold mb-2">Observatório Pedagógico</h3>
              <p className="text-xs text-emerald-100 mb-6">A IA detectou padrões de atraso na Competência 4 em 40% da turma.</p>
              <button className="px-4 py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-50 transition-all">
                Sugerir Intervenção
              </button>
            </div>
            <Flame className="absolute -bottom-4 -right-4 w-32 h-32 text-emerald-500 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
