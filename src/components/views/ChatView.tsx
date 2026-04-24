import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Loader2,
  X
} from 'lucide-react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { DiagnosticResult } from '../../services/geminiService';
import { cn } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../services/errorService';
import { getChatResponse, ChatMessage as GeminiChatMessage } from '../../services/chatService';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatViewProps {
  user: User | null;
  diagnostic: DiagnosticResult | null;
}

export function ChatView({ user, diagnostic }: ChatViewProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!user) return;

    const path = 'chat_messages';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputText.trim() || isTyping) return;

    const userText = inputText.trim();
    setInputText('');
    setIsTyping(true);

    const path = 'chat_messages';
    try {
      // 1. Save user message
      await addDoc(collection(db, path), {
        userId: user.uid,
        text: userText,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      // 2. Get Gemini response
      const geminiHistory: GeminiChatMessage[] = messages.map(m => ({
        role: m.role,
        text: m.text
      }));
      geminiHistory.push({ role: 'user', text: userText });

      const aiResponse = await getChatResponse(geminiHistory, { diagnostic });

      // 3. Save AI response
      await addDoc(collection(db, path), {
        userId: user.uid,
        text: aiResponse,
        role: 'model',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (!user || messages.length === 0) return;
    const path = 'chat_messages';
    try {
      for (const msg of messages) {
        await deleteDoc(doc(db, path, msg.id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Assistente Pedagógico</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">IA Especialista</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
        >
          Limpar Chat
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FDFDFD] dark:bg-gray-900"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
              <MessageSquare size={32} />
            </div>
            <div className="max-w-xs">
              <p className="font-bold text-gray-900 dark:text-white">Olá! Como posso ajudar hoje?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pergunte sobre o diagnóstico, plano de estudos ou dicas pedagógicas.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={cn(
              "flex w-full flex-col",
              msg.role === 'user' ? "items-end" : "items-start"
            )}
          >
            <div className={cn(
              "max-w-[85%] px-4 py-3 text-sm shadow-sm transition-all hover:shadow-md overflow-x-auto",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-2xl rounded-tr-none" 
                : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-none"
            )}>
              <div className="markdown-body overflow-x-auto">
                <Markdown
                  components={{
                    code({node, inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          {...props}
                          children={String(children).replace(/\n$/, '')}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md my-2 text-xs"
                        />
                      ) : (
                        <code {...props} className={cn(className, "bg-black/5 dark:bg-white/10 rounded px-1 py-0.5")}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {msg.text}
                </Markdown>
              </div>
              <div className={cn(
                "flex items-center gap-1 mt-1 opacity-60 text-[9px]",
                msg.role === 'user' ? "justify-end text-emerald-100" : "justify-start text-gray-400"
              )}>
                {msg.role === 'model' && <div className="w-1 h-1 bg-emerald-400 rounded-full" />}
                {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-3">
              <div className="flex gap-1">
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                  className="w-1.5 h-1.5 bg-emerald-400 rounded-full" 
                />
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-emerald-500 rounded-full" 
                />
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-emerald-600 rounded-full" 
                />
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Assistente está redigindo...</span>
            </div>
          </div>
        )}
      </div>

      <form 
        onSubmit={sendMessage}
        className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Digite sua pergunta aqui..."
          className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
        >
          <Send size={20} />
        </button>
      </form>
    </motion.div>
  );
}
