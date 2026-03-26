import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Loader2, X, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  id?: string;
  text: string;
  role: 'user' | 'model';
  createdAt: any;
}

interface SocraticTutorProps {
  questionId?: string;
  questionText?: string;
  onClose?: () => void;
}

export function SocraticTutor({ questionId = 'general', questionText = 'Dúvida Geral', onClose }: SocraticTutorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Create or find a session for this question
    const sessionsRef = collection(db, 'socratic_sessions');
    const q = query(
      sessionsRef,
      where('aluno_id', '==', auth.currentUser.uid),
      where('question_id', '==', questionId),
      where('status', '==', 'ativa'),
      orderBy('data_inicio', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const sessionDoc = snapshot.docs[0];
        setSessionId(sessionDoc.id);
        setMessages(sessionDoc.data().history || []);
      } else {
        // Start a new session
        startNewSession();
      }
    }, (error) => {
      console.error("Error fetching Socratic session:", error);
    });

    return () => unsubscribe();
  }, [questionId]);

  const startNewSession = async () => {
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    try {
      const initialPrompt = `Você é um Tutor Socrático especializado no modelo SAEP/SENAI. 
      O aluno está com dúvida na seguinte questão: "${questionText}".
      
      REGRAS:
      1. NUNCA dê a resposta diretamente.
      2. Faça perguntas que guiem o aluno a descobrir a lógica por trás da questão.
      3. Use uma linguagem encorajadora e técnica (padrão SENAI).
      4. Se o aluno errar o raciocínio, peça para ele explicar por que pensou daquela forma.
      
      Inicie a conversa cumprimentando o aluno e fazendo uma pergunta inicial sobre o que ele entendeu da questão ou qual parte está sendo mais difícil.`;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: initialPrompt }] }]
      });
      const initialMessage = response.text;

      const newSession = {
        aluno_id: auth.currentUser.uid,
        question_id: questionId,
        status: 'ativa',
        data_inicio: serverTimestamp(),
        history: [
          {
            text: initialMessage,
            role: 'model',
            createdAt: new Date().toISOString()
          }
        ]
      };

      const docRef = await addDoc(collection(db, 'socratic_sessions'), newSession);
      setSessionId(docRef.id);
    } catch (error) {
      console.error("Error starting Socratic session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || !sessionId) return;

    const userMessage: Message = {
      text: inputText,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const chatHistory = updatedMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: chatHistory,
        config: {
          maxOutputTokens: 500,
        }
      });
      
      const botResponse = response.text;

      const botMessage: Message = {
        text: botResponse,
        role: 'model',
        createdAt: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, botMessage];
      
      // Update session in Firestore
      const sessionRef = doc(db, 'socratic_sessions', sessionId);
      await updateDoc(sessionRef, {
        history: finalMessages
      });

    } catch (error) {
      console.error("Error sending message to Socratic Tutor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isModal = !!onClose;

  const content = (
    <div className={cn(
      "bg-white dark:bg-gray-900 w-full rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-emerald-100 dark:border-emerald-900/30",
      isModal ? "max-w-2xl h-[80vh]" : "h-full min-h-[600px]"
    )}>
      {/* Header */}
      <div className="p-6 bg-emerald-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Tutor Socrático IA</h3>
            <p className="text-xs text-emerald-100">Aprendizado guiado por perguntas</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Question Context */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/20">
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Questão em análise:</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 italic">"{questionText}"</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-950">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex w-full",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl shadow-sm",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-tr-none" 
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none"
            )}>
              <div className="markdown-body text-sm leading-relaxed">
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <Loader2 className="animate-spin text-emerald-600" size={16} />
              <span className="text-xs text-gray-500">Tutor pensando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite sua dúvida ou resposta..."
            className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-3">
          O Tutor Socrático ajuda você a pensar, ele não dará a resposta pronta.
        </p>
      </form>
    </div>
  );

  if (isModal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
