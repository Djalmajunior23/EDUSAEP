import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Target, BookOpen, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { generatePedagogicalAnalysis } from '../../services/geminiService';
import { toast } from 'sonner';

export function PedagogicalRecommendations({ userProfile }: { userProfile: any }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestRecommendations();
  }, []);

  const fetchLatestRecommendations = async () => {
    try {
      const q = query(
        collection(db, 'pedagogical_recommendations'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setRecommendations(snapshot.docs[0].data());
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Fetch some context data for the AI
      const submissionsSnap = await getDocs(query(collection(db, 'exam_submissions'), limit(50)));
      const submissions = submissionsSnap.docs.map(doc => doc.data());
      
      const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'aluno'), limit(50)));
      const students = studentsSnap.docs.map(doc => doc.data());

      const context = {
        totalStudents: students.length,
        submissionsCount: submissions.length,
        averageScore: submissions.length > 0 
          ? submissions.reduce((acc, curr: any) => acc + (curr.score / curr.maxScore), 0) / submissions.length 
          : 0,
        recentSubmissions: submissions.slice(0, 10)
      };

      const result = await generatePedagogicalAnalysis(context, 'gemini-3-flash-preview', 'professor');
      setRecommendations(result);
      toast.success("Novas recomendações geradas!");
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast.error("Erro ao gerar recomendações.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-100 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
            <Target size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recomendações Pedagógicas</h3>
            <p className="text-xs text-gray-500">Sugestões estratégicas baseadas no desempenho real</p>
          </div>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {recommendations ? "Atualizar Análise" : "Gerar Recomendações"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {recommendations ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-500" />
                  Pontos de Atenção
                </h4>
                <div className="space-y-2">
                  {recommendations.pontos_atencao?.map((ponto: string, i: number) => (
                    <div key={i} className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900">
                      {ponto}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Estratégias Sugeridas
                </h4>
                <div className="space-y-2">
                  {recommendations.estrategias?.map((est: string, i: number) => (
                    <div key={i} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-900 flex items-start gap-2">
                      <ArrowRight size={14} className="mt-1 flex-shrink-0" />
                      {est}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <BookOpen size={16} />
                Sugestão de Conteúdo
              </h4>
              <p className="text-sm text-indigo-800 leading-relaxed">
                {recommendations.sugestao_conteudo}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 space-y-4"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Sparkles size={32} />
            </div>
            <p className="text-gray-500 text-sm">Clique no botão acima para gerar insights pedagógicos personalizados.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
