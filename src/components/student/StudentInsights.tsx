import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  Zap, 
  TrendingUp, 
  Brain, 
  Award, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Sparkles,
  BookOpen,
  FileText
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { classifyLearningProfile, predictPerformance } from '../../services/geminiService';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentInsightsProps {
  studentId: string;
}

export function StudentInsights({ studentId }: StudentInsightsProps) {
  const [profile, setProfile] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleGeneratePDF = () => {
    setGeneratingPDF(true);
    const doc = new jsPDF();
    const studentName = submissions[0]?.studentName || 'Aluno';
    
    doc.setFontSize(18);
    doc.text(`Relatório de Desempenho: ${studentName}`, 14, 22);
    
    doc.setFontSize(12);
    doc.text('Histórico de Evolução:', 14, 32);
    
    const tableData = submissions.map(sub => [
      new Date(sub.completedAt).toLocaleDateString('pt-BR'),
      sub.score,
      sub.maxScore
    ]);
    
    autoTable(doc, {
      startY: 35,
      head: [['Data', 'Nota', 'Nota Máxima']],
      body: tableData,
    });
    
    doc.text('Análise por Competência:', 14, (doc as any).lastAutoTable.finalY + 10);
    
    const competencyData = radarData.map(r => [r.subject, `${r.A.toFixed(2)}%`]);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Competência', 'Acurácia']],
      body: competencyData,
    });
    
    doc.save(`${studentName}_relatorio.pdf`);
    setGeneratingPDF(false);
    toast.success("PDF gerado com sucesso!");
  };

  const handleGenerateProfile = async () => {
    if (!studentId || submissions.length === 0) {
      toast.warning("Dados insuficientes para gerar o perfil. Complete alguns simulados primeiro.");
      return;
    }
    setGeneratingProfile(true);
    try {
      // Aggregate behavioral data from submissions
      const behavioralData = {
        totalSubmissions: submissions.length,
        averageScore: submissions.reduce((acc, sub) => acc + (sub.score / sub.maxScore), 0) / submissions.length,
        recentScores: submissions.slice(0, 3).map(sub => sub.score / sub.maxScore),
        competencyPerformance: submissions[0]?.competencyResults || {}
      };

      const result = await classifyLearningProfile(behavioralData);
      
      // Save to Firestore
      await addDoc(collection(db, 'learning_profiles'), {
        userId: studentId,
        ...result,
        updatedAt: serverTimestamp()
      });

      toast.success("Perfil de aprendizado gerado com sucesso!");
    } catch (error) {
      console.error("Error generating learning profile:", error);
      toast.error("Erro ao gerar perfil de aprendizado.");
    } finally {
      setGeneratingProfile(false);
    }
  };

  useEffect(() => {
    if (!studentId) return;

    // Fetch learning profile
    const profileUnsubscribe = onSnapshot(
      query(collection(db, 'learning_profiles'), where('userId', '==', studentId)),
      (snapshot) => {
        if (!snapshot.empty) {
          setProfile(snapshot.docs[0].data());
        }
      }
    );

    // Fetch performance predictions
    const predictionUnsubscribe = onSnapshot(
      query(collection(db, 'performance_predictions'), where('userId', '==', studentId), orderBy('createdAt', 'desc'), limit(1)),
      (snapshot) => {
        if (!snapshot.empty) {
          setPrediction(snapshot.docs[0].data());
        }
      }
    );

    // Fetch recent submissions for radar and evolution
    const submissionsUnsubscribe = onSnapshot(
      query(collection(db, 'exam_submissions'), where('studentId', '==', studentId), orderBy('completedAt', 'desc'), limit(10)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(data);
        
        // Process radar data from the most recent submission
        const latestSub = data[0] as any;
        if (data.length > 0 && latestSub?.competencyResults) {
          const results = latestSub.competencyResults;
          const radar = Object.keys(results).map(key => ({
            subject: key,
            A: results[key].acuracia * 100,
            fullMark: 100
          }));
          setRadarData(radar);
        }
        setLoading(false);
      }
    );

    return () => {
      profileUnsubscribe();
      predictionUnsubscribe();
      submissionsUnsubscribe();
    };
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Stats & Prediction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600">
              <Brain size={24} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Perfil VARK</span>
              <button
                onClick={handleGeneratePDF}
                disabled={generatingPDF || submissions.length === 0}
                className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {generatingPDF ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileText size={12} />}
                PDF
              </button>
              {!profile && (
                <button
                  onClick={handleGenerateProfile}
                  disabled={generatingProfile}
                  className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {generatingProfile ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={12} />}
                  Gerar
                </button>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {profile?.vark_style || 'Não Analisado'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profile?.cognitive_level || 'Estilo de Aprendizagem Predominante'}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex gap-2 flex-wrap">
              {profile?.behavioral_traits?.map((trait: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] text-gray-600 dark:text-gray-400">
                  {trait}
                </span>
              ))}
              {!profile && (
                <span className="text-xs text-gray-400 italic">Clique em gerar para analisar seu perfil.</span>
              )}
            </div>
            {profile?.recommendations && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-xs text-emerald-800 dark:text-emerald-200 italic">
                  "{profile.recommendations}"
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-blue-100 dark:border-blue-900/30 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Previsão SAEP</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                {prediction?.probabilityOfSuccess ? `${prediction.probabilityOfSuccess}%` : '--'}
              </h3>
              <span className={`text-xs font-bold ${
                prediction?.riskLevel === 'Baixo' ? 'text-emerald-500' : 
                prediction?.riskLevel === 'Médio' ? 'text-amber-500' : 'text-red-500'
              }`}>
                Risco {prediction?.riskLevel || '---'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Probabilidade de Aprovação</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 italic">Baseado em 12 métricas de desempenho</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-purple-100 dark:border-purple-900/30 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600">
              <Award size={24} />
            </div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Engajamento</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Alta</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nível de Participação Semanal</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full w-[85%] rounded-full"></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Radar & Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Radar de Competências</h3>
              <p className="text-xs text-gray-500">Domínio técnico por área de conhecimento</p>
            </div>
            <Target className="text-emerald-600" size={20} />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Aluno"
                  dataKey="A"
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Evolução de Desempenho</h3>
              <p className="text-xs text-gray-500">Progresso nos últimos 10 simulados</p>
            </div>
            <TrendingUp className="text-blue-600" size={20} />
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...submissions].reverse()}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="completedAt" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recommendations & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
          <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400">
            <Sparkles size={18} />
            <h4 className="font-bold text-sm">Dicas de Estudo Personalizadas</h4>
          </div>
          <ul className="space-y-3">
            {profile?.recommendations?.split('\n').filter(Boolean).slice(0, 3).map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                <div className="mt-1 p-1 bg-emerald-200 dark:bg-emerald-800 rounded-full">
                  <ChevronRight size={10} />
                </div>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/20">
          <div className="flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-400">
            <AlertCircle size={18} />
            <h4 className="font-bold text-sm">Pontos de Atenção</h4>
          </div>
          <ul className="space-y-3">
            {prediction?.factors?.slice(0, 3).map((factor: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                <div className="mt-1 p-1 bg-amber-200 dark:bg-amber-800 rounded-full">
                  <AlertCircle size={10} />
                </div>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
