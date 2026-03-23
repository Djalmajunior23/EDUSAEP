import React, { useState, useMemo, useEffect, Component, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  User as UserIcon,
  Search,
  ChevronLeft,
  Users,
  Square,
  X,
  Menu,
  Database,
  Zap,
  ArrowRight,
  Target
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
  Pie,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateDiagnostic, generateSuggestions, DiagnosticResult } from './services/geminiService';
import { getChatResponse, ChatMessage as GeminiChatMessage } from './services/chatService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  HashRouter, 
  Routes, 
  Route, 
  useNavigate, 
  useLocation,
  Navigate,
  useParams
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
  getDocs,
  updateDoc,
  setDoc,
  writeBatch,
  limit
} from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Protected Route Component
function ProtectedRoute({ allowedRoles, userProfile, children }: { allowedRoles: string[], userProfile: UserProfile | null, children: React.ReactNode }) {
  if (!userProfile) return null; // Wait for profile to load
  
  // Admin is a superuser who can access everything
  if (userProfile.role === 'admin') return <>{children}</>;
  
  if (!allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
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
  role: 'professor' | 'aluno' | 'admin';
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

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  weight: number;
  competency: string;
  skill?: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
  explanation?: string;
  createdAt?: any;
  createdBy?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  questions: Question[];
  createdBy: string;
  createdAt: any;
  status: 'draft' | 'published';
  type: 'simulado' | 'exercicio';
}

export interface ExamSubmission {
  id: string;
  resourceId: string; // examId or exerciseId
  type: 'exam' | 'exercise';
  studentId: string;
  studentName: string;
  answers: number[];
  score: number;
  maxScore: number;
  completedAt: any;
  competencyResults: { [key: string]: { correct: number, total: number } };
}

export interface StudyPlan {
  id: string;
  userId: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  createdAt: any;
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

function HistoryView({ history, deleteDiagnostic, setResult, navigate, setCurrentDiagnosticId, userProfile }: { history: any[], deleteDiagnostic: (id: string) => void, setResult: (res: any) => void, navigate: any, setCurrentDiagnosticId: (id: string) => void, userProfile: UserProfile | null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const itemsPerPage = 20;

  const isStudent = userProfile?.role === 'aluno';
  const isProfessor = userProfile?.role === 'professor' || userProfile?.role === 'admin';

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const studentMatch = item.aluno.toLowerCase().includes(searchLower);
      const dateMatch = new Date(item.createdAt).toLocaleDateString().includes(searchLower);
      return studentMatch || dateMatch;
    });
  }, [history, searchTerm]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedHistory.map(item => item.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} diagnósticos selecionados? Esta ação não pode ser desfeita.`)) return;

    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'diagnostics', id));
      });
      await batch.commit();
      setSelectedIds(new Set());
      setIsBulkEdit(false);
      toast.success(`${selectedIds.size} diagnósticos excluídos com sucesso.`);
    } catch (err) {
      console.error("Bulk Delete Error", err);
      toast.error("Erro ao excluir alguns diagnósticos.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{isStudent ? 'Meus Diagnósticos' : 'Histórico de Diagnósticos'}</h2>
          <p className="text-gray-500">{isStudent ? 'Acesse seus resultados anteriores.' : 'Acesse diagnósticos gerados anteriormente.'}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {isProfessor && filteredHistory.length > 0 && (
            <button
              onClick={() => {
                setIsBulkEdit(!isBulkEdit);
                setSelectedIds(new Set());
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                isBulkEdit ? "bg-gray-200 text-gray-700" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              {isBulkEdit ? <X size={14} /> : <CheckSquare size={14} />}
              {isBulkEdit ? 'Cancelar Seleção' : 'Seleção em Massa'}
            </button>
          )}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={isStudent ? "Buscar por data..." : "Buscar por aluno ou data..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {isBulkEdit && isProfessor && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline"
            >
              {selectedIds.size === paginatedHistory.length ? <CheckSquare size={16} /> : <Square size={16} />}
              {selectedIds.size === paginatedHistory.length ? 'Desmarcar Todos' : 'Selecionar Todos na Página'}
            </button>
            <span className="text-xs font-medium text-emerald-600">
              {selectedIds.size} selecionado(s)
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-100 transition-all"
          >
            <Trash2 size={14} />
            Excluir Selecionados
          </button>
        </motion.div>
      )}

      {filteredHistory.length === 0 ? (
        <div className="bg-white p-20 rounded-2xl border border-gray-200 text-center space-y-4">
          <History className="mx-auto text-gray-300" size={48} />
          <p className="text-gray-500">Nenhum diagnóstico encontrado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedHistory.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "bg-white p-6 rounded-2xl border transition-all group relative",
                  isBulkEdit && selectedIds.has(item.id) ? "border-emerald-500 shadow-md" : "border-gray-200 shadow-sm hover:shadow-md",
                  isBulkEdit && "cursor-pointer"
                )}
                onClick={() => isBulkEdit && toggleSelect(item.id)}
              >
                {isBulkEdit && isProfessor && (
                  <div className="absolute top-4 left-4 z-10">
                    {selectedIds.has(item.id) ? (
                      <CheckSquare className="text-emerald-600" size={20} />
                    ) : (
                      <Square className="text-gray-300" size={20} />
                    )}
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600",
                    isBulkEdit && "ml-8"
                  )}>
                    <FileText size={20} />
                  </div>
                  {!isStudent && !isBulkEdit && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Tem certeza que deseja excluir este diagnóstico?")) {
                          deleteDiagnostic(item.id);
                        }
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <h3 className={cn(
                  "font-bold text-gray-900 mb-1 truncate",
                  isBulkEdit && "ml-8"
                )}>{item.aluno}</h3>
                <p className={cn(
                  "text-xs text-gray-400 mb-4",
                  isBulkEdit && "ml-8"
                )}>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setResult(item.result);
                      setCurrentDiagnosticId(item.id);
                      navigate(`/dashboard/${item.id}`);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ReportsView({ history }: { history: any[] }) {
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const students = useMemo(() => {
    const uniqueStudents = Array.from(new Set(history.map(h => h.aluno)));
    return uniqueStudents.sort();
  }, [history]);

  const suggestedStudents = useMemo(() => {
    if (!history.length) return [];
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const suggestions: { aluno: string, reason: string, type: 'recent' | 'variance' }[] = [];
    
    const studentData: Record<string, any[]> = {};
    history.forEach(h => {
      if (!studentData[h.aluno]) studentData[h.aluno] = [];
      studentData[h.aluno].push(h);
    });
    
    Object.entries(studentData).forEach(([aluno, data]) => {
      const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const mostRecent = new Date(sorted[0].createdAt);
      if (mostRecent >= sevenDaysAgo) {
        suggestions.push({ aluno, reason: 'Diagnóstico recente', type: 'recent' });
      }
      
      if (sorted.length >= 2) {
        const acc1 = sorted[0].result.summary.acuracia_geral;
        const acc2 = sorted[1].result.summary.acuracia_geral;
        const diff = Math.abs(acc1 - acc2);
        if (diff >= 0.15) {
          suggestions.push({ 
            aluno, 
            reason: `Variação de ${(diff * 100).toFixed(0)}% no desempenho`, 
            type: 'variance' 
          });
        }
      }
    });
    
    const uniqueSuggestions = suggestions.reduce((acc, curr) => {
      const existing = acc.find(s => s.aluno === curr.aluno);
      if (!existing) {
        acc.push(curr);
      } else if (curr.type === 'variance' && existing.type === 'recent') {
        const idx = acc.indexOf(existing);
        acc[idx] = curr;
      }
      return acc;
    }, [] as typeof suggestions);

    return uniqueSuggestions.sort((a, b) => a.type === 'variance' ? -1 : 1).slice(0, 4);
  }, [history]);

  const chartData = useMemo(() => {
    let filtered = [...history];

    if (selectedStudent !== 'all') {
      filtered = filtered.filter(h => h.aluno === selectedStudent);
    }

    if (startDate) {
      filtered = filtered.filter(h => new Date(h.createdAt) >= new Date(startDate));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(h => new Date(h.createdAt) <= end);
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return filtered.map(h => ({
      date: new Date(h.createdAt).toLocaleDateString('pt-BR'),
      aluno: h.aluno,
      acuracia: Math.round(h.result.summary.acuracia_geral * 100),
      acuraciaPonderada: Math.round(h.result.summary.acuracia_ponderada * 100),
      timestamp: new Date(h.createdAt).getTime()
    }));
  }, [history, selectedStudent, startDate, endDate]);

  const groupedData = useMemo(() => {
    if (selectedStudent !== 'all') return { [selectedStudent]: chartData };
    
    const groups: Record<string, any[]> = {};
    chartData.forEach(d => {
      if (!groups[d.aluno]) groups[d.aluno] = [];
      groups[d.aluno].push(d);
    });
    return groups;
  }, [chartData, selectedStudent]);

  const downloadCSV = () => {
    if (chartData.length === 0) return;
    const csvContent = [
      ['Data', 'Aluno', 'Acurácia Geral (%)', 'Acurácia Ponderada (%)'],
      ...chartData.map(d => [d.date, d.aluno, d.acuracia, d.acuraciaPonderada])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_desempenho_${selectedStudent}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`relatorio_desempenho_${selectedStudent}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios de Desempenho</h2>
          <p className="text-sm text-gray-500">Acompanhe a evolução dos alunos ao longo do tempo.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            disabled={chartData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm font-bold"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={downloadPDF}
            disabled={chartData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-bold"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      {/* Summary Table for All Students */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Desempenho Geral dos Alunos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Aluno</th>
                <th className="px-4 py-3">Média Acurácia (%)</th>
                <th className="px-4 py-3">Último Desempenho</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([aluno, data]) => {
                const sorted = [...data].sort((a, b) => b.timestamp - a.timestamp);
                const avg = Math.round(data.reduce((acc, curr) => acc + curr.acuracia, 0) / data.length);
                return (
                  <tr key={aluno} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{aluno}</td>
                    <td className="px-4 py-3">{avg}%</td>
                    <td className="px-4 py-3">{sorted[0].acuracia}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div id="report-content" className="space-y-8">
        {/* Smart Suggestions */}
      {suggestedStudents.length > 0 && showSuggestions && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800">
              <Loader2 size={18} className="text-emerald-600" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Filtro Inteligente: Alunos Sugeridos</h3>
            </div>
            <button 
              onClick={() => setShowSuggestions(false)}
              className="text-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestedStudents.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelectedStudent(s.aluno)}
                className={cn(
                  "p-4 bg-white rounded-xl border border-emerald-100 text-left hover:shadow-md transition-all group",
                  selectedStudent === s.aluno && "ring-2 ring-emerald-500"
                )}
              >
                <p className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">{s.aluno}</p>
                <p className="text-[10px] text-gray-500 mt-1">{s.reason}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl border transition-all",
              !startDate && !endDate ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            Todo o período
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 7);
              setEndDate(end.toISOString().split('T')[0]);
              setStartDate(start.toISOString().split('T')[0]);
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl border transition-all",
              startDate && endDate && (new Date(endDate).getTime() - new Date(startDate).getTime()) <= 7 * 24 * 60 * 60 * 1000 && (new Date(endDate).getTime() - new Date(startDate).getTime()) > 0 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - 30);
              setEndDate(end.toISOString().split('T')[0]);
              setStartDate(start.toISOString().split('T')[0]);
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl border transition-all",
              startDate && endDate && (new Date(endDate).getTime() - new Date(startDate).getTime()) > 7 * 24 * 60 * 60 * 1000 && (new Date(endDate).getTime() - new Date(startDate).getTime()) <= 30 * 24 * 60 * 60 * 1000 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            Últimos 30 dias
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtrar por Aluno</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="all">Todos os Alunos</option>
              {students.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Evolução da Acurácia (%)</h3>
        {chartData.length > 0 ? (
          <div className="h-[400px]">
            {Object.entries(groupedData).map(([student, data]) => (
              <div key={student} className="mb-8">
                <h4 className="text-sm font-bold text-gray-700 mb-2">{student}</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                        }}
                      />
                      <Legend verticalAlign="top" align="right" height={36} />
                      <Line 
                        type="monotone" 
                        dataKey="acuracia" 
                        name="Acurácia Geral"
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="acuraciaPonderada" 
                        name="Acurácia Ponderada"
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 space-y-4">
            <BarChart3 size={48} className="opacity-20" />
            <p>Nenhum dado encontrado para os filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* Table Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Aluno</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Acurácia Geral</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Acurácia Ponderada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {chartData.slice().reverse().map((h, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">{h.date}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{h.aluno}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-bold",
                    h.acuracia >= 75 ? "bg-emerald-50 text-emerald-700" :
                    h.acuracia >= 55 ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  )}>
                    {h.acuracia}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-bold",
                    h.acuraciaPonderada >= 75 ? "bg-emerald-50 text-emerald-700" :
                    h.acuraciaPonderada >= 55 ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  )}>
                    {h.acuraciaPonderada}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
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
      toast.success('Tarefa adicionada!');
    } catch (err) {
      toast.error('Erro ao adicionar tarefa.');
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
      toast.error('Erro ao atualizar tarefa.');
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    const path = `tasks/${id}`;
    try {
      await deleteDoc(doc(db, 'tasks', id));
      toast.success('Tarefa excluída!');
    } catch (err) {
      toast.error('Erro ao excluir tarefa.');
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
      toast.success('Tarefa atualizada!');
    } catch (err) {
      toast.error('Erro ao atualizar tarefa.');
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

import { initializeApp } from 'firebase/app';
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword as createSecondaryUser } from 'firebase/auth';
import { firebaseConfig } from './firebase';

function StudentDashboardView({ user }: { user: User | null }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/student-exams')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
        >
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Simulados</h3>
            <p className="text-xs text-gray-500">Avaliações completas para testar seus conhecimentos.</p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-emerald-600 text-xs font-bold">
            Acessar <ArrowRight size={14} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/exercises')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <CheckSquare size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Exercícios</h3>
            <p className="text-xs text-gray-500">Pratique tópicos específicos com feedback imediato.</p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-blue-600 text-xs font-bold">
            Praticar <ArrowRight size={14} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/study-plan')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
        >
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Plano IA</h3>
            <p className="text-xs text-gray-500">Seu roteiro personalizado baseado no seu desempenho.</p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-purple-600 text-xs font-bold">
            Ver Plano <ArrowRight size={14} />
          </div>
        </motion.button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Meu Desempenho</h2>
        <p className="text-gray-600">
          Bem-vindo ao seu painel de desempenho. Aqui você poderá ver os resultados dos seus diagnósticos e acompanhar sua evolução.
        </p>
        <div className="mt-8 p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-center">
          <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum diagnóstico disponível</h3>
          <p className="text-gray-500">Seus professores ainda não publicaram nenhum resultado para você.</p>
        </div>
      </div>
    </div>
  );
}

function QuestionsBankView({ user }: { user: User | null }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    weight: 1,
    competency: '',
    difficulty: 'médio'
  });

  useEffect(() => {
    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setQuestions(questionsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveQuestion = async () => {
    if (!user) return;
    try {
      const questionData = {
        ...currentQuestion,
        createdBy: user.uid,
        createdAt: currentQuestion.id ? currentQuestion.createdAt : serverTimestamp(),
      };

      if (currentQuestion.id) {
        await updateDoc(doc(db, 'questions', currentQuestion.id), questionData);
        toast.success("Questão atualizada!");
      } else {
        await addDoc(collection(db, 'questions'), questionData);
        toast.success("Questão adicionada ao banco!");
      }
      setIsEditing(false);
      setCurrentQuestion({ text: '', options: ['', '', '', ''], correctOption: 0, weight: 1, competency: '', difficulty: 'médio' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'questions');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Excluir esta questão do banco?")) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
      toast.success("Questão excluída.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `questions/${id}`);
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.competency.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Banco de Questões</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por competência ou enunciado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full md:w-64"
            />
          </div>
          <button 
            onClick={() => {
              setCurrentQuestion({ text: '', options: ['', '', '', ''], correctOption: 0, weight: 1, competency: '', difficulty: 'médio' });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 whitespace-nowrap"
          >
            <Plus size={18} /> Nova Questão
          </button>
        </div>
      </div>

      {isEditing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enunciado</label>
              <textarea 
                value={currentQuestion.text} 
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Digite o enunciado da questão..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Competência</label>
              <input 
                type="text" 
                value={currentQuestion.competency} 
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, competency: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dificuldade</label>
              <select 
                value={currentQuestion.difficulty} 
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value as any })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="fácil">Fácil</option>
                <option value="médio">Médio</option>
                <option value="difícil">Difícil</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opções</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQuestion.options?.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="correct-bank" 
                    checked={currentQuestion.correctOption === oIdx} 
                    onChange={() => setCurrentQuestion({ ...currentQuestion, correctOption: oIdx })}
                  />
                  <input 
                    type="text" 
                    value={opt} 
                    onChange={(e) => {
                      const newOpts = [...(currentQuestion.options || [])];
                      newOpts[oIdx] = e.target.value;
                      setCurrentQuestion({ ...currentQuestion, options: newOpts });
                    }}
                    className="flex-1 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg"
                    placeholder={`Opção ${String.fromCharCode(65 + oIdx)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 font-bold">Cancelar</button>
            <button onClick={handleSaveQuestion} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100">Salvar Questão</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center space-y-4">
            <Search className="mx-auto text-gray-200" size={48} />
            <p className="text-gray-500 italic">Nenhuma questão encontrada para os critérios de busca.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between group">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    q.difficulty === 'fácil' ? "bg-emerald-100 text-emerald-700" :
                    q.difficulty === 'médio' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                  )}>
                    {q.difficulty}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{q.competency}</span>
                </div>
                <p className="text-gray-900 font-medium">{q.text}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setCurrentQuestion(q); setIsEditing(true); }} className="p-2 text-gray-400 hover:text-emerald-600"><Pencil size={18} /></button>
                <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExamsManagementView({ user, defaultType = 'simulado' }: { user: User | null, defaultType?: 'simulado' | 'exercicio' }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [currentExam, setCurrentExam] = useState<Partial<Exam>>({
    title: '',
    description: '',
    subject: '',
    questions: [],
    status: 'draft',
    type: defaultType
  });

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'exams'), 
      where('type', '==', defaultType),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExams(examsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exams');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, defaultType]);

  const handleGenerateSAEP = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const allQuestions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      
      if (allQuestions.length < 40) {
        toast.error(`Banco de questões insuficiente. Você tem ${allQuestions.length} questões, mas precisa de 40.`);
        setLoading(false);
        return;
      }

      // Shuffle and pick 40
      const shuffled = allQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 40);

      const newExam: Omit<Exam, 'id'> = {
        title: `Simulado SAEP - ${new Date().toLocaleDateString()}`,
        description: "Simulado gerado automaticamente com 40 questões aleatórias do banco.",
        subject: "Geral",
        questions: selectedQuestions,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        status: 'published',
        type: 'simulado'
      };

      await addDoc(collection(db, 'exams'), newExam);
      toast.success("Simulado SAEP gerado com sucesso!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async () => {
    if (!user) return;
    if (!currentExam.title || !currentExam.subject) {
      toast.error("Título e Disciplina são obrigatórios.");
      return;
    }

    try {
      const examData = {
        ...currentExam,
        createdBy: user.uid,
        createdAt: currentExam.id ? currentExam.createdAt : serverTimestamp(),
      };

      if (currentExam.id) {
        await updateDoc(doc(db, 'exams', currentExam.id), examData);
        toast.success(`${defaultType === 'simulado' ? 'Simulado' : 'Exercício'} atualizado com sucesso!`);
      } else {
        await addDoc(collection(db, 'exams'), examData);
        toast.success(`${defaultType === 'simulado' ? 'Simulado' : 'Exercício'} criado com sucesso!`);
      }
      setIsEditing(false);
      setCurrentExam({ title: '', description: '', subject: '', questions: [], status: 'draft', type: defaultType });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'exams');
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir este ${defaultType === 'simulado' ? 'simulado' : 'exercício'}?`)) return;
    try {
      await deleteDoc(doc(db, 'exams', id));
      toast.success(`${defaultType === 'simulado' ? 'Simulado' : 'Exercício'} excluído.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `exams/${id}`);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      options: ['', '', '', ''],
      correctOption: 0,
      weight: 1,
      competency: '',
      difficulty: 'médio'
    };
    setCurrentExam({
      ...currentExam,
      questions: [...(currentExam.questions || []), newQuestion]
    });
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...(currentExam.questions || [])];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setCurrentExam({ ...currentExam, questions: updatedQuestions });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updatedQuestions = [...(currentExam.questions || [])];
    const updatedOptions = [...updatedQuestions[qIndex].options];
    updatedOptions[oIndex] = value;
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: updatedOptions };
    setCurrentExam({ ...currentExam, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...(currentExam.questions || [])];
    updatedQuestions.splice(index, 1);
    setCurrentExam({ ...currentExam, questions: updatedQuestions });
  };

  if (isEditing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{currentExam.id ? `Editar ${defaultType === 'simulado' ? 'Simulado' : 'Exercício'}` : `Novo ${defaultType === 'simulado' ? 'Simulado' : 'Exercício'}`}</h2>
          <div className="flex gap-3">
            <input 
              type="file" 
              accept=".csv, .pdf, .docx" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                setIsProcessingFile(true);
                let text = '';
                
                try {
                  if (file.type === 'application/pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    for (let i = 1; i <= pdf.numPages; i++) {
                      const page = await pdf.getPage(i);
                      const content = await page.getTextContent();
                      text += content.items.map((item: any) => item.str).join(' ');
                    }
                  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    text = result.value;
                  } else if (file.type === 'text/csv') {
                    text = await file.text();
                  }

                  // Send to Gemini to parse
                  const prompt = `Parse the following text into a list of questions in JSON format.
                  Each question should have: text, options (array of 4 strings), correctOption (index 0-3), weight (number), competency (string).
                  Text: ${text}`;
                  
                  const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                      responseMimeType: 'application/json',
                      responseSchema: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            text: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctOption: { type: Type.INTEGER },
                            weight: { type: Type.INTEGER },
                            competency: { type: Type.STRING }
                          }
                        }
                      }
                    }
                  });
                  
                  const questions = JSON.parse(response.text);
                  setCurrentExam({ ...currentExam, questions });
                  toast.success("Arquivo processado com sucesso!");
                } catch (err) {
                  console.error(err);
                  toast.error("Erro ao processar arquivo.");
                } finally {
                  setIsProcessingFile(false);
                }
              }}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file" className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl cursor-pointer">
              {isProcessingFile ? 'Processando...' : 'Importar Arquivo'}
            </label>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900 font-bold">Cancelar</button>
            <button onClick={handleSaveExam} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100">Salvar {defaultType === 'simulado' ? 'Simulado' : 'Exercício'}</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Título</label>
              <input 
                type="text" 
                value={currentExam.title} 
                onChange={(e) => setCurrentExam({ ...currentExam, title: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: Simulado de Matemática - 1º Bimestre"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Disciplina</label>
              <input 
                type="text" 
                value={currentExam.subject} 
                onChange={(e) => setCurrentExam({ ...currentExam, subject: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: Matemática"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Descrição</label>
            <textarea 
              value={currentExam.description} 
              onChange={(e) => setCurrentExam({ ...currentExam, description: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
              placeholder={`Descreva o objetivo deste ${defaultType === 'simulado' ? 'simulado' : 'exercício'}...`}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={currentExam.status === 'published'} 
                onChange={(e) => setCurrentExam({ ...currentExam, status: e.target.checked ? 'published' : 'draft' })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-bold text-gray-700">Publicar {defaultType === 'simulado' ? 'Simulado' : 'Exercício'}</span>
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Questões ({currentExam.questions?.length || 0})</h3>
            <button onClick={addQuestion} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">
              <Plus size={18} /> Adicionar Questão
            </button>
          </div>

          {currentExam.questions?.map((q, qIdx) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 relative group">
              <button onClick={() => removeQuestion(qIdx)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={18} />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enunciado da Questão {qIdx + 1}</label>
                  <textarea 
                    value={q.text} 
                    onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Digite o enunciado da questão..."
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Competência Relacionada</label>
                    <input 
                      type="text" 
                      value={q.competency} 
                      onChange={(e) => updateQuestion(qIdx, 'competency', e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ex: Álgebra"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peso/Valor</label>
                    <input 
                      type="number" 
                      value={q.weight} 
                      onChange={(e) => updateQuestion(qIdx, 'weight', parseFloat(e.target.value))}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opções de Resposta</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name={`correct-${q.id}`} 
                        checked={q.correctOption === oIdx} 
                        onChange={() => updateQuestion(qIdx, 'correctOption', oIdx)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <input 
                        type="text" 
                        value={opt} 
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        className={cn(
                          "flex-1 p-2 text-sm bg-gray-50 border rounded-lg outline-none transition-all",
                          q.correctOption === oIdx ? "border-emerald-500 bg-emerald-50" : "border-gray-200 focus:border-emerald-500"
                        )}
                        placeholder={`Opção ${String.fromCharCode(65 + oIdx)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de {defaultType === 'simulado' ? 'Simulados' : 'Exercícios'}</h2>
          <p className="text-sm text-gray-500">{defaultType === 'simulado' ? 'Crie e gerencie avaliações para seus alunos' : 'Crie atividades de fixação com feedback imediato'}</p>
        </div>
        <div className="flex gap-3">
          {defaultType === 'simulado' && (
            <button 
              onClick={handleGenerateSAEP}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              <Zap size={20} /> Gerar Simulado SAEP (40q)
            </button>
          )}
          <button 
            onClick={() => {
              setCurrentExam({ title: '', description: '', subject: '', questions: [], status: 'draft', type: defaultType });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
          >
            <Plus size={20} /> Novo {defaultType === 'simulado' ? 'Simulado' : 'Exercício'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto">
            <BookOpen size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">Nenhum {defaultType === 'simulado' ? 'simulado' : 'exercício'} criado</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Comece criando sua primeira {defaultType === 'simulado' ? 'avaliação' : 'atividade'} para disponibilizar aos alunos.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <motion.div 
              key={exam.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    exam.status === 'published' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {exam.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{exam.title}</h3>
                  <p className="text-xs text-gray-500">{exam.subject}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => {
                      setCurrentExam(exam);
                      setIsEditing(true);
                    }}
                    className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteExam(exam.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 line-clamp-2 flex-1">{exam.description}</p>
              
              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckSquare size={14} />
                  <span className="text-[10px] font-bold">{exam.questions.length} Questões</span>
                </div>
                <span className="text-[10px] text-gray-400">{new Date(exam.createdAt?.seconds * 1000).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExercisesView({ user }: { user: User | null }) {
  const [exercises, setExercises] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState<Exam | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'exams'), 
      where('type', '==', 'exercicio'),
      where('status', '==', 'published')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExercises(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (activeExercise) {
    return <ExamTakingView user={user} exam={activeExercise} onCancel={() => setActiveExercise(null)} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exercícios de Fixação</h2>
          <p className="text-sm text-gray-500">Pratique seus conhecimentos com feedback imediato</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto">
            <BookOpen size={32} />
          </div>
          <p className="text-gray-500 font-medium">Nenhum exercício disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex) => (
            <motion.div 
              key={ex.id} 
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {ex.subject}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {ex.questions.length} Questões
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{ex.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-6">{ex.description}</p>
              <button 
                onClick={() => setActiveExercise(ex)}
                className="w-full py-3 bg-gray-50 text-gray-900 rounded-2xl font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Começar Exercício <ArrowRight size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentExamsView({ user }: { user: User | null }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingExam, setTakingExam] = useState<Exam | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    // Fetch published exams
    const examsQuery = query(collection(db, 'exams'), where('status', '==', 'published'));
    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExams(examsData);
    });

    // Fetch user submissions
    const submissionsQuery = query(collection(db, 'exam_submissions'), where('studentId', '==', user.uid));
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSubmission));
      setSubmissions(submissionsData);
      setLoading(false);
    });

    return () => {
      unsubscribeExams();
      unsubscribeSubmissions();
    };
  }, [user]);

  if (takingExam) {
    return <ExamTakingView exam={takingExam} user={user} onCancel={() => setTakingExam(null)} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Simulados Disponíveis</h2>
        <p className="text-sm text-gray-500">Avalie seus conhecimentos e receba feedback instantâneo</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => {
            const submission = submissions.find(s => s.resourceId === exam.id);
            return (
              <motion.div 
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900">{exam.title}</h3>
                    <p className="text-xs text-emerald-600 font-bold">{exam.subject}</p>
                  </div>
                  {submission && (
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Concluído
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 line-clamp-2 flex-1">{exam.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare size={14} />
                      <span className="text-[10px] font-bold">{exam.questions.length} Questões</span>
                    </div>
                  </div>
                  
                  {submission ? (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sua Nota</p>
                      <p className="text-lg font-bold text-emerald-600">{submission.score.toFixed(1)} / {submission.maxScore}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setTakingExam(exam)}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                    >
                      Iniciar Simulado
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {exams.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto">
                <BookOpen size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Nenhum simulado disponível</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Aguarde até que seus professores disponibilizem novas avaliações.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudyPlanView({ user }: { user: User | null }) {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'study_plans'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setStudyPlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StudyPlan);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const generatePlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch user submissions to analyze
      const q = query(collection(db, 'exam_submissions'), where('studentId', '==', user.uid));
      const snapshot = await getDocs(q);
      const submissions = snapshot.docs.map(doc => doc.data() as ExamSubmission);

      if (submissions.length === 0) {
        toast.error("Você precisa realizar pelo menos um simulado para gerar um plano de estudos.");
        setLoading(false);
        return;
      }

      // Analyze performance
      const competencyStats: { [key: string]: { correct: number, total: number } } = {};
      submissions.forEach(sub => {
        Object.entries(sub.competencyResults).forEach(([comp, stats]) => {
          if (!competencyStats[comp]) competencyStats[comp] = { correct: 0, total: 0 };
          competencyStats[comp].correct += stats.correct;
          competencyStats[comp].total += stats.total;
        });
      });

      const strengths: string[] = [];
      const weaknesses: string[] = [];
      Object.entries(competencyStats).forEach(([comp, stats]) => {
        const accuracy = stats.correct / stats.total;
        if (accuracy >= 0.7) strengths.push(comp);
        else if (accuracy < 0.5) weaknesses.push(comp);
      });

      // Use Gemini to generate recommendations
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Como um tutor educacional especialista no SAEP, gere um plano de estudos personalizado.
      O aluno tem as seguintes forças: ${strengths.join(', ')}.
      O aluno tem as seguintes fraquezas: ${weaknesses.join(', ')}.
      Gere 5 recomendações práticas de estudo para melhorar o desempenho nas fraquezas.
      Responda em JSON com o formato: { "recommendations": ["string", "string", ...] }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const aiData = JSON.parse(response.text || '{"recommendations": []}');

      const newPlan: Omit<StudyPlan, 'id'> = {
        userId: user.uid,
        strengths,
        weaknesses,
        recommendations: aiData.recommendations,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'study_plans'), newPlan);
      toast.success("Plano de estudos atualizado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar plano de estudos.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plano de Estudos Inteligente</h2>
          <p className="text-sm text-gray-500">Análise personalizada baseada no seu desempenho</p>
        </div>
        <button 
          onClick={generatePlan}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100"
        >
          <Zap size={18} /> Atualizar Plano
        </button>
      </div>

      {!studyPlan ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto">
            <Target size={32} />
          </div>
          <p className="text-gray-500 font-medium">Você ainda não tem um plano de estudos gerado.</p>
          <button onClick={generatePlan} className="text-emerald-600 font-bold hover:underline">Gerar meu primeiro plano agora</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-emerald-600" size={24} /> Recomendações de Estudo
              </h3>
              <div className="space-y-4">
                {studyPlan.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pontos Fortes</h4>
              <div className="flex flex-wrap gap-2">
                {studyPlan.strengths.map(s => (
                  <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">{s}</span>
                ))}
                {studyPlan.strengths.length === 0 && <span className="text-xs text-gray-400 italic">Nenhum identificado ainda</span>}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pontos de Atenção</h4>
              <div className="flex flex-wrap gap-2">
                {studyPlan.weaknesses.map(w => (
                  <span key={w} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold">{w}</span>
                ))}
                {studyPlan.weaknesses.length === 0 && <span className="text-xs text-gray-400 italic">Nenhum identificado ainda</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamTakingView({ exam, user, onCancel }: { exam: Exam, user: User | null, onCancel: () => void }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(exam.questions.length).fill(-1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [finalSubmission, setFinalSubmission] = useState<ExamSubmission | null>(null);

  const currentQuestion = exam.questions[currentQuestionIdx];

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.includes(-1)) {
      if (!window.confirm("Você ainda tem questões sem resposta. Deseja enviar assim mesmo?")) return;
    }

    setIsSubmitting(true);
    try {
      let score = 0;
      let maxScore = 0;
      const competencyResults: { [key: string]: { correct: number, total: number } } = {};

      exam.questions.forEach((q, idx) => {
        const isCorrect = answers[idx] === q.correctOption;
        const weight = q.weight || 1;
        maxScore += weight;
        if (isCorrect) score += weight;

        if (q.competency) {
          if (!competencyResults[q.competency]) {
            competencyResults[q.competency] = { correct: 0, total: 0 };
          }
          competencyResults[q.competency].total += weight;
          if (isCorrect) competencyResults[q.competency].correct += weight;
        }
      });

      const submission: Omit<ExamSubmission, 'id'> = {
        resourceId: exam.id,
        type: exam.type === 'exercicio' ? 'exercise' : 'exam',
        studentId: user?.uid || '',
        studentName: user?.displayName || 'Aluno',
        answers,
        score,
        maxScore,
        completedAt: serverTimestamp(),
        competencyResults
      };

      const docRef = await addDoc(collection(db, 'exam_submissions'), submission);
      setFinalSubmission({ id: docRef.id, ...submission } as ExamSubmission);
      setShowResult(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'exam_submissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showResult && finalSubmission) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Simulado Concluído!</h2>
            <p className="text-gray-500">Confira seu desempenho detalhado abaixo.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nota Final</p>
              <p className="text-3xl font-bold text-emerald-600">{finalSubmission.score.toFixed(1)}</p>
              <p className="text-xs text-gray-400">de {finalSubmission.maxScore} pontos</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Aproveitamento</p>
              <p className="text-3xl font-bold text-blue-600">{((finalSubmission.score / finalSubmission.maxScore) * 100).toFixed(0)}%</p>
              <p className="text-xs text-gray-400">acertos totais</p>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Desempenho por Competência</h3>
            <div className="space-y-3">
              {Object.entries(finalSubmission.competencyResults).map(([comp, res]) => (
                <div key={comp} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-700">{comp}</span>
                    <span className="text-emerald-600">{((res.correct / res.total) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${(res.correct / res.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={onCancel}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg"
          >
            Voltar para Simulados
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{exam.title}</h2>
            <p className="text-xs text-gray-500">Questão {currentQuestionIdx + 1} de {exam.questions.length}</p>
          </div>
        </div>
        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all" 
            style={{ width: `${((currentQuestionIdx + 1) / exam.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <motion.div 
        key={currentQuestionIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8"
      >
        <div className="space-y-4">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {currentQuestion.competency || 'Geral'}
          </span>
          <h3 className="text-xl font-medium text-gray-900 leading-relaxed">
            {currentQuestion.text}
          </h3>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={cn(
                "w-full p-4 text-left rounded-2xl border transition-all flex items-center gap-4 group",
                answers[currentQuestionIdx] === idx 
                  ? "bg-emerald-50 border-emerald-500 shadow-sm" 
                  : "bg-gray-50 border-gray-100 hover:border-emerald-200 hover:bg-white"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                answers[currentQuestionIdx] === idx 
                  ? "bg-emerald-500 text-white" 
                  : "bg-white text-gray-400 group-hover:text-emerald-600"
              )}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span className={cn(
                "text-sm font-medium",
                answers[currentQuestionIdx] === idx ? "text-emerald-900" : "text-gray-600"
              )}>
                {opt}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex items-center justify-between">
        <button
          disabled={currentQuestionIdx === 0}
          onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
          className="flex items-center gap-2 px-6 py-3 text-gray-500 font-bold hover:text-gray-900 disabled:opacity-30"
        >
          <ChevronLeft size={20} /> Anterior
        </button>
        
        {currentQuestionIdx === exam.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            Finalizar Simulado
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
            className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg shadow-gray-200"
          >
            Próxima <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

function AdminUsersView({ user }: { user: User | null }) {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'professor' | 'aluno'>('all');
  
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchesSearch = (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                            (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usersList, searchTerm, roleFilter]);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'aluno' | 'professor' | 'admin'>('aluno');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsersList(usersData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Initialize a secondary app to create the user without signing out the admin
      const { getApps, initializeApp, deleteApp } = await import('firebase/app');
      const existingApp = getApps().find(app => app.name === "SecondaryApp");
      const secondaryApp = existingApp || initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getSecondaryAuth(secondaryApp);
      
      try {
        const result = await createSecondaryUser(secondaryAuth, newEmail, newPassword);
        const newUser = result.user;

        // Save user profile in Firestore
        const userRef = doc(db, 'users', newUser.uid);
        await setDoc(userRef, {
          uid: newUser.uid,
          email: newUser.email,
          displayName: newName || newEmail.split('@')[0],
          photoURL: null,
          emailVerified: false,
          role: newRole,
          createdAt: new Date().toISOString()
        });

        toast.success(`Usuário ${newEmail} criado com sucesso!`);
        setNewEmail('');
        setNewPassword('');
        setNewName('');
        setNewRole('aluno');
      } finally {
        // Sign out and delete the secondary app
        await secondaryAuth.signOut();
        if (secondaryApp.name === "SecondaryApp") {
          await deleteApp(secondaryApp);
        }
      }
    } catch (err: any) {
      console.error("Error creating user", err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error("Este e-mail já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        toast.error("A senha deve ter pelo menos 6 caracteres.");
      } else {
        toast.error("Erro ao criar usuário. Verifique os dados.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita no banco de dados.")) return;
    
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success("Usuário removido com sucesso do banco de dados.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
          <p className="text-gray-500">Crie e visualize perfis de acesso ao sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-4">Novo Usuário</h3>
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                placeholder="Nome completo (opcional)"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Senha *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Perfil *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
              >
                <option value="aluno">Aluno</option>
                <option value="professor">Professor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {creating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserCheck size={18} />
              )}
              {creating ? "Criando..." : "Criar Usuário"}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold">Usuários Cadastrados</h3>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full sm:w-64"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="all">Todos os Perfis</option>
                <option value="admin">Administradores</option>
                <option value="professor">Professores</option>
                <option value="aluno">Alunos</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p>{searchTerm || roleFilter !== 'all' ? "Nenhum usuário corresponde aos filtros." : "Nenhum usuário encontrado."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 font-bold text-gray-400 uppercase tracking-wider text-xs">Nome / E-mail</th>
                    <th className="pb-3 font-bold text-gray-400 uppercase tracking-wider text-xs">Perfil</th>
                    <th className="pb-3 font-bold text-gray-400 uppercase tracking-wider text-xs">Data de Cadastro</th>
                    <th className="pb-3 font-bold text-gray-400 uppercase tracking-wider text-xs text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{u.displayName || 'Sem nome'}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="py-3">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          u.role === 'admin' ? "bg-purple-100 text-purple-700" :
                          u.role === 'professor' ? "bg-blue-100 text-blue-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {u.role === 'admin' ? 'Admin / Professor' : u.role}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 text-right">
                        {u.uid !== user?.uid && (
                          <button 
                            onClick={() => handleDeleteUser(u.uid)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Excluir Usuário"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
              "flex w-full flex-col",
              msg.role === 'user' ? "items-end" : "items-start"
            )}
          >
            <div className={cn(
              "max-w-[85%] px-4 py-3 text-sm shadow-sm transition-all hover:shadow-md",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-2xl rounded-tr-none" 
                : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none"
            )}>
              <div className="markdown-body">
                <Markdown>{msg.text}</Markdown>
              </div>
              <div className={cn(
                "flex items-center gap-1 mt-1 opacity-60 text-[9px]",
                msg.role === 'user' ? "justify-end text-emerald-100" : "justify-start text-gray-400"
              )}>
                {msg.role === 'model' && <div className="w-1 h-1 bg-emerald-400 rounded-full" />}
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-3">
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
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar perfil.');
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
              {profile && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  profile.role === 'admin' ? "bg-purple-100 text-purple-700" :
                  profile.role === 'professor' ? "bg-blue-100 text-blue-700" :
                  "bg-emerald-100 text-emerald-700"
                )}>
                  {profile.role === 'admin' ? 'Admin / Professor' : profile.role}
                </span>
              )}
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

function AlunoView({ result, onUpdateResult, diagnosticId, userProfile }: { result: DiagnosticResult | null, onUpdateResult: (newResult: DiagnosticResult) => void, diagnosticId: string | null, userProfile: UserProfile | null }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'Todos' | 'Forte' | 'Atenção' | 'Crítico'>('Todos');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [editingComp, setEditingComp] = useState<string | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [editingPrivateNote, setEditingPrivateNote] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [privateNoteValue, setPrivateNoteValue] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = async (comp: any) => {
    if (suggestions[comp.competencia]) return;
    setLoadingSuggestions(prev => ({ ...prev, [comp.competencia]: true }));
    try {
      const newSuggestions = await generateSuggestions(comp.conhecimentos_fracos, comp.recomendacoes);
      setSuggestions(prev => ({ ...prev, [comp.competencia]: newSuggestions }));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar sugestões.");
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [comp.competencia]: false }));
    }
  };

  const isProfessor = userProfile?.role === 'professor' || userProfile?.role === 'admin';

  const exportToPDF = async () => {
    if (!reportRef.current || !result) return;
    
    setIsExporting(true);
    toast.info('Preparando relatório PDF...');
    
    try {
      // Temporarily hide elements that shouldn't be in PDF (like edit buttons)
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        ignoreElements: (element) => {
          return element.tagName === 'BUTTON' && !element.classList.contains('pdf-keep');
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_${result.aluno.replace(/\s+/g, '_')}.pdf`);
      toast.success('Relatório exportado com sucesso!');
    } catch (err) {
      console.error('PDF Export Error', err);
      toast.error('Erro ao gerar o PDF do relatório.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCompetencias = useMemo(() => {
    if (!result) return [];
    let comps = result.diagnostico_por_competencia;
    if (filter !== 'Todos') {
      comps = comps.filter(c => c.nivel === filter);
    }
    
    if (sortOrder !== 'none') {
      const levelValues = { 'Forte': 3, 'Atenção': 2, 'Crítico': 1 };
      comps = [...comps].sort((a, b) => {
        const valA = levelValues[a.nivel as keyof typeof levelValues] || 0;
        const valB = levelValues[b.nivel as keyof typeof levelValues] || 0;
        if (valA !== valB) {
          return sortOrder === 'desc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'desc' ? a.acuracia_ponderada - b.acuracia_ponderada : b.acuracia_ponderada - a.acuracia_ponderada;
      });
    }
    return comps;
  }, [result, filter, sortOrder]);

  const handleSaveEdit = async (competenciaName: string, type: 'recommendation' | 'privateNote' | 'professorFeedback', value?: string) => {
    if (!result) return;
    const newCompetencias = [...result.diagnostico_por_competencia];
    const idx = newCompetencias.findIndex(c => c.competencia === competenciaName);
    if (idx !== -1) {
      if (type === 'recommendation') {
        newCompetencias[idx] = { ...newCompetencias[idx], recomendacoes: value !== undefined ? value : editValue };
      } else if (type === 'professorFeedback') {
        newCompetencias[idx] = { ...newCompetencias[idx], professor_feedback: value !== undefined ? value : feedbackValue };
      } else {
        newCompetencias[idx] = { ...newCompetencias[idx], private_notes: value !== undefined ? value : privateNoteValue };
      }
      
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
    setEditingFeedback(null);
    setEditingPrivateNote(null);
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
          onClick={() => navigate(diagnosticId ? `/dashboard/${diagnosticId}` : '/dashboard')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Voltar ao Dashboard
        </button>

        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
        >
          {isExporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
          Exportar Relatório PDF
        </button>
      </div>

      <div ref={reportRef} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
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

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm flex flex-col md:w-1/2">
            <h3 className="text-lg font-bold text-emerald-900 mb-2">Mensagem para o Aluno</h3>
            <p className="text-lg leading-relaxed text-emerald-800 font-medium italic">
              "{result.mensagem_para_o_aluno}"
            </p>
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
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filtrar por Nível:</span>
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

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ordenar:</span>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'none' : 'asc')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    sortOrder === 'asc' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                  title="Ordenar Crescente"
                >
                  <ChevronRight size={16} className="-rotate-90" />
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'none' : 'desc')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    sortOrder === 'desc' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                  title="Ordenar Decrescente"
                >
                  <ChevronRight size={16} className="rotate-90" />
                </button>
              </div>
            </div>
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
                  className={cn(
                    "group p-6 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all",
                    comp.nivel === 'Crítico' ? "border-red-400 ring-2 ring-red-100 bg-red-50/50" : "border-gray-100 hover:border-emerald-100"
                  )}
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
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{comp.competencia}</h4>
                          {comp.nivel === 'Crítico' && (
                            <motion.div 
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-bold shadow-sm"
                            >
                              <AlertCircle size={12} />
                              AÇÃO REQUERIDA
                            </motion.div>
                          )}
                        </div>
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
                            {isProfessor && (
                              editingComp !== comp.competencia ? (
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
                                    onClick={() => handleSaveEdit(comp.competencia, 'recommendation')}
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
                              )
                            )}
                          </div>
                          {comp.nivel === 'Crítico' && (
                            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-xs font-bold text-red-800 uppercase tracking-wider">Sugestões de Estudo</h5>
                                {!suggestions[comp.competencia] && !loadingSuggestions[comp.competencia] && (
                                  <button onClick={() => fetchSuggestions(comp)} className="text-[10px] font-bold text-red-600 hover:underline">
                                    Gerar sugestões
                                  </button>
                                )}
                              </div>
                              {loadingSuggestions[comp.competencia] ? (
                                <Loader2 className="animate-spin text-red-600" size={16} />
                              ) : suggestions[comp.competencia] ? (
                                <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                                  {suggestions[comp.competencia].map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                              ) : null}
                            </div>
                          )}
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

                          {/* Professor Feedback Section */}
                          {(comp.nivel === 'Crítico' || comp.acertos < comp.total_questoes) && (
                            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <MessageSquare size={14} className="text-emerald-500" />
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Feedback Personalizado do Professor</p>
                                </div>
                                {isProfessor && (
                                  editingFeedback !== comp.competencia ? (
                                    <button 
                                      onClick={() => {
                                        setEditingFeedback(comp.competencia);
                                        setFeedbackValue(comp.professor_feedback || '');
                                      }}
                                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                    >
                                      <Pencil size={10} />
                                      {comp.professor_feedback ? 'Editar Feedback' : 'Adicionar Feedback'}
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => handleSaveEdit(comp.competencia, 'professorFeedback')}
                                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                                      >
                                        Salvar
                                      </button>
                                      <button 
                                        onClick={() => setEditingFeedback(null)}
                                        className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>

                              {editingFeedback === comp.competencia ? (
                                <textarea
                                  value={feedbackValue}
                                  onChange={(e) => setFeedbackValue(e.target.value)}
                                  className="w-full p-3 text-sm text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-lg focus:ring-1 focus:ring-emerald-400 outline-none min-h-[80px]"
                                  placeholder="Insira uma nota ou explicação personalizada para o aluno..."
                                  autoFocus
                                />
                              ) : comp.professor_feedback ? (
                                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                  <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                                    {comp.professor_feedback}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">Nenhum feedback personalizado inserido ainda.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Private Notes Section */}
                      {isProfessor && (
                        <div className="pt-4 mt-4 border-t border-gray-50 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Settings size={14} className="text-gray-400" />
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notas Privadas (Instrutor)</p>
                            </div>
                            {editingPrivateNote === comp.competencia ? (
                              <button 
                                onClick={() => handleSaveEdit(comp.competencia, 'privateNote', privateNoteValue)}
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                              >
                                Salvar
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setEditingPrivateNote(comp.competencia);
                                  setPrivateNoteValue(comp.private_notes || '');
                                }}
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                              >
                                <Pencil size={10} />
                                Editar
                              </button>
                            )}
                          </div>
                          
                          {editingPrivateNote === comp.competencia ? (
                            <textarea
                              value={privateNoteValue}
                              onChange={(e) => setPrivateNoteValue(e.target.value)}
                              className="w-full p-3 text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg focus:ring-1 focus:ring-blue-400 outline-none min-h-[80px]"
                              autoFocus
                            />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-gray-200 pl-4">
                              {comp.private_notes || 'Nenhuma nota privada.'}
                            </p>
                          )}
                        </div>
                      )}
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
        <Toaster position="top-right" richColors />
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [evolutionFilter, setEvolutionFilter] = useState<'7d' | '30d' | 'all'>('all');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  useEffect(() => {
    if (!user) return;
    
    const assignExams = async () => {
      try {
        const examsSnapshot = await getDocs(collection(db, 'exams'));
        const studentExamsSnapshot = await getDocs(query(collection(db, 'student_exams'), where('studentId', '==', user.uid)));
        
        const assignedExamIds = studentExamsSnapshot.docs.map(doc => doc.data().examId);
        
        for (const examDoc of examsSnapshot.docs) {
          if (!assignedExamIds.includes(examDoc.id)) {
            await addDoc(collection(db, 'student_exams'), {
              studentId: user.uid,
              examId: examDoc.id,
              status: 'pending',
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (err) {
        console.error("Error assigning exams:", err);
      }
    };
    assignExams();
  }, [user]);

  const planRef = useRef<HTMLDivElement>(null);

  const navItems = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === 'aluno') {
      return [
        { id: 'student-dashboard', label: 'Meu Painel', icon: LayoutDashboard, path: '/student-dashboard' },
        { id: 'student-exams', label: 'Simulados', icon: BookOpen, path: '/student-exams' },
        { id: 'exercises', label: 'Exercícios', icon: CheckSquare, path: '/exercises' },
        { id: 'study-plan', label: 'Plano IA', icon: Zap, path: '/study-plan' },
        { id: 'history', label: 'Histórico', icon: History, path: '/history' },
        { id: 'chat', label: 'Assistente IA', icon: MessageSquare, path: '/chat' },
        { id: 'plan', label: 'Meu Plano', icon: Calendar, disabled: !result, path: '/plan' },
        { id: 'profile', label: 'Perfil', icon: UserIcon, path: '/profile' },
      ];
    }
    return [
      { id: 'reports', label: 'Relatórios', icon: BarChart3, path: '/reports' },
      { id: 'input', label: 'Entrada', icon: Upload, path: '/input' },
      { id: 'history', label: 'Histórico', icon: History, path: '/history' },
      { id: 'questions-bank', label: 'Banco de Questões', icon: Database, path: '/questions-bank' },
      { id: 'exams-management', label: 'Simulados', icon: BookOpen, path: '/exams' },
      { id: 'exercises-management', label: 'Exercícios', icon: CheckSquare, path: '/exercises-management' },
      { id: 'chat', label: 'Chat IA', icon: MessageSquare, path: '/chat' },
      { id: 'admin-users', label: 'Gestão', icon: Users, path: '/admin-users' },
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, disabled: !result, path: result && currentDiagnosticId ? `/dashboard/${currentDiagnosticId}` : '/dashboard' },
      { id: 'aluno', label: 'Detalhes', icon: UserCheck, disabled: !result, path: result && currentDiagnosticId ? `/aluno/${currentDiagnosticId}` : '/aluno' },
      { id: 'plan', label: 'Plano', icon: Calendar, disabled: !result, path: '/plan' },
      { id: 'profile', label: 'Perfil', icon: UserIcon, path: '/profile' },
    ];
  }, [userProfile, result, currentDiagnosticId]);

  const exportPlanToPDF = async () => {
    if (!planRef.current || !result) return;
    
    setLoading(true);
    toast.info('Preparando PDF...');
    
    try {
      const canvas = await html2canvas(planRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F9FAFB'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Plano_Estudos_${result.aluno.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      console.error('PDF Error', err);
      toast.error('Erro ao gerar PDF.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const parts = location.pathname.split('/');
    const view = parts[1];
    const id = parts[2];

    if ((view === 'aluno' || view === 'dashboard') && id && id !== currentDiagnosticId) {
      const fetchDiagnostic = async () => {
        try {
          const docRef = doc(db, 'diagnostics', id);
          const docSnap = await getDocFromServer(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Authorization check for students
            if (userProfile?.role === 'aluno' && data.userId !== user?.uid) {
              toast.error("Você não tem permissão para acessar este diagnóstico.");
              navigate('/student-dashboard');
              return;
            }

            setResult(data.result);
            setCurrentDiagnosticId(id);
          }
        } catch (err) {
          console.error("Error loading diagnostic from URL", err);
        }
      };
      fetchDiagnostic();
    }
  }, [location.pathname, currentDiagnosticId]);

  const activeTab = useMemo(() => {
    const path = location.pathname.split('/')[1] || 'input';
    return path as 'input' | 'dashboard' | 'plan' | 'json' | 'history' | 'tasks' | 'chat' | 'profile' | 'aluno' | 'admin-users' | 'student-dashboard' | 'student-exams';
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
    if (!user || !userProfile) {
      setHistory([]);
      return;
    }

    const path = 'diagnostics';
    let q;
    
    if (userProfile.role === 'professor' || userProfile.role === 'admin') {
      q = query(
        collection(db, path),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, path),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

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
  }, [user, userProfile]);

  // Profile Listener
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // Ensure Djalma is always an admin in the frontend, even if the DB hasn't updated yet
        if (user.email === 'djalmabatistajunior@gmail.com') {
          data.role = 'admin';
        }
        setUserProfile(data);
      } else if (user.email === 'djalmabatistajunior@gmail.com') {
        // Fallback for Djalma if profile doesn't exist yet
        setUserProfile({
          uid: user.uid,
          email: user.email,
          role: 'admin',
          displayName: user.displayName || 'Djalma'
        } as UserProfile);
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
    setIsAuthenticating(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Save/Update user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDocFromServer(userRef);
      
      if (!userSnap.exists()) {
        const role = user.email === 'djalmabatistajunior@gmail.com' ? 'admin' : 'aluno';
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          role: role,
          createdAt: new Date().toISOString()
        });
      } else {
        // Just update last login or basic info, keep existing role
        await updateDoc(userRef, {
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          lastLoginAt: new Date().toISOString()
        });
      }
      toast.success('Login realizado com sucesso!');

    } catch (err) {
      console.error("Login Error", err);
      setError("Falha ao entrar com Google.");
      toast.error("Falha ao entrar com Google.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthenticating(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login realizado com sucesso!');
    } catch (err: any) {
      console.error("Email Login Error", err);
      setError("Email ou senha inválidos.");
      toast.error("Email ou senha inválidos.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (email !== 'djalmabatistajunior@gmail.com') {
      setError("Alunos devem utilizar o login com Google abaixo.");
      toast.error("Apenas o administrador pode se registrar por aqui.");
      return;
    }

    setIsAuthenticating(true);
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
      const role = user.email === 'djalmabatistajunior@gmail.com' ? 'admin' : 'aluno';
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.email?.split('@')[0],
        photoURL: null,
        emailVerified: false,
        role: role,
        createdAt: new Date().toISOString()
      });
      toast.success('Conta criada! Verifique seu e-mail.');

    } catch (err: any) {
      console.error("Registration Error", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este e-mail já está em uso.");
        toast.error("Este e-mail já está em uso.");
      } else {
        setError("Falha ao criar conta. Verifique os dados.");
        toast.error("Falha ao criar conta.");
      }
    } finally {
      setIsAuthenticating(false);
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
        toast.success('E-mail verificado com sucesso!');
      } else {
        setError("E-mail ainda não verificado. Verifique sua caixa de entrada.");
        toast.error("E-mail ainda não verificado.");
      }
    } catch (err) {
      console.error("Status Check Error", err);
      toast.error("Erro ao verificar status.");
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
      toast.success("Link de verificação reenviado!");
    } catch (err) {
      console.error("Resend Error", err);
      setError("Falha ao reenviar link.");
      toast.error("Falha ao reenviar link.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setResult(null);
      setData([]);
      navigate('/input');
      toast.success('Desconectado com sucesso!');
    } catch (err) {
      console.error("Logout Error", err);
      toast.error('Erro ao desconectar.');
    }
  };

  const deleteDiagnostic = async (id: string) => {
    const path = `diagnostics/${id}`;
    try {
      await deleteDoc(doc(db, 'diagnostics', id));
      toast.success('Diagnóstico excluído com sucesso!');
    } catch (err) {
      toast.error('Erro ao excluir diagnóstico.');
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          setData(results.data);
          setError(null);
          toast.success('Arquivo CSV carregado com sucesso!');
          setIsProcessingFile(false);
        },
        error: (err) => {
          setError("Erro ao processar CSV: " + err.message);
          toast.error("Erro ao processar CSV.");
          setIsProcessingFile(false);
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
          toast.success('Planilha carregada com sucesso!');
        } catch (err: any) {
          setError("Erro ao processar planilha: " + err.message);
          toast.error("Erro ao processar planilha.");
        } finally {
          setIsProcessingFile(false);
        }
      };
      reader.onerror = () => {
        setIsProcessingFile(false);
      };
      reader.readAsBinaryString(file);
    } else {
      setError("Formato de arquivo não suportado. Use CSV ou Excel.");
      toast.error("Formato de arquivo não suportado.");
      setIsProcessingFile(false);
    }
  };

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const json = JSON.parse(e.target.value);
      setData(Array.isArray(json) ? json : [json]);
      setError(null);
      toast.success('Dados colados com sucesso!');
    } catch (err) {
      // If not JSON, try to parse as CSV-like text if needed, but let's stick to JSON for paste
      setError("Formato JSON inválido para colagem.");
      toast.error("Formato JSON inválido.");
    }
  };

  const processDiagnostic = async () => {
    if (data.length === 0) {
      setError("Nenhum dado para processar.");
      toast.error("Nenhum dado para processar.");
      return;
    }

    if (!user) {
      setError("Você precisa estar logado para gerar diagnósticos.");
      toast.error("Você precisa estar logado.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await generateDiagnostic(data, selectedModel);
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
        toast.success('Diagnóstico gerado com sucesso!');
        navigate(`/dashboard/${docRef.id}`);
      } catch (err) {
        toast.error('Erro ao salvar diagnóstico.');
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    } catch (err) {
      toast.error('Erro ao gerar diagnóstico. Verifique sua chave API e os dados.');
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
                className="bg-amber-100 px-2 py-1 rounded hover:bg-amber-200 disabled:opacity-50 flex items-center gap-1"
              >
                {isVerifying && <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />}
                {isVerifying ? 'Verificando...' : 'Já verifiquei'}
              </button>
            </div>
          </div>
        )}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">EduDiagnóstico SAEP</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Especialista em Avaliação</p>
            </div>
          </div>

        {user && userProfile && (
          <nav className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {navItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && navigate(tab.path)}
                disabled={tab.disabled}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : tab.disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-600 hover:text-emerald-600 hover:bg-white/50"
                )}
              >
                <tab.icon size={14} />
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

    {/* Mobile Menu */}
    <AnimatePresence>
      {isMobileMenuOpen && user && userProfile && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden bg-white border-b border-gray-200 overflow-hidden"
        >
          <div className="p-4 space-y-1">
            {navItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (!tab.disabled) {
                    navigate(tab.path);
                    setIsMobileMenuOpen(false);
                  }
                }}
                disabled={tab.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id 
                    ? "bg-emerald-50 text-emerald-700" 
                    : tab.disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      <main className="max-w-7xl mx-auto p-6 relative">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-600 animate-pulse" size={24} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Gerando Diagnóstico</h3>
                <p className="text-sm text-gray-500">A inteligência artificial está analisando os dados e criando um plano de estudos personalizado...</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full animate-progress w-full"></div>
              </div>
            </div>
          </div>
        )}
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
                  disabled={isAuthenticating}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  {isAuthenticating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {isAuthenticating ? "Aguarde..." : (authMode === 'login' ? 'Entrar' : 'Criar Conta')}
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
                disabled={isAuthenticating}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                {isAuthenticating ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {isAuthenticating ? "Conectando..." : "Google"}
              </button>

              <div className="text-center">
                <p className="text-xs text-emerald-600 font-medium mb-4 bg-emerald-50 py-2 rounded-lg">
                  👨‍🎓 Alunos: Por favor, utilizem o login com Google.
                </p>
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-sm font-bold text-gray-500 hover:text-emerald-700"
                >
                  {authMode === 'login' ? 'Professor? Não tem uma conta? Cadastre-se' : 'Professor? Já tem uma conta? Entre'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <Navigate to={
                  userProfile?.role === 'aluno' ? "/student-dashboard" : (result ? "/dashboard" : "/input")
                } replace />
              } />
              <Route path="/exams" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ExamsManagementView user={user} defaultType="simulado" /></ProtectedRoute>} />
              <Route path="/exercises-management" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ExamsManagementView user={user} defaultType="exercicio" /></ProtectedRoute>} />
              <Route path="/questions-bank" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><QuestionsBankView user={user} /></ProtectedRoute>} />
              <Route path="/student-exams" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><StudentExamsView user={user} /></ProtectedRoute>} />
              <Route path="/exercises" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><ExercisesView user={user} /></ProtectedRoute>} />
              <Route path="/study-plan" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><StudyPlanView user={user} /></ProtectedRoute>} />
            <Route path="/input" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
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
                            disabled={isProcessingFile}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                          />
                          <div className={`border-2 border-dashed border-gray-200 rounded-xl p-8 text-center transition-colors bg-gray-50 ${isProcessingFile ? 'opacity-50' : 'group-hover:border-emerald-400'}`}>
                            {isProcessingFile ? (
                              <div className="flex flex-col items-center justify-center">
                                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
                                <p className="text-sm text-gray-600">Processando arquivo...</p>
                              </div>
                            ) : (
                              <>
                                <Upload className="mx-auto text-gray-400 mb-3 group-hover:text-emerald-500 transition-colors" size={32} />
                                <p className="text-sm text-gray-600">
                                  {data.length > 0 ? `${data.length} linhas carregadas` : "Clique ou arraste o arquivo CSV ou Excel aqui"}
                                </p>
                              </>
                            )}
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
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 block">Modelo Gemini</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                        >
                          <option value="gemini-3-flash-preview">Gemini 3 Flash (Rápido)</option>
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Avançado)</option>
                          <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (Econômico)</option>
                          <option value="gemini-flash-latest">Gemini Flash Latest</option>
                        </select>
                      </div>
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
              </ProtectedRoute>
            } />

            <Route path="/history" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin', 'aluno']}>
                <HistoryView 
                  history={history} 
                  deleteDiagnostic={deleteDiagnostic} 
                  setResult={setResult} 
                  navigate={navigate} 
                  setCurrentDiagnosticId={setCurrentDiagnosticId}
                  userProfile={userProfile}
                />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <ReportsView history={history} />
              </ProtectedRoute>
            } />

            <Route path="/tasks" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <TasksView user={user} />
              </ProtectedRoute>
            } />

            <Route path="/chat" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin', 'aluno']}>
                <ChatView user={user} diagnostic={result} />
              </ProtectedRoute>
            } />

            <Route path="/student-dashboard" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}>
                <StudentDashboardView user={user} />
              </ProtectedRoute>
            } />

            <Route path="/exams-management" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <ExamsManagementView user={user} />
              </ProtectedRoute>
            } />

            <Route path="/student-exams" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}>
                <StudentExamsView user={user} />
              </ProtectedRoute>
            } />

            <Route path="/admin-users" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <AdminUsersView user={user} />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin', 'aluno']}>
                <ProfileView user={user} profile={userProfile} />
              </ProtectedRoute>
            } />

            <Route path="/aluno/:id?" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin', 'aluno']}>
                <AlunoView 
                  result={result} 
                  onUpdateResult={setResult} 
                  diagnosticId={currentDiagnosticId} 
                  userProfile={userProfile}
                />
              </ProtectedRoute>
            } />

            <Route path="/dashboard/:id?" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin', 'aluno']}>
                {result ? (
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
                          onClick={() => navigate(currentDiagnosticId ? `/aluno/${currentDiagnosticId}` : '/aluno')}
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

                    {/* Ações Sugeridas para Instrutor (moved from below) */}
                    {(userProfile?.role === 'professor' || userProfile?.role === 'admin') && (
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
                    )}

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
                  </div>

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
              ) : <Navigate to={userProfile?.role === 'aluno' ? "/student-dashboard" : "/input"} />
              }
              </ProtectedRoute>
            } />

            <Route path="/plan" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin', 'aluno']}>
                {result ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl mx-auto space-y-8"
                  >
                    <div ref={planRef} className="space-y-8 p-4 bg-gray-50 rounded-2xl">
                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold">Plano de Estudos - 7 Dias</h2>
                        <p className="text-gray-500">Cronograma intensivo baseado nas competências em nível crítico.</p>
                        <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">{result.aluno}</p>
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
                    </div>

                    <div className="flex justify-center gap-4 pt-8">
                      <button 
                        onClick={exportPlanToPDF}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Baixar PDF
                      </button>
                      <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                        <Calendar size={18} /> Adicionar ao Google Agenda
                      </button>
                    </div>
                  </motion.div>
                ) : <Navigate to="/input" />}
              </ProtectedRoute>
            } />

            <Route path="/json" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                {result ? (
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
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                          toast.success('JSON copiado para a área de transferência!');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all"
                      >
                        <Copy size={16} /> Copiar JSON
                      </button>
                    </div>
                    <div className="bg-[#1A1A1A] text-emerald-400 p-8 rounded-2xl font-mono text-xs overflow-auto max-h-[600px] shadow-2xl border border-white/10">
                      <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  </motion.div>
                ) : <Navigate to="/input" />}
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          </AnimatePresence>
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
