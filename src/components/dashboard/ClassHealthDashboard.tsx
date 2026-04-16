import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Brain,
  MessageSquare,
  ArrowRight,
  Target
} from 'lucide-react';
import { PedagogicalEngine, StudentSignals, TeacherContext } from '../../services/pedagogicalEngine';

// Mock data for the analytical engine
const MOCK_STUDENTS: StudentSignals[] = [
  {
    studentId: '1',
    studentName: 'Ana Silva',
    classId: 'class-a',
    attendanceRate: 95,
    accessFrequencyLast14Days: 12,
    averageStudyMinutesLast14Days: 45,
    deliveryRate: 90,
    averageGrade: 85,
    recentTrend: 5,
    pendingActivities: 1,
    lateSubmissions: 0,
    missedDeadlines: 0,
    competencies: [
      { competencyId: 'c1', competencyName: 'Interpretação Textual', averageScore: 88, attempts: 10 },
      { competencyId: 'c2', competencyName: 'Argumentação', averageScore: 75, attempts: 8 },
    ],
    activities: [],
    errors: [],
  },
  {
    studentId: '2',
    studentName: 'Carlos Oliveira',
    classId: 'class-a',
    attendanceRate: 70,
    accessFrequencyLast14Days: 2,
    averageStudyMinutesLast14Days: 10,
    deliveryRate: 40,
    averageGrade: 45,
    recentTrend: -25,
    pendingActivities: 5,
    lateSubmissions: 3,
    missedDeadlines: 4,
    competencies: [
      { competencyId: 'c1', competencyName: 'Interpretação Textual', averageScore: 42, attempts: 5 },
      { competencyId: 'c2', competencyName: 'Argumentação', averageScore: 35, attempts: 4 },
    ],
    activities: [],
    errors: [
      { competencyId: 'c1', occurrences: 8, errorType: 'CONCEPTUAL', wrongTopics: ['Coesão'] }
    ],
  },
  {
    studentId: '3',
    studentName: 'Beatriz Santos',
    classId: 'class-a',
    attendanceRate: 85,
    accessFrequencyLast14Days: 6,
    averageStudyMinutesLast14Days: 30,
    deliveryRate: 75,
    averageGrade: 68,
    recentTrend: -5,
    pendingActivities: 2,
    lateSubmissions: 1,
    missedDeadlines: 0,
    competencies: [
      { competencyId: 'c1', competencyName: 'Interpretação Textual', averageScore: 65, attempts: 7 },
      { competencyId: 'c2', competencyName: 'Argumentação', averageScore: 70, attempts: 6 },
    ],
    activities: [],
    errors: [],
  }
];

const TEACHER_CONTEXT: TeacherContext = {
  teacherId: 'teacher-1',
  classId: 'class-a',
  className: '3º Ano A - Matutino',
  subjectName: 'Linguagens e Códigos'
};

export function ClassHealthDashboard() {
  const engine = useMemo(() => new PedagogicalEngine(), []);
  const classOverview = useMemo(() => engine.evaluateClass(MOCK_STUDENTS, TEACHER_CONTEXT), [engine]);
  const studentDecisions = useMemo(() => MOCK_STUDENTS.map(s => engine.evaluateStudent(s, TEACHER_CONTEXT)), [engine]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedDecision = useMemo(() => 
    studentDecisions.find(d => d.studentId === selectedStudentId),
    [studentDecisions, selectedStudentId]
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Class Level Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-gray-400 mb-4">
            <Activity size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Status da Turma</span>
          </div>
          <div>
            <div className={`text-2xl font-black ${
              classOverview.healthStatus === 'CRITICAL' ? 'text-red-500' :
              classOverview.healthStatus === 'ATTENTION' ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {classOverview.healthStatus === 'CRITICAL' ? 'CRÍTICO' :
               classOverview.healthStatus === 'ATTENTION' ? 'EM ATENÇÃO' : 'SAUDÁVEL'}
            </div>
            <p className="text-xs text-gray-500 font-medium">Saúde baseada em engajamento e notas.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 text-gray-400 mb-4">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Média da Turma</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{classOverview.averageGrade}</div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-1">
             <TrendingUp size={12} /> +2.4% vs mês passado
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 text-gray-400 mb-4">
            <CheckCircle2 size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Taxa de Entrega</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{classOverview.averageDeliveryRate}%</div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
             <div className="h-full bg-blue-500" style={{ width: `${classOverview.averageDeliveryRate}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 text-gray-400 mb-4">
            <AlertTriangle size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Riscos Identificados</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-2xl font-black text-red-500">{classOverview.studentsAtHighRisk}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Alto</div>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div>
              <div className="text-2xl font-black text-amber-500">{classOverview.studentsAtMediumRisk}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Médio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Recommendations */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
          <Brain className="text-emerald-600" />
          Recomendações para a Turma
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classOverview.recommendations.map(rec => (
            <div key={rec.id} className={`p-5 rounded-2xl border ${
              rec.priority === 'HIGH' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                  rec.priority === 'HIGH' ? 'bg-red-200 text-red-700' : 'bg-emerald-200 text-emerald-700'
                }`}>
                  {rec.type}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{rec.priority} Prioridade</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{rec.title}</h4>
              <p className="text-xs text-gray-600 mb-3">{rec.description}</p>
              <div className="text-[10px] italic text-gray-500 bg-white/50 p-2 rounded-lg border border-gray-100">
                Motivo: {rec.reason}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student List & Selection */}
        <div className="lg:col-span-1 space-y-4">
           <h3 className="text-lg font-bold flex items-center gap-2">
             <Users size={20} className="text-gray-400" />
             Alunos da Turma
           </h3>
           <div className="space-y-2">
              {studentDecisions.map(decision => (
                <button
                  key={decision.studentId}
                  onClick={() => setSelectedStudentId(decision.studentId)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    selectedStudentId === decision.studentId
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                      : 'bg-white border-gray-100 hover:border-emerald-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold truncate">{decision.studentName}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      selectedStudentId === decision.studentId 
                        ? 'bg-white/20' 
                        : decision.risk.level === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                       {decision.risk.level} RISCO
                    </span>
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* Detailed Student Insight */}
        <div className="lg:col-span-2">
          {selectedDecision ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{selectedDecision.studentName}</h3>
                  <p className="text-sm text-gray-500">ID Pedagógico: {selectedDecision.studentId}</p>
                </div>
                <div className={`p-4 rounded-2xl text-center min-w-[124px] ${
                  selectedDecision.risk.level === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <div className="text-xs font-black uppercase tracking-widest mb-1">Score de Risco</div>
                  <div className="text-3xl font-black">{selectedDecision.risk.score}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Competency Insights */}
                 <div className="space-y-4">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Target size={16} /> Competências
                    </h4>
                    <div className="space-y-3">
                      {selectedDecision.competencyInsights.map(insight => (
                        <div key={insight.competencyId} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm">{insight.competencyName}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              insight.status === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              {insight.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mb-2">{insight.reason}</p>
                          {insight.recommendedAction && (
                            <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                              Sugestão: {insight.recommendedAction}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Recommendations */}
                 <div className="space-y-4">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={16} /> Plano de Ação IA
                    </h4>
                    <div className="space-y-3">
                      {selectedDecision.recommendations.map(rec => (
                        <div key={rec.id} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 relative group overflow-hidden">
                          <div className="flex items-center justify-between mb-1">
                             <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest pr-12">{rec.title}</div>
                             <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                               rec.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                             }`}>
                               {rec.priority}
                             </span>
                          </div>
                          <p className="text-[10px] text-gray-600 line-clamp-2">{rec.description}</p>
                          <div className="mt-2 flex items-center gap-2 text-[8px] font-bold text-gray-400 bg-white/50 px-2 py-1 rounded">
                            Role: {rec.targetProfile}
                          </div>
                          <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 text-emerald-200 group-hover:right-2 transition-all" size={24} />
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800">
                       <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Próxima Melhor Ação (Professor)</h5>
                       <p className="text-xs text-white font-medium">{selectedDecision.nextBestActionForTeacher || 'Nenhuma ação crítica pendente.'}</p>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Padrão de Erro Predominante:</span>
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase border border-amber-100">
                       {selectedDecision.groupedErrorSummary.dominantType}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">({selectedDecision.groupedErrorSummary.total} ocorrências totais)</span>
                 </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
               <div className="max-w-xs space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-gray-300">
                    <Users size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-400">Nenhum Aluno Selecionado</h3>
                  <p className="text-sm text-gray-400 italic">Selecione um aluno ao lado para visualizar o diagnóstico pedagógico avançado e recomendações da IA.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
