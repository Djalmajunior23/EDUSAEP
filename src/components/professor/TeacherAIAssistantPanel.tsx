import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, FileText, Code, Briefcase, BrainCircuit, Loader2, CheckCircle2, ListChecks, BookOpen, Target } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import Markdown from 'react-markdown';
import { generateContentWrapper, getSystemInstruction } from '../../services/geminiService';

export function TeacherAIAssistantPanel({ userProfile, selectedModel }: { userProfile: any, selectedModel: string }) {
  const [activeTab, setActiveTab] = useState<'discursive' | 'case_study' | 'code' | 'practical' | 'lesson_plan' | 'exercise_list'>('case_study');
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [educationLevel, setEducationLevel] = useState('Ensino Técnico');
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetencies();
  }, []);

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

  const tabs = [
    { id: 'discursive', label: 'Questão Discursiva', icon: FileText, desc: 'Perguntas abertas com rubrica' },
    { id: 'case_study', label: 'Estudo de Caso', icon: Briefcase, desc: 'Cenários reais de mercado' },
    { id: 'code', label: 'Desafio de Código', icon: Code, desc: 'Problemas de programação' },
    { id: 'practical', label: 'Desafio Prático', icon: BrainCircuit, desc: 'Projetos e mãos na massa' },
    { id: 'lesson_plan', label: 'Plano de Aula', icon: BookOpen, desc: 'Roteiro completo de aula' },
    { id: 'exercise_list', label: 'Lista de Exercícios', icon: ListChecks, desc: 'Conjunto de questões variadas' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Preencha o tema principal.');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const selectedTabText = tabs.find(t => t.id === activeTab)?.label;
      
      const systemInstruction = getSystemInstruction('professor', 'smart_content');
      
      let aiPrompt = `
        Atue como um professor especialista em ${educationLevel}.
        Crie um(a) ${selectedTabText} de nível ${difficulty.toUpperCase()} sobre o tema: "${prompt}".
        ${selectedCompetency ? `Alinhado com a competência: "${selectedCompetency}".` : ''}
        
        Contexto adicional e restrições: "${context || 'Nenhuma restrição adicional.'}"
      `;

      if (activeTab === 'lesson_plan') {
        aiPrompt += `
          O plano de aula deve conter obrigatoriamente:
          1. Objetivo Geral;
          2. Objetivos Específicos (pelo menos 3);
          3. Metodologia (detalhada passo a passo);
          4. Recursos Necessários;
          5. Atividade Prática Sugerida;
          6. Forma de Avaliação;
          7. Fechamento da Aula.
        `;
      } else if (activeTab === 'exercise_list') {
        aiPrompt += `
          A lista de exercícios deve conter:
          1. 5 questões variadas (múltipla escolha e discursivas);
          2. Classificação por Competência para cada questão;
          3. Gabarito Comentado ao final.
        `;
      } else {
        aiPrompt += `
          Instruções de Formatação:
          1. Use Markdown para uma estrutura clara.
          2. Inclua Título, Objetivos de Aprendizagem, Enunciado Detalhado.
          3. Se for uma questão ou desafio, inclua Critérios de Avaliação (Rubrica) e uma Resposta Esperada/Gabarito Comentado.
          4. Garanta que o conteúdo seja desafiador e adequado ao nível ${difficulty} para ${educationLevel}.
        `;
      }

      const response = await generateContentWrapper({
        model: selectedModel || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      setGeneratedContent(response.text);
      toast.success('Conteúdo gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar conteúdo. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) return;

    try {
      await addDoc(collection(db, 'teacher_generated_contents'), {
        type: activeTab,
        prompt,
        context,
        difficulty,
        educationLevel,
        content: generatedContent,
        createdBy: userProfile.uid,
        createdAt: serverTimestamp()
      });
      toast.success('Conteúdo salvo no seu histórico!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar conteúdo.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-indigo-600" /> IA Avançada para Professores
          </h2>
          <p className="text-gray-500">Crie materiais didáticos complexos, estudos de caso e desafios práticos em segundos.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium">
          <BrainCircuit size={18} />
          {selectedModel}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Tipo de Conteúdo</h3>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                    isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-gray-50 border border-transparent text-gray-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{tab.label}</h3>
                    <p className={`text-xs ${isActive ? 'text-indigo-100' : 'text-gray-500'}`}>{tab.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Competência Alvo (Opcional)</label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedCompetency}
                  onChange={(e) => setSelectedCompetency(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="">Selecione uma competência...</option>
                  {competencies.map(c => (
                    <option key={c.id} value={c.nome || c.name}>{c.nome || c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tema Principal</label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Arquitetura de Microsserviços"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Dificuldade</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nível de Ensino</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Ensino Médio">Ensino Médio</option>
                  <option value="Ensino Técnico">Ensino Técnico</option>
                  <option value="Ensino Superior">Ensino Superior</option>
                  <option value="Pós-Graduação">Pós-Graduação</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contexto / Restrições (Opcional)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ex: Focar em e-commerce, usar Node.js e mensageria com RabbitMQ."
                className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {isGenerating ? 'Gerando...' : 'Gerar Conteúdo'}
            </button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
                  <Loader2 size={64} className="animate-spin text-indigo-600 relative z-10" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold text-gray-900">A IA está elaborando o material...</p>
                  <p className="text-sm text-gray-500">Isso pode levar alguns segundos dependendo da complexidade.</p>
                </div>
              </div>
            ) : generatedContent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Conteúdo Gerado</h3>
                      <p className="text-xs text-gray-500">Pronto para uso ou edição</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2"
                  >
                    Salvar no Histórico
                  </button>
                </div>
                <div className="prose prose-indigo max-w-none flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  <Markdown>{generatedContent}</Markdown>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-6">
                <div className="p-6 bg-gray-50 rounded-full">
                  <BrainCircuit size={80} className="text-gray-200" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold text-gray-500">Nenhum conteúdo gerado ainda.</p>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    Selecione o tipo de atividade ao lado, defina o tema e o nível de dificuldade para que a IA crie um material didático personalizado.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
