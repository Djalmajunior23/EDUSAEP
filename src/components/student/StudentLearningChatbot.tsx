import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, limit } from 'firebase/firestore';
import Markdown from 'react-markdown';

interface ChatMessage {
  id?: string;
  studentId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: any;
}

export function StudentLearningChatbot({ userProfile }: { userProfile: any }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const q = query(
        collection(db, 'student_chat_messages'),
        where('studentId', '==', userProfile.uid),
        orderBy('timestamp', 'asc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const history = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      
      if (history.length === 0) {
        // Add initial greeting
        setMessages([{
          studentId: userProfile.uid,
          role: 'model',
          content: `Olá, ${userProfile.displayName?.split(' ')[0] || 'estudante'}! Sou seu Assistente Pedagógico. Como posso ajudar nos seus estudos hoje?`,
          timestamp: new Date()
        }]);
      } else {
        setMessages(history);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Erro ao carregar histórico da conversa.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setIsTyping(true);

    const newUserMsg: ChatMessage = {
      studentId: userProfile.uid,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);

    try {
      // Save user message to Firestore
      await addDoc(collection(db, 'student_chat_messages'), {
        ...newUserMsg,
        timestamp: serverTimestamp()
      });

      // Send to backend (n8n webhook)
      const response = await fetch('/api/n8n/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: userProfile.uid,
          message: userMessage,
          context: {
            userName: userProfile.displayName,
            course: userProfile.course || 'Geral'
          }
        })
      });

      const data = await response.json();
      const replyContent = data.reply || data.output || "Desculpe, não consegui processar a resposta no momento.";

      const newModelMsg: ChatMessage = {
        studentId: userProfile.uid,
        role: 'model',
        content: replyContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newModelMsg]);

      // Save model response to Firestore
      await addDoc(collection(db, 'student_chat_messages'), {
        ...newModelMsg,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Erro ao conectar com o assistente.');
      setMessages(prev => [...prev, {
        studentId: userProfile.uid,
        role: 'model',
        content: "⚠️ Ocorreu um erro de conexão. Por favor, tente novamente mais tarde.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestPrompt = (prompt: string) => {
    setInput(prompt);
  };

  if (loadingHistory) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-indigo-50/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Assistente Pedagógico</h2>
          <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
            <Sparkles size={12} /> IA Integrada (n8n)
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx}
            className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-indigo">
                  <Markdown>{msg.content}</Markdown>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200 rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              <span className="text-sm text-gray-500">Assistente digitando...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="p-4 bg-white border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Sugestões</p>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            <button onClick={() => suggestPrompt("Pode me explicar o que é React de forma simples?")} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-full text-sm border border-gray-200 transition-colors flex items-center gap-1">
              <Lightbulb size={14} /> Explicar conceito
            </button>
            <button onClick={() => suggestPrompt("Gere 3 exercícios de fixação sobre lógica de programação.")} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-full text-sm border border-gray-200 transition-colors flex items-center gap-1">
              <BookOpen size={14} /> Exercícios práticos
            </button>
            <button onClick={() => suggestPrompt("Como posso melhorar minha rotina de estudos?")} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-full text-sm border border-gray-200 transition-colors flex items-center gap-1">
              <Sparkles size={14} /> Dicas de estudo
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua dúvida aqui..."
          disabled={isTyping}
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
