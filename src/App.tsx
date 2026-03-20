import React, { useState, useMemo, useEffect, Component, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Markdown from 'react-markdown';
import { 
  Upload, 
  FileText, 
  BarChart3, 
  BookOpen, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Download,
  Copy,
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  LogIn,
  History,
  Trash2,
  CheckSquare,
  Plus,
  Pencil,
  MessageSquare,
  Send,
  Loader2,
  User as UserIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { generateDiagnostic, DiagnosticResult } from './services/geminiService';
import { getChatResponse, ChatMessage as GeminiChatMessage } from './services/chatService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  HashRouter, 
  Routes, 
  Route, 
  useNavigate, 
  useLocation,
  Navigate
} from 'react-router-dom';
import { auth, db, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc,
  getDocFromServer,
  updateDoc,
  setDoc
} from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Firestore Error Handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
  settings?: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  preferences?: {
    defaultGrade: string;
    language: string;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = `Erro no Firestore: ${parsed.error}`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center space-y-4">
            <AlertCircle className="mx-auto text-red-500" size={48} />
            <h2 className="text-xl font-bold text-gray-900">Algo deu errado</h2>
            <p className="text-sm text-gray-600">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

function HistoryView({ history, deleteDiagnostic, setResult, navigate, setCurrentDiagnosticId }: { history: any[], deleteDiagnostic: (id: string) => void, setResult: (res: any) => void, navigate: any, setCurrentDiagnosticId: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Diagnósticos</h2>
          <p className="text-gray-500">Acesse diagnósticos gerados anteriormente.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl border border-gray-200 text-center space-y-4">
          <History className="mx-auto text-gray-300" size={48} />
          <p className="text-gray-500">Nenhum diagnóstico encontrado no seu histórico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <FileText size={20} />
                </div>
                <button 
                  onClick={() => deleteDiagnostic(item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 truncate">{item.aluno}</h3>
              <p className="text-xs text-gray-400 mb-4">
                {new Date(item.createdAt).toLocaleDateString()} às {new Date(item.createdAt).toLocaleTimeString()}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600">
                    {(item.result.summary.acuracia_geral * 100).toFixed(0)}%
                  </span>
                  <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${item.result.summary.acuracia_geral * 100}%` }} />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setResult(item.result);
                    setCurrentDiagnosticId(item.id);
                    navigate('/dashboard');
                  }}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TasksView({ user }: { user: User | null }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('tasks_draft_title');
    if (draft) {
      setNewTaskTitle(draft);
    }
  }, []);

  // Save draft to localStorage whenever newTaskTitle changes
  useEffect(() => {
    if (newTaskTitle) {
      localStorage.setItem('tasks_draft_title', newTaskTitle);
    } else {
      localStorage.removeItem('tasks_draft_title');
    }
  }, [newTaskTitle]);

  useEffect(() => {
    if (!user) return;

    const path = 'tasks';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;

    const path = 'tasks';
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        title: newTaskTitle.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setNewTaskTitle('');
      localStorage.removeItem('tasks_draft_title');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const toggleTask = async (task: any) => {
    const path = `tasks/${task.id}`;
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: !task.completed,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    const path = `tasks/${id}`;
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const startEditing = (task: any) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const saveEdit = async (id: string) => {
    if (!editingTaskTitle.trim()) return;
    const path = `tasks/${id}`;
    try {
      await updateDoc(doc(db, 'tasks', id), {
        title: editingTaskTitle.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingTaskId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Lista de Tarefas</h2>
        <p className="text-gray-500">Gerencie suas atividades pedagógicas e metas.</p>
      </div>

      <form onSubmit={addTask} className="flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Adicionar nova tarefa..."
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={!newTaskTitle.trim()}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </form>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-4">
            <CheckSquare className="mx-auto text-gray-200" size={48} />
            <p className="text-gray-500 italic">Sua lista está vazia. Comece adicionando uma tarefa acima!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div
              layout
              key={task.id}
              className={cn(
                "bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 group transition-all",
                task.completed && "bg-gray-50/50 opacity-75"
              )}
            >
              <button
                onClick={() => toggleTask(task)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  task.completed 
                    ? "bg-emerald-500 border-emerald-500 text-white" 
                    : "border-gray-300 hover:border-emerald-500"
                )}
              >
                {task.completed && <CheckCircle2 size={14} />}
              </button>

              {editingTaskId === task.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editingTaskTitle}
                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                    className="flex-1 px-2 py-1 border-b-2 border-emerald-500 outline-none bg-transparent font-medium"
                  />
                  <button 
                    onClick={() => saveEdit(task.id)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Salvar
                  </button>
                  <button 
                    onClick={() => setEditingTaskId(null)}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-gray-900 truncate",
                    task.completed && "line-through text-gray-400"
                  )}>
                    {task.title}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Criado em {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEditing(task)}
                  className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function ChatView({ user, diagnostic }: { user: User | null, diagnostic: DiagnosticResult | null }) {
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
      console.error("Chat Error", err);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (!user || messages.length === 0) return;
    const path = 'chat_messages';
    try {
      // Delete all messages for this user
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
      className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
    >
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Assistente Pedagógico</h3>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">IA Especialista</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
        >
          Limpar Chat
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FDFDFD]"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <MessageSquare size={32} />
            </div>
            <div className="max-w-xs">
              <p className="font-bold text-gray-900">Olá! Como posso ajudar hoje?</p>
              <p className="text-sm text-gray-500">Pergunte sobre o diagnóstico, plano de estudos ou dicas pedagógicas.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={cn(
              "flex w-full",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-tr-none" 
                : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
            )}>
              <div className="markdown-body">
                <Markdown>{msg.text}</Markdown>
              </div>
              <p className={cn(
                "text-[9px] mt-1 opacity-50",
                msg.role === 'user' ? "text-emerald-100" : "text-gray-400"
              )}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 className="animate-spin text-emerald-500" size={16} />
              <span className="text-xs text-gray-400 font-medium">Gemini está pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={sendMessage}
        className="p-4 bg-white border-t border-gray-100 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Digite sua pergunta aqui..."
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
        >
          <Send size={20} />
        </button>
      </form>
    </motion.div>
  );
}

function ProfileView({ user, profile }: { user: User | null, profile: UserProfile | null }) {
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState(profile?.settings?.theme || 'light');
  const [notifications, setNotifications] = useState(profile?.settings?.notifications ?? true);
  const [defaultGrade, setDefaultGrade] = useState(profile?.preferences?.defaultGrade || '');
  const [language, setLanguage] = useState(profile?.preferences?.language || 'Português');

  useEffect(() => {
    if (profile) {
      setTheme(profile.settings?.theme || 'light');
      setNotifications(profile.settings?.notifications ?? true);
      setDefaultGrade(profile.preferences?.defaultGrade || '');
      setLanguage(profile.preferences?.language || 'Português');
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        settings: { theme, notifications },
        preferences: { defaultGrade, language },
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Perfil do Usuário</h2>
        <p className="text-gray-500">Gerencie suas configurações de conta e preferências pedagógicas.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
        {/* Account Info */}
        <div className="flex items-center gap-6 pb-8 border-b border-gray-100">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-2xl border border-gray-200 shadow-sm" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl shadow-sm">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user?.displayName}</h3>
            <p className="text-gray-500">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                user?.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {user?.emailVerified ? 'E-mail Verificado' : 'E-mail não verificado'}
              </span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tema da Interface</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Idioma Preferido</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              >
                <option value="Português">Português</option>
                <option value="English">English</option>
                <option value="Español">Español</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Série/Ano Padrão</label>
            <input 
              type="text"
              value={defaultGrade}
              onChange={(e) => setDefaultGrade(e.target.value)}
              placeholder="Ex: 9º Ano Ensino Fundamental"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-gray-900">Notificações por E-mail</p>
              <p className="text-xs text-gray-500">Receba alertas sobre novos diagnósticos e tarefas.</p>
            </div>
            <button 
              onClick={() => setNotifications(!notifications)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                notifications ? "bg-emerald-500" : "bg-gray-300"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                notifications ? "left-7" : "left-1"
              )} />
            </button>
          </div>
        </div>

        <button 
          onClick={saveProfile}
          disabled={isSaving}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Settings size={20} />}
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </motion.div>
  );
}

function AlunoView({ result, onUpdateResult, diagnosticId }: { result: DiagnosticResult | null, onUpdateResult: (newResult: DiagnosticResult) => void, diagnosticId: string | null }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'Todos' | 'Forte' | 'Atenção' | 'Crítico'>('Todos');
  const [editingComp, setEditingComp] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredCompetencias = useMemo(() => {
    if (!result) return [];
    if (filter === 'Todos') return result.diagnostico_por_competencia;
    return result.diagnostico_por_competencia.filter(c => c.nivel === filter);
  }, [result, filter]);

  const handleSaveEdit = async (competenciaName: string) => {
    if (!result) return;
    const newCompetencias = [...result.diagnostico_por_competencia];
    const idx = newCompetencias.findIndex(c => c.competencia === competenciaName);
    if (idx !== -1) {
      const updatedResult = { ...result, diagnostico_por_competencia: newCompetencias };
      onUpdateResult(updatedResult);
      
      // Update in Firestore if ID exists
      if (diagnosticId) {
        const path = `diagnostics/${diagnosticId}`;
        try {
          await updateDoc(doc(db, 'diagnostics', diagnosticId), {
            result: updatedResult
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
    }
    setEditingComp(null);
  };

  if (!result) return (
    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
      <p className="text-gray-500">Nenhum diagnóstico selecionado. Gere um diagnóstico ou selecione um no histórico.</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Voltar ao Dashboard
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
              <UserCheck size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{result.aluno}</h2>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Relatório Individual de Desempenho</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Acurácia</p>
              <p className="text-xl font-bold text-emerald-900">{(result.summary.acuracia_ponderada * 100).toFixed(1)}%</p>
            </div>
            <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Acertos</p>
              <p className="text-xl font-bold text-blue-900">{result.summary.acertos}/{result.summary.total_questoes}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-600" />
              <h3 className="text-xl font-bold text-gray-900">Análise por Competência</h3>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-center">
              {['Todos', 'Forte', 'Atenção', 'Crítico'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                    filter === f 
                      ? "bg-white text-emerald-600 shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredCompetencias.length > 0 ? (
              filteredCompetencias.map((comp, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-100 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          comp.nivel === 'Forte' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                          comp.nivel === 'Atenção' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" :
                          "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                        )} />
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{comp.competencia}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-amber-500" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conhecimentos a Reforçar</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {comp.conhecimentos_fracos.map((c, i) => (
                              <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg border border-gray-100">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BookOpen size={14} className="text-blue-500" />
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recomendações Pedagógicas</p>
                            </div>
                            {editingComp !== comp.competencia ? (
                              <button 
                                onClick={() => {
                                  setEditingComp(comp.competencia);
                                  setEditValue(comp.recomendacoes);
                                }}
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Pencil size={10} />
                                Personalizar
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleSaveEdit(comp.competencia)}
                                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                                >
                                  Salvar
                                </button>
                                <button 
                                  onClick={() => setEditingComp(null)}
                                  className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                          </div>
                          {editingComp === comp.competencia ? (
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full p-3 text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none min-h-[100px]"
                              autoFocus
                            />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-blue-100 pl-4">
                              {comp.recomendacoes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="md:w-32 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Nível</p>
                        <p className={cn(
                          "text-sm font-bold",
                          comp.nivel === 'Forte' ? "text-emerald-600" :
                          comp.nivel === 'Atenção' ? "text-amber-600" :
                          "text-red-600"
                        )}>{comp.nivel}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200 md:w-8 md:h-px" />
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Acurácia</p>
                        <p className="text-sm font-bold text-gray-900">{(comp.acuracia_ponderada * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 italic">Nenhuma competência encontrada com o nível "{filter}".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ErrorBoundary>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [currentDiagnosticId, setCurrentDiagnosticId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [evolutionFilter, setEvolutionFilter] = useState<'7d' | '30d' | 'all'>('all');

  const activeTab = useMemo(() => {
    const path = location.pathname.split('/')[1] || 'input';
    return path as 'input' | 'dashboard' | 'plan' | 'json' | 'history' | 'tasks' | 'chat' | 'profile' | 'aluno';
  }, [location]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // History Listener
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const path = 'diagnostics';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Profile Listener
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserProfile);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Save/Update user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString()
      }, { merge: true });

    } catch (err) {
      console.error("Login Error", err);
      setError("Falha ao entrar com Google.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Email Login Error", err);
      setError("Email ou senha inválidos.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Update display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Send verification email
      await sendEmailVerification(user);
      setVerificationSent(true);

      // Save user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.email?.split('@')[0],
        photoURL: null,
        emailVerified: false,
        createdAt: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("Registration Error", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso.");
      } else {
        setError("Falha ao criar conta. Verifique os dados.");
      }
    }
  };

  const checkVerificationStatus = async () => {
    if (!auth.currentUser) return;
    setIsVerifying(true);
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      if (updatedUser.emailVerified) {
        const userRef = doc(db, 'users', updatedUser.uid);
        await updateDoc(userRef, { emailVerified: true });
        setUser(updatedUser);
      } else {
        setError("E-mail ainda não verificado. Verifique sua caixa de entrada.");
      }
    } catch (err) {
      console.error("Status Check Error", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
      setError("Link de verificação reenviado!");
    } catch (err) {
      console.error("Resend Error", err);
      setError("Falha ao reenviar link.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setResult(null);
      setData([]);
      navigate('/input');
    } catch (err) {
      console.error("Logout Error", err);
    }
  };

  const deleteDiagnostic = async (id: string) => {
    const path = `diagnostics/${id}`;
    try {
      await deleteDoc(doc(db, 'diagnostics', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          setData(results.data);
          setError(null);
        },
        error: (err) => {
          setError("Erro ao processar CSV: " + err.message);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          setData(data as any[]);
          setError(null);
        } catch (err: any) {
          setError("Erro ao processar planilha: " + err.message);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setError("Formato de arquivo não suportado. Use CSV ou Excel.");
    }
  };

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const json = JSON.parse(e.target.value);
      setData(Array.isArray(json) ? json : [json]);
      setError(null);
    } catch (err) {
      // If not JSON, try to parse as CSV-like text if needed, but let's stick to JSON for paste
      setError("Formato JSON inválido para colagem.");
    }
  };

  const processDiagnostic = async () => {
    if (data.length === 0) {
      setError("Nenhum dado para processar.");
      return;
    }

    if (!user) {
      setError("Você precisa estar logado para gerar diagnósticos.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await generateDiagnostic(data);
      setResult(res);
      
      // Save to Firestore
      const path = 'diagnostics';
      try {
        const docRef = await addDoc(collection(db, path), {
          userId: user.uid,
          aluno: res.aluno,
          result: res,
          createdAt: new Date().toISOString()
        });
        setCurrentDiagnosticId(docRef.id);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

      navigate('/dashboard');
    } catch (err) {
      setError("Erro ao gerar diagnóstico. Verifique sua chave API e os dados.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Emerald, Amber, Red

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.diagnostico_por_competencia.map(d => ({
      name: d.competencia.length > 20 ? d.competencia.substring(0, 20) + '...' : d.competencia,
      acuracia: d.acuracia_ponderada * 100,
      nivel: d.nivel
    }));
  }, [result]);

  const evolutionData = useMemo(() => {
    if (!result || !history.length) return [];
    
    let filteredHistory = history.filter(h => h.aluno === result.aluno);
    
    const now = new Date();
    if (evolutionFilter === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredHistory = filteredHistory.filter(h => new Date(h.createdAt) >= sevenDaysAgo);
    } else if (evolutionFilter === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredHistory = filteredHistory.filter(h => new Date(h.createdAt) >= thirtyDaysAgo);
    }

    const sorted = [...filteredHistory].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sorted.map(h => ({
      date: new Date(h.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      fullDate: new Date(h.createdAt).toLocaleString('pt-BR'),
      acuracia: Math.round(h.result.summary.acuracia_geral * 100)
    }));
  }, [result, history, evolutionFilter]);

  const exportToCSV = () => {
    if (!result) return;

    const csvData: any[] = result.diagnostico_por_competencia.map(comp => ({
      'Aluno': result.aluno,
      'Competência': comp.competencia,
      'Nível': comp.nivel,
      'Acurácia (%)': (comp.acuracia_ponderada * 100).toFixed(1),
      'Acertos': comp.acertos,
      'Total Questões': comp.total_questoes,
      'Conhecimentos Fracos': comp.conhecimentos_fracos.join('; '),
      'Recomendações': comp.recomendacoes
    }));

    // Add summary row
    csvData.push({
      'Aluno': result.aluno,
      'Competência': 'RESUMO GERAL',
      'Nível': '-',
      'Acurácia (%)': (result.summary.acuracia_geral * 100).toFixed(1),
      'Acertos': result.summary.acertos,
      'Total Questões': result.summary.total_questoes,
      'Conhecimentos Fracos': '-',
      'Recomendações': '-'
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `diagnostico_${result.aluno.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        {user && !user.emailVerified && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center justify-between text-amber-800 text-xs font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span>Seu e-mail não está verificado. Verifique seu e-mail para acessar todas as funcionalidades.</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={resendVerification}
                className="hover:underline"
              >
                Reenviar link
              </button>
              <button 
                onClick={checkVerificationStatus}
                disabled={isVerifying}
                className="bg-amber-100 px-2 py-1 rounded hover:bg-amber-200 disabled:opacity-50"
              >
                {isVerifying ? 'Verificando...' : 'Já verifiquei'}
              </button>
            </div>
          </div>
        )}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">EduDiagnóstico SAEP</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Especialista em Avaliação</p>
            </div>
          </div>

        {user && (
          <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'input', label: 'Dados', icon: Upload, path: '/input' },
              { id: 'history', label: 'Histórico', icon: History, path: '/history' },
              { id: 'tasks', label: 'Tarefas', icon: CheckSquare, path: '/tasks' },
              { id: 'chat', label: 'Chat IA', icon: MessageSquare, path: '/chat' },
              { id: 'profile', label: 'Perfil', icon: UserIcon, path: '/profile' },
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: !result, path: '/dashboard' },
              { id: 'plan', label: 'Plano', icon: Calendar, disabled: !result, path: '/plan' },
              { id: 'json', label: 'JSON', icon: Settings, disabled: !result, path: '/json' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && navigate(tab.path)}
                disabled={tab.disabled}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : tab.disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-emerald-600 hover:bg-white/50"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{user.displayName}</p>
                <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{user.email}</p>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </div>
              )}
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
            >
              <LogIn size={18} />
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>

      <main className="max-w-7xl mx-auto p-6">
        {!isAuthReady ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">Carregando...</p>
          </div>
        ) : !user ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto py-12 space-y-8"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
                <UserCheck size={32} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                {authMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h2>
              <p className="text-gray-500">
                {authMode === 'login' 
                  ? 'Acesse seus diagnósticos e planos de estudo.' 
                  : 'Comece a gerar diagnósticos inteligentes hoje.'}
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl space-y-6">
              <form onSubmit={authMode === 'login' ? handleEmailLogin : handleRegister} className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome Completo</label>
                    <input
                      required
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">E-mail</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Senha</label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                {verificationSent && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Link de verificação enviado! Verifique seu e-mail.
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  {authMode === 'login' ? 'Entrar' : 'Criar Conta'}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-bold tracking-widest">Ou continue com</span>
                </div>
              </div>

              <button 
                onClick={handleLogin}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>

              <div className="text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                >
                  {authMode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <Routes>
            <Route path="/input" element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Importar Dados</h2>
                      <p className="text-gray-500">Carregue o arquivo CSV ou Excel do simulado ou cole o JSON bruto.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700 mb-2 block">Arquivo de Planilha (CSV, Excel)</span>
                        <div className="relative group">
                          <input
                            type="file"
                            accept=".csv, .xlsx, .xls, .ods"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center group-hover:border-emerald-400 transition-colors bg-gray-50">
                            <Upload className="mx-auto text-gray-400 mb-3 group-hover:text-emerald-500 transition-colors" size={32} />
                            <p className="text-sm text-gray-600">
                              {data.length > 0 ? `${data.length} linhas carregadas` : "Clique ou arraste o arquivo CSV ou Excel aqui"}
                            </p>
                          </div>
                        </div>
                      </label>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500 uppercase tracking-widest text-[10px] font-bold">OU</span>
                        </div>
                      </div>

                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700 mb-2 block">Colar JSON</span>
                        <textarea
                          onChange={handlePaste}
                          placeholder='[{"aluno": "João", "competencia": "C1", "acertou": 1, "bloom": "Médio"}, ...]'
                          className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </label>
                    </div>

                    <button
                      onClick={processDiagnostic}
                      disabled={loading || data.length === 0}
                      className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 size={20} />
                      )}
                      {loading ? "Processando..." : "Gerar Diagnóstico"}
                    </button>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <p>{error}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-emerald-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                      <div className="relative z-10 space-y-4">
                        <h3 className="text-xl font-bold">Instruções de Mapeamento</h3>
                        <ul className="space-y-3 text-emerald-100 text-sm">
                          <li className="flex gap-2">
                            <ChevronRight size={16} className="shrink-0 text-emerald-400" />
                            <span>O sistema detecta automaticamente colunas como <b>competencia</b>, <b>bloom</b> e <b>acertou</b>.</span>
                          </li>
                          <li className="flex gap-2">
                            <ChevronRight size={16} className="shrink-0 text-emerald-400" />
                            <span>Pesos automáticos: Fácil (1.0), Médio (1.5), Difícil (2.0), Superdifícil (3.0).</span>
                          </li>
                          <li className="flex gap-2">
                            <ChevronRight size={16} className="shrink-0 text-emerald-400" />
                            <span>Gere diagnósticos individuais ou por turma (o sistema agrupa por aluno).</span>
                          </li>
                        </ul>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Prévia dos Dados</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              {data.length > 0 && Object.keys(data[0]).slice(0, 4).map(k => (
                                <th key={k} className="pb-2 font-semibold text-gray-600">{k}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.slice(0, 5).map((row, i) => (
                              <tr key={i} className="border-b border-gray-50 last:border-0">
                                {Object.values(row).slice(0, 4).map((v: any, j) => (
                                  <td key={j} className="py-2 text-gray-500 truncate max-w-[100px]">{String(v)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {data.length === 0 && <p className="text-center py-8 text-gray-400 italic">Nenhum dado carregado</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            } />

            <Route path="/history" element={
              <HistoryView 
                history={history} 
                deleteDiagnostic={deleteDiagnostic} 
                setResult={setResult} 
                navigate={navigate} 
                setCurrentDiagnosticId={setCurrentDiagnosticId}
              />
            } />

            <Route path="/tasks" element={<TasksView user={user} />} />

            <Route path="/chat" element={<ChatView user={user} diagnostic={result} />} />

            <Route path="/profile" element={<ProfileView user={user} profile={userProfile} />} />

            <Route path="/aluno" element={<AlunoView result={result} onUpdateResult={setResult} diagnosticId={currentDiagnosticId} />} />

            <Route path="/dashboard" element={
              result ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Dashboard de Diagnóstico</h2>
                      <p className="text-sm text-gray-500">Visão geral do desempenho de {result.aluno}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate('/aluno')}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 group"
                      >
                        <UserCheck size={18} className="group-hover:scale-110 transition-transform" />
                        Ver Detalhes do Aluno
                      </button>
                      <button
                        onClick={exportToCSV}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm group"
                      >
                        <Download size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                        Exportar CSV
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Acurácia Geral</p>
                      <p className="text-3xl font-light">{(result.summary.acuracia_geral * 100).toFixed(1)}%</p>
                      <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000" 
                          style={{ width: `${result.summary.acuracia_geral * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Acurácia Ponderada</p>
                      <p className="text-3xl font-light">{(result.summary.acuracia_ponderada * 100).toFixed(1)}%</p>
                      <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-1000" 
                          style={{ width: `${result.summary.acuracia_ponderada * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Questões</p>
                      <p className="text-3xl font-light">{result.summary.total_questoes}</p>
                      <p className="text-xs text-gray-500 mt-2">{result.summary.acertos} acertos totais</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Aluno</p>
                      <p className="text-xl font-bold text-emerald-900 truncate">{result.aluno}</p>
                      <p className="text-xs text-emerald-700 mt-2">Diagnóstico Individual</p>
                    </div>
                  </div>

                  {/* Alerts */}
                  {result.summary.alertas_dados.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-center">
                      <AlertCircle className="text-amber-600" size={20} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900">Alertas de Dados</p>
                        <p className="text-xs text-amber-700">{result.summary.alertas_dados.join(', ')}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold">Desempenho por Competência</h3>
                        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1.5 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Forte</span>
                          <span className="flex items-center gap-1.5 text-amber-600"><div className="w-2 h-2 rounded-full bg-amber-500" /> Atenção</span>
                          <span className="flex items-center gap-1.5 text-red-600"><div className="w-2 h-2 rounded-full bg-red-500" /> Crítico</span>
                        </div>
                      </div>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                            <XAxis type="number" domain={[0, 100]} hide />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={150} 
                              tick={{ fontSize: 11, fontWeight: 500 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="acuracia" radius={[0, 4, 4, 0]} barSize={20}>
                              {chartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.nivel === 'Forte' ? '#10b981' : entry.nivel === 'Atenção' ? '#f59e0b' : '#ef4444'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Message for student */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                      <h3 className="text-lg font-bold mb-6">Feedback Personalizado</h3>
                      <div className="flex-1 bg-gray-50 rounded-xl p-6 relative">
                        <div className="absolute top-0 left-6 -translate-y-1/2 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                          <UserCheck size={16} className="text-emerald-600" />
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700 italic">
                          "{result.mensagem_para_o_aluno}"
                        </p>
                      </div>
                      <div className="mt-6 p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">Ações Sugeridas para Instrutor</p>
                        <ul className="space-y-2">
                          {result.acoes_para_o_instrutor.slice(0, 3).map((acao, i) => (
                            <li key={i} className="text-xs text-emerald-900 flex gap-2">
                              <span className="text-emerald-400">•</span> {acao}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Evolution Chart */}
                  {(evolutionData.length > 1 || evolutionFilter !== 'all') && (
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <History size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">Evolução da Acurácia Geral</h3>
                            <p className="text-xs text-gray-500">Progresso ao longo dos diagnósticos realizados</p>
                          </div>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-center">
                          <button
                            onClick={() => setEvolutionFilter('7d')}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                              evolutionFilter === '7d' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                          >
                            7 Dias
                          </button>
                          <button
                            onClick={() => setEvolutionFilter('30d')}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                              evolutionFilter === '30d' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                          >
                            30 Dias
                          </button>
                          <button
                            onClick={() => setEvolutionFilter('all')}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                              evolutionFilter === 'all' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                          >
                            Tudo
                          </button>
                        </div>
                      </div>
                      
                      {evolutionData.length > 1 ? (
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="date" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                dy={10}
                              />
                              <YAxis 
                                domain={[0, 100]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                              />
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                                formatter={(value: number) => [`${value}%`, 'Acurácia']}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="acuracia" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 8, strokeWidth: 0 }}
                                animationDuration={1500}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <History className="text-gray-300" size={40} />
                          <p className="text-gray-500 text-sm italic px-8">
                            {evolutionFilter === 'all' 
                              ? "Dados insuficientes para mostrar evolução. Realize mais diagnósticos."
                              : "Nenhum diagnóstico encontrado neste período."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detailed Competency Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {result.diagnostico_por_competencia.map((comp, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className={cn(
                          "px-6 py-4 border-b flex items-center justify-between",
                          comp.nivel === 'Forte' ? "bg-emerald-50 border-emerald-100" : 
                          comp.nivel === 'Atenção' ? "bg-amber-50 border-amber-100" : 
                          "bg-red-50 border-red-100"
                        )}>
                          <h4 className="font-bold text-sm truncate pr-2">{comp.competencia}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            comp.nivel === 'Forte' ? "bg-emerald-200 text-emerald-800" : 
                            comp.nivel === 'Atenção' ? "bg-amber-200 text-amber-800" : 
                            "bg-red-200 text-red-800"
                          )}>
                            {comp.nivel}
                          </span>
                        </div>
                        <div className="p-6 space-y-4 flex-1">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acurácia Ponderada</p>
                              <p className="text-2xl font-light">{(comp.acuracia_ponderada * 100).toFixed(0)}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Questões</p>
                              <p className="text-sm font-medium">{comp.acertos}/{comp.total_questoes}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conhecimentos Críticos</p>
                            <div className="flex flex-wrap gap-1.5">
                              {comp.conhecimentos_fracos.map((c, j) => (
                                <span key={j} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                                  {c}
                                </span>
                              ))}
                              {comp.conhecimentos_fracos.length === 0 && <span className="text-[10px] text-gray-400 italic">Nenhum identificado</span>}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-50">
                            <p className="text-xs text-gray-600 leading-relaxed">
                              <span className="font-bold text-gray-900">Recomendação:</span> {comp.recomendacoes}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : <Navigate to="/input" />
            } />

            <Route path="/plan" element={
              result ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-4xl mx-auto space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold">Plano de Estudos - 7 Dias</h2>
                    <p className="text-gray-500">Cronograma intensivo baseado nas competências em nível crítico.</p>
                  </div>

                  <div className="space-y-4">
                    {result.plano_de_estudos_7_dias.map((dia) => (
                      <div key={dia.dia} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex">
                        <div className="w-24 bg-emerald-600 flex flex-col items-center justify-center text-white shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Dia</span>
                          <span className="text-4xl font-light">{dia.dia}</span>
                        </div>
                        <div className="p-8 flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-emerald-900">{dia.tema}</h3>
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 size={12} />
                              Meta do Dia
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atividades</p>
                              <ul className="space-y-2">
                                {dia.atividades.map((atv, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 flex gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                    {atv}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Critério de Sucesso</p>
                              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 italic">
                                "{dia.criterio_sucesso}"
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4 pt-8">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
                      <Download size={18} /> Baixar PDF
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                      <Calendar size={18} /> Adicionar ao Google Agenda
                    </button>
                  </div>
                </motion.div>
              ) : <Navigate to="/input" />
            } />

            <Route path="/json" element={
              result ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Saída JSON Estruturada</h2>
                      <p className="text-gray-500">Formato pronto para integração com sistemas externos.</p>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all"
                    >
                      <Copy size={16} /> Copiar JSON
                    </button>
                  </div>
                  <div className="bg-[#1A1A1A] text-emerald-400 p-8 rounded-2xl font-mono text-xs overflow-auto max-h-[600px] shadow-2xl border border-white/10">
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                  </div>
                </motion.div>
              ) : <Navigate to="/input" />
            } />

            <Route path="*" element={<Navigate to="/input" />} />
          </Routes>
      )}
    </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <BarChart3 size={18} />
              </div>
              <span className="font-bold tracking-tight">EduDiagnóstico</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Transformando dados de avaliações em caminhos claros para o sucesso acadêmico através de inteligência artificial especializada.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Padrões Suportados</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>SAEP (Pernambuco)</li>
              <li>SAEB (Nacional)</li>
              <li>Matriz de Referência BNCC</li>
              <li>Taxonomia de Bloom</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Segurança</h4>
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 size={16} />
              Processamento Local & Seguro
            </div>
            <p className="text-xs text-gray-400">
              Seus dados são processados via API Gemini e não são armazenados permanentemente em nossos servidores.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">© 2024 EduDiagnóstico SAEP - Versão 1.0.0</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Privacidade</a>
            <a href="#" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Termos</a>
            <a href="#" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
