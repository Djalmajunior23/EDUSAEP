import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, Send, User, Sparkles, AlertTriangle, 
  CheckCircle, Clock, BookOpen, AlertCircle, Plus, FileText, Briefcase
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import { TeacherCopilotService } from '../../pedagogical-engine/services/TeacherCopilotService';
import { UserProfile } from '../../types';

interface CopilotMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
}

export function TeacherCopilotDashboard({ userProfile, selectedModel }: { userProfile: UserProfile | null, selectedModel: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init',
      role: 'model',
      content: 'Olá! Sou seu **Copiloto Pedagógico**. Estou conectado aos dados da sua turma e ao Motor de Risco. Como posso facilitar seu dia hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [priorities, setPriorities] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile?.uid) {
      TeacherCopilotService.generateDailyPriorities(userProfile.uid, selectedModel).then(setPriorities);
    }
  }, [userProfile?.uid, selectedModel]);

  // Hook to handle incoming generation requests from the Command Center
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const competency = params.get('competency');

    if (mode === 'generate-activity' && competency) {
      const autoPrompt = `Por favor, crie um "Estudo de Caso Prático (PBL)" para a competência de "${competency}". A turma está apresentando defasagem.`;
      
      // Clean URL silently
      window.history.replaceState({}, document.title, location.pathname);
      
      const runActivityGeneration = async () => {
        if (isTyping) return;
        
        const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, content: autoPrompt }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
          const response = await TeacherCopilotService.generateAndSavePBLActivity(
            userProfile?.uid || 'anon', 
            competency,
            selectedModel
          );

          setMessages([...newMessages, { id: Date.now().toString(), role: 'model', content: response.text }]);
        } catch (err) {
          console.error(err);
          setMessages([...newMessages, { id: Date.now().toString(), role: 'model', content: 'Infelizmente encontrei um erro ao processar a geração da atividade.' }]);
        } finally {
          setIsTyping(false);
        }
      };

      runActivityGeneration();
    }
  }, [location.search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAutoSend = async (autoMsg: string) => {
    if (isTyping) return;
    
    const newMessages = [...messages, { id: Date.now().toString(), role: 'user' as const, content: autoMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await TeacherCopilotService.processMessage(
        userProfile?.uid || 'anon', 
        autoMsg, 
        messages.filter(m => m.id !== 'init').map(m => ({ role: m.role, content: m.content })),
        selectedModel
      );

      setMessages([...newMessages, { id: Date.now().toString(), role: 'model', content: response }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { id: Date.now().toString(), role: 'model', content: 'Infelizmente encontrei um erro ao processar sua solicitação.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    await handleAutoSend(userMsg);
  };

  const handleQuickAction = (text: string) => {
    setInput(text);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="text-indigo-600" size={32} />
            Copiloto Pedagógico <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-black uppercase tracking-wider">BETA</span>
          </h1>
          <p className="text-gray-500">Inteligência contextualizada unida ao motor acadêmico EduSAEP.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Painel Esquerdo: Organização e Prioridades */}
        <div className="lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* O que fazer agora */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-gray-900">
              <AlertCircle className="text-amber-500" size={20} />
              Prioridades do Dia
            </h3>
            
            {priorities.length === 0 ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-gray-100 rounded-xl"></div>
                <div className="h-16 bg-gray-100 rounded-xl"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {priorities.map((p, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded ${
                        p.type === 'urgente' ? 'bg-red-100 text-red-600' : 
                        p.type === 'correcao' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {p.type}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                    <button 
                      onClick={() => handleQuickAction(`Me ajude a resolver essa prioridade: ${p.title}`)}
                      className="mt-3 text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:underline"
                    >
                      Copiloto, ajude-me &rarr;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Autoria Pedagógica Rápida */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-3xl text-white space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles size={20} className="text-purple-400" />
              Autoria Pedagógica
            </h3>
            <p className="text-xs text-indigo-100">Use os geradores especialistas para criação densa de materiais estruturados.</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/teacher-ai-assistant')} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex flex-col gap-2 items-start transition-colors">
                <FileText size={18} />
                <span className="text-xs font-bold">Listas & Provas</span>
              </button>
              <button onClick={() => navigate('/learning-situation')} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex flex-col gap-2 items-start transition-colors">
                <Briefcase size={18} />
                <span className="text-xs font-bold">Gerar S.A.</span>
              </button>
            </div>
            
            <button onClick={() => navigate('/my-learning-situations')} className="w-full mt-2 bg-indigo-500/30 hover:bg-indigo-500/50 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-indigo-400/30">
               <BookOpen size={16} />
               <span className="text-xs font-bold">Minhas Situações Geradas (SAs)</span>
            </button>
          </div>

        </div>

        {/* Painel Direito: Chat do Copiloto */}
        <div className="lg:w-2/3 flex flex-col bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden min-h-0">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Assistente Contextual</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Memória Ativa • {selectedModel}</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 custom-scrollbar">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`p-2 shrink-0 rounded-xl h-10 w-10 flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-gray-900 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-100 shadow-sm rounded-tl-none text-gray-800'
                }`}>
                  <div className={`prose ${msg.role === 'user' ? 'prose-invert prose-p:text-gray-200' : 'prose-indigo prose-p:text-gray-600'} text-sm max-w-none prose-pre:bg-gray-100 prose-pre:text-gray-800`}>
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[85%] mr-auto">
                <div className="p-2 shrink-0 rounded-xl h-10 w-10 flex items-center justify-center bg-indigo-100 text-indigo-600">
                  <Bot size={18} />
                </div>
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length < 3 && (
            <div className="px-6 pb-2 flex gap-2 overflow-x-auto custom-scrollbar">
              {[
                "Resuma o desempenho da turma.",
                "Quais alunos precisam de intervenção hoje?",
                "Sugira uma aula de revisão para Programação We.",
              ].map(qp => (
                <button 
                  key={qp}
                  onClick={() => handleQuickAction(qp)}
                  className="whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-full transition-colors"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-50">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Pergunte ao copiloto, peça uma análise, planejamento..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-5 pr-14 py-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-14 min-h-[56px]"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-center mt-2 text-[10px] font-medium text-gray-400">
              O Copiloto lê seus dados do Motor Pedagógico para dar respostas contextualizadas.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
