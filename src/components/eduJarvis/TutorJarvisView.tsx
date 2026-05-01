import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  Send, 
  Sparkles, 
  Zap, 
  BookOpen, 
  Trophy, 
  Search,
  MessageCircle,
  Clock,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt: any;
  type?: 'text' | 'concept' | 'exercise' | 'correction';
  data?: any;
}

export function TutorJarvisView() {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "tutor_chat_history"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => doc.data() as Message));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;
    
    const userMsg = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // 1. Gravar mensagem do usuário
      await addDoc(collection(db, "tutor_chat_history"), {
        userId: user.uid,
        role: 'user',
        content: userMsg,
        createdAt: serverTimestamp()
      });

      // 2. Chamar EduJarvis 2.0 via API
      const response = await fetch("/api/edu-jarvis/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userRole: userProfile?.role || "STUDENT",
          agent: "tutor",
          command: userMsg,
          costMode: "economico"
        })
      });

      const result = await response.json();
      
      // 3. Gravar resposta do Jarvis
      if (result.success) {
        await addDoc(collection(db, "tutor_chat_history"), {
          userId: user.uid,
          role: 'assistant',
          content: result.response,
          data: result.data,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Tutor Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 bg-indigo-600 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Tutor Jarvis 2.0</h2>
            <p className="text-xs text-indigo-100 font-medium">Apoio Pedagógico Socrático</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge icon={Clock} label="Tempo Estudado: 45m" />
          <Badge icon={Trophy} label="Dica do Dia" color="amber" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-12">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse">
              <Sparkles size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold dark:text-white">Olá, {userProfile?.displayName?.split(' ')[0]}!</h3>
              <p className="text-gray-500 max-w-md">
                Eu sou seu Tutor Jarvis. Como posso te ajudar a dominar as competências de hoje?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
              <QuickActionCard icon={HelpCircle} label="Dúvida Teórica" sub="Explique um conceito" onClick={() => setInput("Pode me explicar sobre...")} />
              <QuickActionCard icon={Lightbulb} label="Dica de Estudo" sub="Como aprender melhor?" onClick={() => setInput("Qual a melhor técnica para...")} />
              <QuickActionCard icon={BookOpen} label="Exercício Extra" sub="Praticar competência" onClick={() => setInput("Me ajude a praticar...")} />
              <QuickActionCard icon={Search} label="Análise de Erro" sub="Por que errei a questão?" onClick={() => setInput("Não entendi por que errei...")} />
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none"
              )}>
                {msg.content}
                
                {msg.data?.insightHistoryUsed && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg w-fit">
                    <Clock size={10} />
                    Lembrança: {msg.data.insightHistoryUsed}
                  </div>
                )}

                {msg.data?.difficultyDetected?.nivel !== 'nenhuma' && msg.data?.difficultyDetected?.nivel && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg w-fit">
                    <AlertCircle size={10} />
                    Alerta de Dificuldade: {msg.data.difficultyDetected.pontoChave || msg.data.difficultyDetected.habilidade}
                  </div>
                )}
                
                {msg.data?.perguntaGuia && (
                  <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <p className="font-bold text-indigo-700 dark:text-indigo-300 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      <ChevronRight size={14} /> Pense nisto:
                    </p>
                    <p className="text-indigo-900 dark:text-indigo-100 italic">"{msg.data.perguntaGuia}"</p>
                  </div>
                )}

                {msg.data?.suggestedExercise && (
                  <div className="mt-4 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
                        <Zap size={14} />
                      </div>
                      <p className="font-black text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-tighter">Micro-Desafio Proposto</p>
                    </div>
                    <p className="text-emerald-900 dark:text-emerald-100 font-medium mb-4">{msg.data.suggestedExercise.enunciado}</p>
                    
                    {msg.data.suggestedExercise.tipo === 'multipla' && msg.data.suggestedExercise.opcoes && (
                      <div className="grid gap-2">
                        {msg.data.suggestedExercise.opcoes.map((opt: string, idx: number) => (
                          <button 
                            key={idx}
                            onClick={() => setInput(`Minha resposta para o desafio é: ${opt}`)}
                            className="text-left px-4 py-2.5 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.data.suggestedExercise.tipo === 'aberta' && (
                      <button 
                        onClick={() => setInput("Minha resposta é: ")}
                        className="w-full text-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 dark:shadow-none"
                      >
                        Responder agora
                      </button>
                    )}
                  </div>
                )}

                {msg.data?.planoEstudo && (
                  <div className="mt-4 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-500 rounded-lg text-white">
                        <BookOpen size={14} />
                      </div>
                      <p className="font-black text-blue-800 dark:text-blue-300 text-xs uppercase tracking-tighter">Plano de Estudo Gerado</p>
                    </div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">{msg.data.planoEstudo.titulo}</h4>
                    {msg.data.planoEstudo.objetivo && (
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 mb-3 italic">Objetivo: {msg.data.planoEstudo.objetivo}</p>
                    )}
                    <ul className="space-y-2 mb-4">
                      {msg.data.planoEstudo.etapas.map((etapa: string, idx: number) => (
                        <li key={idx} className="flex gap-2 items-start text-xs text-blue-800 dark:text-blue-200">
                          <div className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</div>
                          {etapa}
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                      <div className="flex items-center gap-1.5">
                        <Clock size={10} className="text-blue-600" />
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">{msg.data.planoEstudo.tempoEstimadoTotal || 'Tempo não estimado'}</span>
                      </div>
                      <p className="text-[10px] italic text-blue-900 dark:text-blue-100">{msg.data.planoEstudo.recomendacao}</p>
                    </div>
                  </div>
                )}

                {msg.data?.recommendedDifficulty && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg w-fit">
                    <TrendingUp size={10} />
                    Status de Flow: Dificuldade {msg.data.recommendedDifficulty === 'easy' ? 'Tutorial' : msg.data.recommendedDifficulty === 'medium' ? 'Equilibrada' : 'Boss Fight'}
                  </div>
                )}

                {msg.data?.suggestedMissions && msg.data.suggestedMissions.length > 0 && (
                  <div className="mt-4 p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-amber-500 rounded-lg text-white">
                        <Trophy size={14} />
                      </div>
                      <p className="font-black text-amber-800 dark:text-amber-300 text-xs uppercase tracking-tighter">Missões Disponíveis</p>
                    </div>
                    <div className="space-y-3">
                      {msg.data.suggestedMissions.map((mission: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                                <h5 className="font-bold text-amber-900 dark:text-amber-100 text-xs">{mission.title}</h5>
                                {mission.reasoning && <p className="text-[9px] text-amber-600 italic leading-tight">{mission.reasoning}</p>}
                            </div>
                            <span className="text-[10px] font-black bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded shrink-0">+{mission.reward} XP</span>
                          </div>
                          <p className="text-[10px] text-amber-800 dark:text-amber-200 mt-1">{mission.description}</p>
                          <button 
                            onClick={() => setInput(`Aceito a missão: ${mission.title}`)}
                            className="mt-2 text-[10px] font-bold text-amber-600 hover:text-amber-800 uppercase tracking-widest flex items-center gap-1"
                          >
                            Aceitar Quest <ChevronRight size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.data?.badgesToUnlock && msg.data.badgesToUnlock.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {msg.data.badgesToUnlock.map((badge: any, idx: number) => (
                      <div key={idx} className="shrink-0 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white text-center w-28 shadow-lg">
                        <div className="text-2xl mb-1">{badge.icon || '🏅'}</div>
                        <p className="text-[10px] font-black uppercase leading-tight mb-1">{badge.name}</p>
                        <p className="text-[8px] opacity-80 leading-none">{badge.requirement}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex gap-4 mr-auto max-w-[85%]"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl rounded-tl-none border border-gray-100 dark:border-gray-700 flex gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <div className="relative flex items-center bg-gray-100 dark:bg-gray-900 p-2 rounded-2xl gap-2 focus-within:ring-2 ring-indigo-500/20 transition-all">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Pergunte qualquer coisa ao Jarvis..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-gray-800 dark:text-white"
          />
          <button 
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Zap size={12} /> Sugestões AI:
          </p>
          {['Simulado', 'Teoria', 'Dica'].map(s => (
             <button 
                key={s}
                onClick={() => setInput(`Me ajude com ${s.toLowerCase()}...`)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
             >
                #{s}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label, color = "indigo" }: any) {
  const colors: any = {
    indigo: "bg-indigo-500/30 text-white",
    amber: "bg-amber-500/30 text-amber-200"
  };
  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider", colors[color])}>
      <Icon size={12} />
      {label}
    </div>
  );
}

function QuickActionCard({ icon: Icon, label, sub, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-left hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
    >
      <Icon size={20} className="mb-2 text-indigo-500 group-hover:scale-110 transition-transform" />
      <p className="text-xs font-bold dark:text-white">{label}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </button>
  );
}
