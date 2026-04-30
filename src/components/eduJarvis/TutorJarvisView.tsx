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
  AlertCircle
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
                
                {msg.data?.perguntaGuia && (
                  <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <p className="font-bold text-indigo-700 dark:text-indigo-300 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      <ChevronRight size={14} /> Pense nisto:
                    </p>
                    <p className="text-indigo-900 dark:text-indigo-100 italic">"{msg.data.perguntaGuia}"</p>
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
