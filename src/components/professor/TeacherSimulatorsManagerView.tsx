import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Beaker, Plus, Play, Info, Edit2, Target, Globe, Lightbulb, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { aiCopilotService } from '../../services/aiCopilotService';
import { simulatorService } from '../../services/simulatorService';
import { Simulator } from '../../types';


export const TeacherSimulatorsManagerView: React.FC = () => {
  const [labs, setLabs] = useState([
    { id: '1', title: 'Atendimento de Emergência: Trauma', area: 'Saúde', type: 'Decisão Clínica', status: 'Ativo', completions: 24 },
    { id: '2', title: 'Troubleshooting de Redes OSPF', area: 'TI', type: 'Simulação Técnica', status: 'Rascunho', completions: 0 },
    { id: '3', title: 'Gestão de Crise Corporativa', area: 'Administração', type: 'Roleplay Interativo', status: 'Ativo', completions: 12 },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [scenario, setScenario] = useState('');
  const [difficulty, setDifficulty] = useState<number>(2);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Beaker className="text-indigo-600" /> Simuladores e Labs Práticos
          </h1>
          <p className="text-gray-500 mt-1">Crie experiências interativas para engajamento dos alunos</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
        >
          <Plus size={18} /> Novo Laboratório
        </button>
      </div>

      {!isCreating ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map(lab => (
            <motion.div 
              key={lab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg border ${
                  lab.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {lab.status}
                </span>
                <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{lab.area}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">{lab.title}</h3>
              <p className="text-sm text-gray-500 mb-6 flex-1 flex items-start gap-1">
                <Globe size={14} className="mt-0.5 shrink-0" /> Formato: {lab.type}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <Target size={16} /> <span>{lab.completions} acessos</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                    <Play size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 flex justify-between items-center text-white">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lightbulb className="text-amber-400" /> IA Generator: Laboratório Interativo
              </h2>
              <p className="text-indigo-200 text-sm mt-1">Descreva o cenário e a IA montará uma árvore de decisões e consequências.</p>
            </div>
            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Título do Laboratório</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Troubleshooting de Redes BGP" 
                    className="w-full border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Prompt do Cenário (Instruções para a IA)</label>
                  <textarea 
                    rows={6}
                    value={scenario}
                    onChange={e => setScenario(e.target.value)}
                    placeholder="Descreva a situação problema. Ex: O aluno é um técnico em um provedor de internet e a conexão de um bairro inteiro caiu. Ele precisa dar comandos, investigar os roteadores e tomar a decisão correta." 
                    className="w-full border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nível de Dificuldade</label>
                    <select 
                      value={difficulty}
                      onChange={e => setDifficulty(parseInt(e.target.value))}
                      className="w-full border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={1}>Básico</option>
                      <option value={2}>Intermediário</option>
                      <option value={3}>Avançado</option>
                      <option value={5}>Especialista (Com pegadinhas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Formato de Resposta</label>
                    <select className="w-full border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500">
                      <option>Múltipla Escolha Adaptativa</option>
                      <option>Prompt Livre (O aluno digita ações)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-fit space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Info size={18} className="text-indigo-600"/> Copiloto de Labs</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  O motor irá gerar um <b>ambiente simulado</b> em etapas. Cada decisão do aluno afeta o próximo passo (Branching Logic).
                </p>
                <div className="p-3 bg-white border border-indigo-100 rounded-xl">
                  <p className="text-xs font-semibold text-indigo-700 mb-1">Dica de Sucesso</p>
                  <p className="text-xs text-gray-500">Quanto mais específico for o cenário, mais realistas as consequências nas escolhas.</p>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      // Parsing the AI response properly
                      const aiRawResponse = await aiCopilotService.generateSimulatorScenario(title);
                      let aiStages: any = {};
                      try {
                        // Assuming aiStages currently returns a string, we need to parse it
                        // Check if the service returns a parsed object or string
                        aiStages = typeof aiRawResponse === 'string' ? JSON.parse(aiRawResponse) : aiRawResponse;
                        // Handle cases where aiCopilotService might return an object wrapping the response
                        if (aiStages.text) {
                            try {
                                aiStages = JSON.parse(aiStages.text);
                            } catch (e) {
                                // Maybe not JSON, fallback
                            }
                        }
                      } catch (e) {
                        console.error("Failed to parse AI response:", e);
                        aiStages = {};
                      }
                      
                      const newSimulator: Omit<Simulator, 'id' | 'createdAt'> = {
                        title: title || aiStages.title || 'Novo Simulador',
                        description: scenario || aiStages.description || 'Simulador gerado com IA',
                        type: 'professional',
                        scenario: scenario || aiStages.description || '',
                        stages: aiStages.stages && Array.isArray(aiStages.stages) && aiStages.stages.length > 0 ? aiStages.stages : [{
                          title: aiStages.title || 'Etapa 1',
                          description: aiStages.description || 'Início da simulação',
                          challenge: 'Identificar o problema inicial',
                          feedback: aiStages.feedback?.success || 'Etapa concluída',
                        }],
                        difficulty: difficulty as any,
                        xpReward: 100,
                      };
                      
                      await simulatorService.createSimulator(newSimulator);
                      toast.success("Laboratório gerado com sucesso!");
                      setIsCreating(false);
                      // In a real app, we should refresh the list.
                    } catch (error) {
                      toast.error("Erro ao gerar laboratório: " + (error instanceof Error ? error.message : 'Erro desconhecido'));
                    }
                  }}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} /> Gerar Laboratório com IA
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
};
