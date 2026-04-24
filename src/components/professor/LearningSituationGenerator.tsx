import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Loader2, Save, Sparkles, AlertTriangle, Target, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { generateContentWrapper, getSystemInstruction } from '../../services/geminiService';
import Markdown from 'react-markdown';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, increment, getDocs, query, orderBy } from 'firebase/firestore';
import { LearningSituation } from '../../types/edusaep.types';

interface Props {
  userProfile: any;
  selectedModel: string;
}

export function LearningSituationGenerator({ userProfile, selectedModel }: Props) {
  const [loading, setLoading] = useState(false);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    tema: '',
    curso: '',
    competencia: '',
    perfilTurma: '',
    complexidade: 'médio',
    duracao: ''
  });
  const [result, setResult] = useState<LearningSituation | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const MONTHLY_LIMIT = 5;

  useEffect(() => {
    fetchUsageCount();
    fetchCompetencies();
  }, [userProfile.uid]);

  const fetchCompetencies = async () => {
    try {
      const q = query(collection(db, 'disciplines'), orderBy('name'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompetencies(list);
    } catch (error) {
      console.error("Error fetching competencies:", error);
    }
  };

  const fetchUsageCount = async () => {
    if (!userProfile?.uid) return;
    const date = new Date();
    const monthYear = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const limitDocRef = doc(db, 'teacher_monthly_limits', `${userProfile.uid}_${monthYear}`);
    
    try {
      const snap = await getDoc(limitDocRef);
      if (snap.exists()) {
        setUsageCount(snap.data().count || 0);
      } else {
        setUsageCount(0);
      }
    } catch (error) {
      console.error("Error fetching usage count:", error);
    }
  };

  const handleGenerate = async () => {
    // Re-fetch count to ensure we have the latest data before generating
    await fetchUsageCount();

    if (usageCount >= MONTHLY_LIMIT) {
      toast.error(`Você atingiu o limite mensal de ${MONTHLY_LIMIT} Situações de Aprendizagem.`);
      return;
    }

    if (!formData.tema || !formData.curso || !formData.competencia) {
      toast.error('Preencha os campos obrigatórios (Tema, Curso e Competência).');
      return;
    }

    setLoading(true);
    try {
      const prompt = `
        Crie uma Situação de Aprendizagem (SA) detalhada com os seguintes parâmetros:
        - Tema: ${formData.tema}
        - Curso: ${formData.curso}
        - Competência: ${formData.competencia}
        - Perfil da Turma: ${formData.perfilTurma}
        - Complexidade: ${formData.complexidade}
        - Duração Estimada: ${formData.duracao}

        Retorne um JSON estrito com a seguinte estrutura:
        {
          "title": "Título da SA",
          "context": "Contextualização do cenário",
          "centralChallenge": "O desafio ou problema a ser resolvido",
          "objective": "Objetivo de aprendizagem",
          "steps": [{"title": "Nome da etapa", "description": "O que fazer", "duration": "Tempo estimado"}],
          "resources": ["Recurso 1", "Recurso 2"],
          "deliverables": ["Entrega 1", "Entrega 2"],
          "evaluationCriteria": [{"criteria": "Critério 1", "points": 10}],
          "marketRelation": "Como isso se aplica no mercado de trabalho real"
        }
      `;

      const response = await generateContentWrapper({
        model: selectedModel || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          systemInstruction: getSystemInstruction('TEACHER', 'smart_content')
        }
      });

      const parsed = JSON.parse(response.text);
      setResult({
        ...parsed,
        course: formData.curso,
        competencia: formData.competencia,
        complexity: formData.complexidade,
        duration: formData.duracao,
        createdBy: userProfile.uid,
        createdAt: new Date().toISOString(),
        status: 'draft'
      });

      // Update usage count
      const date = new Date();
      const monthYear = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const limitDocRef = doc(db, 'teacher_monthly_limits', `${userProfile.uid}_${monthYear}`);
      
      await setDoc(limitDocRef, {
        userId: userProfile.uid,
        month: monthYear,
        count: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setUsageCount(prev => prev + 1);

      toast.success('Situação de Aprendizagem gerada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar Situação de Aprendizagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await addDoc(collection(db, 'learning_situations'), {
        ...result,
        createdAt: serverTimestamp()
      });
      toast.success('Situação de Aprendizagem salva no banco de dados!');
      setResult(null);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar SA.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <BrainCircuit size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Gerador de Situação de Aprendizagem</h2>
              <p className="text-sm text-gray-500">Crie cenários práticos alinhados ao mercado de trabalho</p>
            </div>
          </div>
          <div className={`px-4 py-3 rounded-xl border flex flex-col gap-2 min-w-[180px] ${usageCount >= MONTHLY_LIMIT ? 'bg-red-50 border-red-200 text-red-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold flex items-center gap-2">
                {usageCount >= MONTHLY_LIMIT && <AlertTriangle size={16} />}
                Uso Mensal
              </p>
              <span className="text-xs font-black">{usageCount} / {MONTHLY_LIMIT}</span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((usageCount / MONTHLY_LIMIT) * 100, 100)}%` }}
                className={`h-full rounded-full ${usageCount >= MONTHLY_LIMIT ? 'bg-red-500' : 'bg-indigo-600'}`}
              />
            </div>
            {usageCount >= MONTHLY_LIMIT && (
              <p className="text-[10px] font-medium leading-tight">Limite atingido. Novas gerações disponíveis no próximo mês.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tema *</label>
            <input
              type="text"
              value={formData.tema}
              onChange={e => setFormData({...formData, tema: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-lg"
              placeholder="Ex: Desenvolvimento de API REST"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
            <input
              type="text"
              value={formData.curso}
              onChange={e => setFormData({...formData, curso: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-lg"
              placeholder="Ex: Técnico em Informática"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Competência *</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={formData.competencia}
                onChange={e => setFormData({...formData, competencia: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="">Selecione uma competência...</option>
                {competencies.map(c => (
                  <option key={c.id} value={c.nome || c.name}>{c.nome || c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil da Turma</label>
            <input
              type="text"
              value={formData.perfilTurma}
              onChange={e => setFormData({...formData, perfilTurma: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-lg"
              placeholder="Ex: Alunos do 2º semestre, perfil prático"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complexidade</label>
            <select
              value={formData.complexidade}
              onChange={e => setFormData({...formData, complexidade: e.target.value as any})}
              className="w-full p-2 border border-gray-200 rounded-lg"
            >
              <option value="fácil">Fácil</option>
              <option value="médio">Médio</option>
              <option value="difícil">Difícil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duração Estimada</label>
            <input
              type="text"
              value={formData.duracao}
              onChange={e => setFormData({...formData, duracao: e.target.value})}
              className="w-full p-2 border border-gray-200 rounded-lg"
              placeholder="Ex: 4 aulas de 50 min"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || usageCount >= MONTHLY_LIMIT}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {usageCount >= MONTHLY_LIMIT ? 'Limite Mensal Atingido' : 'Gerar Situação de Aprendizagem'}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">{result.title}</h3>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors"
            >
              <Save size={18} />
              Salvar SA
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Contexto</h4>
              <p className="text-gray-600">{result.context}</p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Desafio Central</h4>
              <p className="text-gray-600">{result.centralChallenge}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-700 mb-2">Etapas</h4>
              <div className="space-y-3">
                {result.steps.map((step, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-indigo-600">Etapa {idx + 1}: {step.title}</span>
                      <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">{step.duration}</span>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Entregáveis</h4>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  {result.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Critérios de Avaliação</h4>
                <ul className="space-y-2">
                  {result.evaluationCriteria.map((c, i) => (
                    <li key={i} className="flex justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <span>{c.criteria}</span>
                      <span className="font-bold text-emerald-600">{c.points} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
