import React, { useState, useEffect } from 'react';
import { Recommendation, getLatestRecommendation, generateStudentRecommendation } from '../../services/recommendationService';
import { 
  Target, Sparkles, BookOpen, CheckCircle2, 
  AlertTriangle, ArrowRight, Loader2, RefreshCw,
  Trophy, Star, Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function RecommendationsView({ user, userProfile }: { user: any, userProfile: any }) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchRecommendation = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rec = await getLatestRecommendation(user.uid);
      setRecommendation(rec);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, [user]);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const rec = await generateStudentRecommendation(user.uid, userProfile?.displayName || 'Estudante');
      if (rec) {
        setRecommendation(rec as any);
        toast.success('Novas recomendações geradas com sucesso!');
      } else {
        toast.error('Não há dados suficientes para gerar recomendações. Realize alguns simulados primeiro.');
      }
    } catch (err) {
      toast.error('Erro ao gerar recomendações.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-gray-500 font-medium">Carregando suas recomendações...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Target className="text-emerald-600" size={32} />
            Recomendações Inteligentes
          </h1>
          <p className="text-gray-500 mt-1">Análise personalizada do seu desempenho por competências.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 group"
        >
          {generating ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />}
          Atualizar Análise
        </button>
      </div>

      {!recommendation ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center space-y-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="text-gray-300" size={40} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-900">Nenhuma recomendação ainda</h3>
            <p className="text-gray-500 mt-2">
              Realize simulados e exercícios para que nossa IA possa analisar seu perfil e sugerir o melhor caminho de estudos.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
          >
            Gerar Primeira Análise
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Diagnosis */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "p-2 rounded-lg",
                  recommendation.prioridade === 'Alta' ? "bg-red-50 text-red-600" : 
                  recommendation.prioridade === 'Média' ? "bg-amber-50 text-amber-600" : 
                  "bg-emerald-50 text-emerald-600"
                )}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Diagnóstico Pedagógico</h3>
                  <p className="text-sm text-gray-500">Prioridade: {recommendation.prioridade}</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                {recommendation.diagnostico}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-emerald-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="text-emerald-400" size={28} />
                  <h3 className="font-bold text-xl">Plano de Ação Sugerido</h3>
                </div>
                <p className="text-emerald-100 leading-relaxed mb-8 text-lg">
                  {recommendation.planoEstudo}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendation.acoesSugeridas.map((acao, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                      <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                      <span className="text-sm font-medium">{acao}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-800 rounded-full blur-3xl opacity-50" />
            </motion.div>
          </div>

          {/* Critical Competencies & Stats */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100"
            >
              <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={20} />
                Foco de Estudo
              </h3>
              <div className="space-y-4">
                {recommendation.competenciasCriticas.length > 0 ? (
                  recommendation.competenciasCriticas.map((comp, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-sm font-bold text-blue-900">{comp}</p>
                      <div className="mt-2 h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-1/3" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <Trophy className="text-emerald-600 mx-auto mb-2" size={32} />
                    <p className="text-sm font-bold text-emerald-900">Excelente!</p>
                    <p className="text-xs text-emerald-600">Nenhuma competência crítica identificada.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {recommendation.atividadesPraticas && recommendation.atividadesPraticas.length > 0 && (
               <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-indigo-50 p-6 rounded-3xl shadow-xl border border-indigo-100"
             >
               <h3 className="font-bold text-lg text-indigo-900 mb-6 flex items-center gap-2">
                 <Zap className="text-indigo-600" size={20} />
                 Micro-Atividades Recomendadas
               </h3>
               <div className="space-y-4">
                 {recommendation.atividadesPraticas.map((ativ, idx) => (
                   <div key={idx} className="p-4 bg-white rounded-2xl shadow-sm border border-indigo-100 transition-all hover:shadow-md">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-sm text-gray-900">{ativ.titulo}</h4>
                       <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md shrink-0 ml-2">
                         {ativ.tempo}
                       </span>
                     </div>
                     <p className="text-sm text-gray-600 leading-relaxed">
                       {ativ.descricao}
                     </p>
                     <div className="mt-3 flex justify-end">
                       <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800">
                         Iniciar Prática <ArrowRight size={12} />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             </motion.div>
            )}

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white">
              <div className="flex items-center gap-2 mb-4">
                <Star className="text-yellow-400" size={20} />
                <h3 className="font-bold text-lg">Dica da IA</h3>
              </div>
              <p className="text-sm text-indigo-100 leading-relaxed italic">
                "A consistência é mais importante que a intensidade. Tente dedicar pelo menos 30 minutos diários às competências de foco."
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
