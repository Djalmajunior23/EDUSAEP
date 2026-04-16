import { SmartContentGenerator } from './components/common/SmartContentGenerator';
import { SAEPItemGenerator } from './components/admin/SAEPItemGenerator';
import { DiscursiveQuestionGenerator } from './components/professor/DiscursiveQuestionGenerator';
import { LearningSituationGenerator } from './components/professor/LearningSituationGenerator';
import { TeacherLearningSituationsView } from './components/professor/TeacherLearningSituationsView';
import { TeacherAIAssistantPanel } from './components/professor/TeacherAIAssistantPanel';
import { ClassObservatoryView } from './components/professor/ClassObservatoryView';
import { StudentLearningSituationsView } from './components/student/StudentLearningSituationsView';
import { StudentLearningChatbot } from './components/student/StudentLearningChatbot';
import { StudentGamificationView } from './components/student/StudentGamificationView';
import { StudentLearningPathView } from './components/student/StudentLearningPathView';
import { StudentImportUploader } from './components/import/StudentImportUploader';
import { ExerciseImportUploader } from './components/import/ExerciseImportUploader';
import { TeacherActivitiesManager } from './components/professor/TeacherActivitiesManager';
import { TeacherRubricsManager } from './components/professor/TeacherRubricsManager';
import { QuestionsBankView } from './components/professor/QuestionsBankView';
import { ExamsManagementView } from './components/professor/ExamsManagementView';
import { CalendarView } from './components/calendar/CalendarView';
import { CommunicationCenter } from './components/communication/CommunicationCenter';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { StudentActivitiesManager } from './components/student/StudentActivitiesManager';
import { AdminAIProviderManager } from './components/admin/AdminAIProviderManager';
import { ClassHealthDashboard } from './components/analytics/ClassHealthDashboard';
import { PedagogicalRulesManager } from './components/admin/PedagogicalRulesManager';
import { StudentJourneyTimeline } from './components/student/StudentJourneyTimeline';
import { InstitutionalTemplateManager } from './components/admin/InstitutionalTemplateManager';
import { FeatureFlagManager } from './components/admin/FeatureFlagManager';
import { PedagogicalGoalsTracker } from './components/student/PedagogicalGoalsTracker';
import { CorrectionPlanView } from './components/student/CorrectionPlanView';
import { BIDashboardView } from './components/dashboard/BIDashboardView';
import { DataImportView } from './components/admin/DataImportView';
import { ClassesManagementView } from './components/admin/ClassesManagementView';
import { DisciplinesManagementView } from './components/admin/DisciplinesManagementView';
import { LessonManagementView } from './components/professor/LessonManagementView';
import { getClassCompetencyAverages } from './services/dashboardService';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
// Initialize Gemini
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type AIProvider = 'gemini' | 'openai' | 'deepseek';

import { 
  Upload, 
  FileText, 
  BarChart3, 
  BookOpen, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
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
  Save,
  Lock,
  Sun,
  Moon,
  MessageSquare,
  Send,
  Loader2,
  User as UserIcon,
  Search,
  Filter,
  ChevronLeft,
  ExternalLink,
  Users,
  Square,
  X,
  Check,
  XCircle,
  HelpCircle,
  Menu,
  Database,
  Zap,
  RefreshCw,
  ArrowRight,
  Target,
  Info,
  Trophy,
  TrendingUp,
  TrendingDown,
  Telescope,
  Sparkles,
  Mail,
  RotateCcw,
  Star,
  Brain,
  BrainCircuit,
  ShieldCheck,
  Hexagon,
  Archive,
  ArchiveRestore,
  BarChart2,
  Layout,
  Activity,
  Map as MapIcon,
  Library,
  Shield
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend,
  LabelList
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { GoogleGenAI, Type } from "@google/genai";
import { generateDiagnostic, generateSuggestions, DiagnosticResult, suggestCompetencies, generateRecoveryPlan, analyzeCognitiveErrors, parseQuestionsFromText, safeParseJson, generateContentWrapper, DEFAULT_CONFIG } from './services/geminiService';
import { n8nEvents, triggerN8NAlert, testWebhook } from './services/n8nService';
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
import { ExternalFormManager } from './modules/simulados/components/ExternalFormManager';
import { ImportInconsistencyManager } from './modules/simulados/components/ImportInconsistencyManager';
import { SimuladoForm } from './modules/simulados/types';
import { simuladoService } from './modules/simulados/services/simuladoService';
import { pdfExportService } from './modules/simulados/services/pdfExportService';
import { NotificationBell } from './components/notifications/NotificationBell';
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword as createSecondaryUser } from 'firebase/auth';
import { auth, db, googleProvider, firebaseConfig } from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail
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
  getDoc,
  getDocFromServer,
  getDocs,
  updateDoc,
  setDoc,
  writeBatch,
  limit,
  Timestamp
} from 'firebase/firestore';

import { ExternalFormsView } from './components/professor/ExternalFormsView';
import { SocraticTutor } from './components/student/SocraticTutor';
import { StudentInsights } from './components/student/StudentInsights';
import { StudentQuickActions } from './components/student/StudentQuickActions';
import { AdaptiveExam } from './components/student/AdaptiveExam';
import { Gamification } from './components/student/Gamification';
import { ProfessorInsights } from './components/professor/ProfessorInsights';
import { CognitiveErrorAnalysisView } from './components/professor/CognitiveErrorAnalysisView';
import { ConsolidatedReportView } from './components/professor/ConsolidatedReportView';
import { QuestionOptimizerView } from './components/professor/QuestionOptimizerView';
import { AIGovernanceView } from './components/admin/AIGovernanceView';
import { TRIDashboardView } from './components/professor/TRIDashboardView';
import { handleFirestoreError, OperationType } from './services/errorService';


import { AdvancedDashboard } from './components/professor/AdvancedDashboard';
import { generateStudentRecommendation, getLatestRecommendation, Recommendation } from './services/recommendationService';
import { exportExamToGoogleForms, exportQuestionsToGoogleForms } from './services/googleFormsService';

import { GoogleFormsExportView } from './components/professor/GoogleFormsExportView';
import { RecommendationsView } from './components/student/RecommendationsView';
import { ActivityManager } from './components/professor/ActivityManager';
import { ActivityList } from './components/student/ActivityList';
import { HeatmapLearning } from './components/shared/HeatmapLearning';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Skeleton Component
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 dark:bg-gray-800 rounded-md", className)} />
  );
}

// Dark Mode Toggle Component
function DarkModeToggle({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
      title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

// AI Provider Toggle Component
// AI Provider Toggle Component
function AIProviderToggle({ provider, onProviderChange }: { provider: AIProvider, onProviderChange: (p: AIProvider) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectProvider = (p: AIProvider) => {
    onProviderChange(p);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-bold text-xs shadow-sm"
        title="Alternar Provedor de IA"
      >
        {provider === 'gemini' && <><Sparkles size={16} className="text-blue-500" /> <span>Gemini</span></>}
        {provider === 'openai' && <><Brain size={16} className="text-emerald-500" /> <span>ChatGPT</span></>}
        {provider === 'deepseek' && <><Hexagon size={16} className="text-indigo-500" /> <span>DeepSeek</span></>}
        <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                <button
                  onClick={() => selectProvider('gemini')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                    provider === 'gemini' ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Sparkles size={16} className="text-blue-500" />
                  Gemini (Google)
                </button>
                <button
                  onClick={() => selectProvider('openai')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                    provider === 'openai' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Brain size={16} className="text-emerald-500" />
                  ChatGPT (OpenAI)
                </button>
                <button
                  onClick={() => selectProvider('deepseek')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                    provider === 'deepseek' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <Hexagon size={16} className="text-indigo-500" />
                  DeepSeek (R1)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Protected Route Component removed, using from components/ProtectedRoute.tsx


export interface UserProfile {
  uid: string;
  email: string;
  matricula?: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role: 'professor' | 'aluno' | 'admin';
  xp?: number;
  level?: number;
  badges?: string[];
  gamificationEnabled?: boolean;
  createdAt: string;
  settings?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    webhookUrl?: string;
  };
  preferences?: {
    defaultGrade: string;
    language: string;
  };
}

export interface Discipline {
  id: string;
  name: string;
  code: string;
  area: string;
  status: 'active' | 'inactive';
  createdAt?: any;
}

export interface Question {
  id?: string;
  questionUid: string;
  competenciaId: string;
  competenciaNome: string;
  temaId: string;
  temaNome: string;
  dificuldade: string;
  bloom: string;
  perfilGeracao: string;
  tipoQuestao: string;
  enunciado: string;
  alternativas: Array<{ id: string; texto: string }>;
  respostaCorreta: string;
  comentarioGabarito: string;
  justificativasAlternativas: Record<string, string>;
  contextoHash: string;
  tags: string[];
  status: string;
  revisadaPorProfessor: boolean;
  usoTotal: number;
  ultimaUtilizacao?: any;
  origem: string;
  criadoEm: any;
  atualizadoEm: any;
  createdBy?: string;
  createdAt?: any;
  note?: string;
  feedback?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  questions: Question[];
  createdBy: string;
  createdAt: any;
  status: 'draft' | 'published' | 'active' | 'closed';
  type: 'simulado' | 'exercicio';
  applicationMode?: 'internal' | 'external' | 'hybrid';
  startDate?: any;
  endDate?: any;
  maxAttempts?: number;
  correctionPolicy?: 'highest_score' | 'last_attempt' | 'first_attempt';
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
  detailedWeaknesses?: string[];
  priorityTopics: Array<{
    topic: string;
    reason: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    details?: string;
  }>;
  recommendedExercises: Array<{
    id: string;
    title: string;
    competency: string;
  }>;
  competencyAnalysis?: Array<{
    competency: string;
    accuracy: number;
    correct: number;
    total: number;
  }>;
  recommendations: string[];
  createdAt: any;
}



interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    // Log to Firestore if possible
    if (auth.currentUser) {
      addDoc(collection(db, 'system_logs'), {
        type: 'FRONTEND_ERROR',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      }).catch(console.error);
    }
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

function HistoryView({ history, deleteDiagnostic, archiveDiagnostic, setResult, navigate, setCurrentDiagnosticId, userProfile }: { history: any[], deleteDiagnostic: (id: string) => void, archiveDiagnostic: (id: string, currentStatus: boolean) => void, setResult: (res: any) => void, navigate: any, setCurrentDiagnosticId: (id: string) => void, userProfile: UserProfile | null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('date-desc');

  const isStudent = userProfile?.role === 'aluno';
  const isProfessor = userProfile?.role === 'professor' || userProfile?.role === 'admin';

  const filteredHistory = useMemo(() => {
    const filtered = history.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const studentMatch = item.aluno.toLowerCase().includes(searchLower);
      
      const getDate = (createdAt: any) => {
        if (!createdAt) return new Date(0);
        if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
        return new Date(createdAt);
      };
      
      const dateMatch = getDate(item.createdAt).toLocaleDateString().includes(searchLower);
      const matchesSearch = studentMatch || dateMatch;
      const matchesArchived = viewMode === 'archived' ? item.archived : !item.archived;
      
      return matchesSearch && matchesArchived;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortOption.startsWith('name')) {
        comparison = a.aluno.localeCompare(b.aluno);
      } else {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
        comparison = dateA - dateB;
      }
      return sortOption.endsWith('asc') ? comparison : -comparison;
    });
  }, [history, searchTerm, viewMode, sortOption]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, viewMode]);

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
    toast.info(`Excluindo ${selectedIds.size} diagnósticos...`);

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
      handleFirestoreError(err, OperationType.DELETE, 'diagnostics');
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
          {isProfessor && (
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('active')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'active' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Ativos
              </button>
              <button
                onClick={() => setViewMode('archived')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'archived' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Arquivados
              </button>
            </div>
          )}
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
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="text-xs text-gray-500 font-medium">
              {filteredHistory.length} resultados encontrados
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl">
              <span>Ordenar:</span>
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value as 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc')}
                className="bg-transparent outline-none font-bold text-emerald-600"
              >
                <option value="date-desc">Data (Mais recente)</option>
                <option value="date-asc">Data (Mais antiga)</option>
                <option value="name-asc">Nome (A-Z)</option>
                <option value="name-desc">Nome (Z-A)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl">
              <span>Mostrar:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent outline-none font-bold text-emerald-600"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
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
                  "bg-white p-6 rounded-2xl border transition-all group relative hover:scale-[1.02] hover:shadow-lg",
                  isBulkEdit && selectedIds.has(item.id) ? "border-emerald-500 shadow-md" : "border-gray-200 shadow-sm hover:shadow-md",
                  isBulkEdit && "cursor-pointer hover:scale-100 hover:shadow-sm"
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
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveDiagnostic(item.id, item.archived);
                        }}
                        className={cn(
                          "p-2 transition-all opacity-0 group-hover:opacity-100 rounded-lg",
                          item.archived ? "text-blue-600 hover:bg-blue-50" : "text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                        )}
                        title={item.archived ? "Restaurar" : "Arquivar"}
                      >
                        {item.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDiagnostic(item.id);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn(
                    "font-bold text-gray-900 truncate",
                    isBulkEdit && "ml-8"
                  )}>{item.aluno}</h3>
                  {item.archived && (
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase">Arquivado</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {item.result.diagnostico_por_competencia?.sort((a: any, b: any) => a.acuracia - b.acuracia)[0]?.competencia || 'Sem competência'}
                </div>
                <p className={cn(
                  "text-xs text-gray-400 mb-4",
                  isBulkEdit && "ml-8"
                )}>
                  {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()} às {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString() : new Date(item.createdAt).toLocaleTimeString()}
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Página {currentPage} de {totalPages} • {filteredHistory.length} resultados
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                          currentPage === pageNum 
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                            : "text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ReportsView({ history }: { history: any[] }) {
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedCompetency, setSelectedCompetency] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const students = useMemo(() => {
    const uniqueStudents = Array.from(new Set(history.map(h => h.aluno)));
    return uniqueStudents.sort();
  }, [history]);

  const competencies = useMemo(() => {
    const uniqueComps = new Set<string>();
    history.forEach(h => {
      h.result.diagnostico_por_competencia.forEach((c: any) => {
        uniqueComps.add(c.competencia);
      });
    });
    return Array.from(uniqueComps).sort();
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
      const getDate = (createdAt: any) => {
        if (!createdAt) return new Date(0);
        if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
        return new Date(createdAt);
      };

      const sorted = [...data].sort((a, b) => getDate(b.createdAt).getTime() - getDate(a.createdAt).getTime());
      
      const mostRecent = getDate(sorted[0].createdAt);
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

    return uniqueSuggestions.sort((a, _b) => a.type === 'variance' ? -1 : 1).slice(0, 4);
  }, [history]);

  const chartData = useMemo(() => {
    let filtered = [...history];

    const getDate = (createdAt: any) => {
      if (!createdAt) return new Date(0);
      if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
      return new Date(createdAt);
    };

    if (selectedStudent !== 'all') {
      filtered = filtered.filter(h => h.aluno === selectedStudent);
    }

    if (startDate) {
      const [year, month, day] = startDate.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0);
      filtered = filtered.filter(h => getDate(h.createdAt) >= start);
    }

    if (endDate) {
      const [year, month, day] = endDate.split('-').map(Number);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      filtered = filtered.filter(h => getDate(h.createdAt) <= end);
    }

    // Sort by date
    filtered.sort((a, b) => getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime());

    return filtered.map(h => {
      let acuracia = Math.round(h.result.summary.acuracia_geral * 100);
      let acuraciaPonderada = Math.round(h.result.summary.acuracia_ponderada * 100);

      if (selectedCompetency !== 'all') {
        const comp = h.result.diagnostico_por_competencia.find((c: any) => c.competencia === selectedCompetency);
        if (comp) {
          acuracia = Math.round(comp.acuracia * 100);
          acuraciaPonderada = Math.round(comp.acuracia_ponderada * 100);
        } else {
          return null; // Skip if student didn't have this competency in this diagnostic
        }
      }

      const dateObj = getDate(h.createdAt);

      return {
        date: dateObj.toLocaleDateString('pt-BR'),
        aluno: h.aluno,
        acuracia,
        acuraciaPonderada,
        timestamp: dateObj.getTime()
      };
    }).filter(Boolean) as any[];
  }, [history, selectedStudent, startDate, endDate, selectedCompetency]);

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
    const isGeral = selectedCompetency === 'all';
    const headers = ['Data', 'Aluno', isGeral ? 'Média Geral (%)' : `Acurácia - ${selectedCompetency} (%)`, isGeral ? 'Média Ponderada (%)' : `Acurácia Ponderada - ${selectedCompetency} (%)`, 'Competência'];
    const rows = chartData.map(d => [
      d.date, 
      `"${d.aluno}"`, 
      d.acuracia, 
      d.acuraciaPonderada, 
      `"${isGeral ? 'Geral' : selectedCompetency}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_desempenho_${selectedStudent === 'all' ? 'geral' : selectedStudent}_${isGeral ? 'geral' : selectedCompetency}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    try {
      const filename = `relatorio_desempenho_${selectedStudent || 'geral'}`;
      await pdfExportService.exportElementToPDF(element, filename);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      toast.error('Erro ao gerar PDF. Tente novamente.');
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Desempenho dos Alunos {selectedCompetency !== 'all' ? `- ${selectedCompetency}` : '(Geral)'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Aluno</th>
                <th className="px-4 py-3">Média (%)</th>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtrar por Competência</label>
            <select
              value={selectedCompetency}
              onChange={(e) => setSelectedCompetency(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="all">Geral (Todas)</option>
              {competencies.map(c => (
                <option key={c} value={c}>{c}</option>
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
        <h3 className="text-lg font-bold text-gray-900 mb-6">Evolução da Média (%) {selectedCompetency !== 'all' && `- ${selectedCompetency}`}</h3>
        {chartData.length > 0 ? (
          <div className="space-y-8">
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
                        name={selectedCompetency === 'all' ? "Média Geral" : `Acurácia - ${selectedCompetency}`}
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="acuraciaPonderada" 
                        name={selectedCompetency === 'all' ? "Média Ponderada" : `Acurácia Ponderada - ${selectedCompetency}`}
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        isAnimationActive={false}
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
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedCompetency === 'all' ? 'Média Geral' : `Acurácia - ${selectedCompetency}`}</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedCompetency === 'all' ? 'Média Ponderada' : `Acurácia Ponderada - ${selectedCompetency}`}</th>
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
    const newTask = {
      id: 'temp-' + Date.now(),
      userId: user.uid,
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Optimistic Update
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    localStorage.removeItem('tasks_draft_title');

    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        title: newTaskTitle.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Tarefa adicionada!');
    } catch (err) {
      // Rollback
      setTasks(prev => prev.filter(t => t.id !== newTask.id));
      toast.error('Erro ao adicionar tarefa.');
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const toggleTask = async (task: any) => {
    const path = `tasks/${task.id}`;
    
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));

    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: !task.completed,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      // Rollback
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
      toast.error('Erro ao atualizar tarefa.');
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    const path = `tasks/${id}`;
    
    // Optimistic Update
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await deleteDoc(doc(db, 'tasks', id));
      toast.success('Tarefa excluída!');
    } catch (err) {
      // Rollback
      if (taskToDelete) setTasks(prev => [...prev, taskToDelete].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
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
                    Criado em {task.createdAt?.seconds ? new Date(task.createdAt.seconds * 1000).toLocaleDateString() : new Date(task.createdAt).toLocaleDateString()}
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

function ProfessorDashboardView({ user, userProfile }: { user: User | null, userProfile: UserProfile | null }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalExams: 0,
    avgScore: 0,
    recentActivity: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'activities' | 'heatmap'>('overview');

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'aluno'));
        const studentsSnap = await getDocs(studentsQuery);
        const diagQuery = query(collection(db, 'diagnostics'), orderBy('createdAt', 'desc'), limit(50));
        const diagSnap = await getDocs(diagQuery);
        const diags = diagSnap.docs.map(doc => doc.data());
        const totalExams = diags.length;
        const totalScore = diags.reduce((acc, curr) => acc + (curr.result?.summary?.acuracia_geral * 100 || 0), 0);
        const avgScore = totalExams > 0 ? totalScore / totalExams : 0;

        setStats({
          totalStudents: studentsSnap.size,
          totalExams,
          avgScore,
          recentActivity: diagSnap.docs.slice(0, 5).map(doc => ({ id: doc.id, ...doc.data() }))
        });
      } catch (err) {
        console.error("Error fetching professor stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);
  
  return (
    <div className="space-y-10 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Painel do Professor</h1>
          <p className="text-gray-500 dark:text-gray-400">Bem-vindo, {userProfile?.displayName || 'Professor'}. Gerencie suas turmas e simulados.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/input')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Novo Diagnóstico
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total de Alunos</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.totalStudents}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Simulados Aplicados</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : stats.totalExams}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Média de Acertos</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{loading ? '...' : `${stats.avgScore.toFixed(1)}%`}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
          { id: 'activities', label: 'Atividades', icon: CheckSquare },
          { id: 'heatmap', label: 'Monitoramento Heatmap', icon: Target }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' 
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <LayoutDashboard size={20} className="text-emerald-600" />
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/exams')}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Gestão de Simulados</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Crie e gerencie avaliações padrão SAEP.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-emerald-600 text-xs font-bold">
                    Gerenciar <ArrowRight size={14} />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/questions-bank')}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Banco de Questões</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Acesse e organize questões por competência.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-blue-600 text-xs font-bold">
                    Acessar <ArrowRight size={14} />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/cognitive-analysis')}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Erros Cognitivos</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Análise profunda das dificuldades dos alunos.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-rose-600 text-xs font-bold">
                    Analisar <ArrowRight size={14} />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/tri-analysis')}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center">
                    <Target size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Análise TRI</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Parâmetros psicométricos das questões.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-cyan-600 text-xs font-bold">
                    Analisar <ArrowRight size={14} />
                  </div>
                </motion.button>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History size={20} className="text-emerald-600" />
                Atividade Recente
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Carregando atividade...</p>
                  </div>
                ) : stats.recentActivity.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic text-sm">
                    Nenhuma atividade recente encontrada.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {stats.recentActivity.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/aluno/${item.id}`)}
                        className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">{item.aluno}</p>
                          <p className="text-[10px] text-gray-500">{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">{(item.result?.summary?.acuracia_geral * 100)?.toFixed(1)}%</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Acerto</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button 
                  onClick={() => navigate('/history')}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 hover:text-emerald-600 transition-colors border-t border-gray-100 dark:border-gray-700"
                >
                  Ver Histórico Completo
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'activities' && (
          <motion.div key="activities" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ActivityManager />
          </motion.div>
        )}

        {activeSubTab === 'heatmap' && (
          <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <HeatmapLearning />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StudentDashboardView({ user, userProfile }: { user: User | null, userProfile: UserProfile | null }) {
  const navigate = useNavigate();
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'diagnostics'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDiags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const filtered = allDiags.filter((d: any) => 
        d.studentId === user.uid || 
        (d.studentEmail && d.studentEmail.toLowerCase() === user.email?.toLowerCase()) ||
        (d.studentMatricula && d.studentMatricula === userProfile?.matricula) ||
        (d.aluno && d.aluno.toLowerCase() === user.displayName?.toLowerCase())
      );
      
      setDiagnostics(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Gamification Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 shrink-0">
            <span className="text-3xl font-black">{userProfile?.level || 1}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Nível {userProfile?.level || 1}</h2>
            <p className="text-emerald-100 font-medium">{userProfile?.xp || 0} XP Acumulados</p>
            <div className="mt-3 w-48 h-2 bg-black/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full" 
                style={{ width: `${((userProfile?.xp || 0) % 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-100 mt-1 uppercase tracking-wider">
              {100 - ((userProfile?.xp || 0) % 100)} XP para o próximo nível
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {/* Badges placeholder */}
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20" title="Primeiro Acesso">
            🌟
          </div>
          {(userProfile?.level || 1) >= 5 && (
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20" title="Nível 5 Alcançado">
              🔥
            </div>
          )}
          {(userProfile?.level || 1) >= 10 && (
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20" title="Nível 10 Alcançado">
              👑
            </div>
          )}
        </div>
      </div>

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
          onClick={() => navigate('/student-insights')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Meu Desempenho</h3>
            <p className="text-xs text-gray-500">Veja sua evolução e radar de competências.</p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-blue-600 text-xs font-bold">
            Analisar <ArrowRight size={14} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/socratic-tutor')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
        >
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Tutor Socrático</h3>
            <p className="text-xs text-gray-500">Tire dúvidas guiadas com nossa IA.</p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-purple-600 text-xs font-bold">
            Conversar <ArrowRight size={14} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/student-activities')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
        >
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <CheckSquare size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Minhas Atividades</h3>
            <p className="text-xs text-gray-500">Acesse e entregue atividades propostas.</p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-indigo-600 text-xs font-bold">
            Ver Atividades <ArrowRight size={14} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/adaptive-exam/Geral')}
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-4"
        >
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Teste Adaptativo</h3>
            <p className="text-xs text-gray-500">Questões que se ajustam ao seu nível.</p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-amber-600 text-xs font-bold">
            Iniciar <ArrowRight size={14} />
          </div>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PedagogicalGoalsTracker userId={user?.uid || ''} />
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <History size={20} className="text-emerald-500" />
            Últimos Resultados
          </h3>
          
          <div className="space-y-4">
            {diagnostics.length > 0 ? (
              diagnostics.slice(0, 3).map((diag) => (
                <motion.div
                  key={diag.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(`/aluno/${diag.id}`)}
                  className="p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 cursor-pointer flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xs">
                      {Math.round(diag.result.summary.acuracia_ponderada * 100)}%
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm group-hover:text-emerald-600 transition-colors">Diagnóstico</h4>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {diag.createdAt?.seconds ? new Date(diag.createdAt.seconds * 1000).toLocaleDateString() : new Date(diag.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </motion.div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm italic">
                Nenhum resultado ainda.
              </div>
            )}
          </div>
          <button onClick={() => navigate('/history')} className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline">Ver Histórico Completo</button>
        </div>
      </div>
    </div>
  );
}

function AdaptiveExamView({ user: _user, userProfile, selectedModel }: { user: User | null, userProfile: UserProfile | null, selectedModel: string }) {
  const { competency } = useParams();
  const navigate = useNavigate();
  return (
    <div className="py-8">
      <AdaptiveExam 
        examId="adaptive-default" 
        competency={competency || 'Geral'} 
        onComplete={(score) => {
          toast.success(`Simulado concluído! Score: ${score}%`);
          navigate('/student-dashboard');
        }} 
        selectedModel={selectedModel}
        userRole={userProfile?.role as any || 'aluno'}
      />
    </div>
  );
}

function StudentInsightsView({ user, userProfile: _userProfile, selectedModel }: { user: User | null, userProfile: UserProfile | null, selectedModel: string }) {
  return (
    <div className="py-8">
      <StudentQuickActions />
      <StudentInsights studentId={user?.uid || ''} selectedModel={selectedModel} />
    </div>
  );
}

function ProfessorInsightsView({ userProfile, selectedModel }: { userProfile: UserProfile | null, selectedModel: string }) {
  const [activeView, setActiveView] = useState<'overview' | 'health' | 'grouping'>('overview');

  return (
    <div className="py-8 space-y-8">
      <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Estatísticas de BI', icon: BarChart3 },
          { id: 'health', label: 'Saúde da Turma', icon: Activity },
          { id: 'grouping', label: 'Agrupamentos IA', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeView === tab.id 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeView === 'overview' && (
        <ProfessorInsights userProfile={userProfile} selectedModel={selectedModel} />
      )}
      
      {activeView === 'health' && (
        <ClassHealthDashboard />
      )}

      {activeView === 'grouping' && (
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Agrupamento Inteligente</h3>
                  <p className="text-sm text-gray-500">Alunos agrupados automaticamente por necessidade pedagógica.</p>
                </div>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all">
                  Rodar Novo Agrupamento
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Crítico - Reforço Imediato', count: 4, intervention: 'Retomar Competência 1' },
                  { name: 'Excelência - Adicional', count: 7, intervention: 'Desafios Avançados' },
                ].map(group => (
                  <div key={group.name} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{group.name}</span>
                      <span className="text-xs font-bold text-gray-400">{group.count} alunos</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-xs text-emerald-600 font-medium border border-emerald-50">
                      Intervenção Sugerida: {group.intervention}
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

function CognitiveAnalysisView({ userProfile, selectedModel }: { userProfile: UserProfile | null, selectedModel: string }) {
  return (
    <div className="py-8">
      <CognitiveErrorAnalysisView userProfile={userProfile} selectedModel={selectedModel} />
    </div>
  );
}

function ConsolidatedReportRoute({ history, examSubmissions, onReset }: { history: any[], examSubmissions: any[], onReset: () => void }) {
  const combinedData = useMemo(() => {
    const formattedSubmissions = examSubmissions.map(sub => ({
      ...sub,
      isSubmission: true,
      createdAt: sub.completedAt,
      aluno: sub.studentName || sub.studentId,
    }));
    return [...history, ...formattedSubmissions];
  }, [history, examSubmissions]);

  return (
    <div className="py-8">
      <ConsolidatedReportView history={combinedData} onReset={onReset} />
    </div>
  );
}


function SocraticTutorView({ userProfile, selectedModel }: { userProfile: UserProfile | null, selectedModel: string }) {
  return (
    <div className="py-8">
      <SocraticTutor selectedModel={selectedModel} userRole={userProfile?.role as any || 'aluno'} />
    </div>
  );
}

function GamificationDashboardView({ user: _user, userProfile: _userProfile }: { user: User | null, userProfile: UserProfile | null }) {
  return (
    <div className="py-8">
      <Gamification />
    </div>
  );
}

function CorrectionPlansRoute({ user }: { user: any }) {
  return (
    <div className="py-8">
      <CorrectionPlanView studentId={user?.uid || ''} />
    </div>
  );
}




// Final cleanup of ExamsManagementView

function ExercisesView({ user, userProfile, selectedModel }: { user: User | null, userProfile: UserProfile | null, selectedModel: string }) {
  const [exercises, setExercises] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState<Exam | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Todos');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'exams'), 
      where('type', '==', 'exercicio'),
      where('status', '==', 'published')
    );
    const unsubscribeExams = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExercises(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exams');
    });

    const submissionsQuery = query(collection(db, 'exam_submissions'), where('studentId', '==', user.uid), where('type', '==', 'exercise'));
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSubmission));
      setSubmissions(submissionsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
    });

    return () => {
      unsubscribeExams();
      unsubscribeSubmissions();
    };
  }, [user]);

  const subjects = useMemo(() => {
    const s = new Set(exercises.map(ex => ex.subject));
    return ['Todos', ...Array.from(s)];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           ex.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === 'Todos' || ex.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [exercises, searchTerm, selectedSubject]);

  if (activeExercise) {
    return <ExamTakingView user={user} userProfile={userProfile} exam={activeExercise} onCancel={() => setActiveExercise(null)} selectedModel={selectedModel} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
            <CheckSquare size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Módulo de Exercícios</h2>
            <p className="text-sm text-gray-500">Foco em <span className="text-blue-600 font-bold">prática e aprendizado</span> com feedback imediato e correção comentada</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
          <Info size={16} className="text-blue-600" />
          <p className="text-[10px] text-blue-700 font-medium">
            Diferente dos simulados, aqui você recebe correção na hora para acelerar seu aprendizado.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar exercícios por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                selectedSubject === subject 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              )}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto">
            <BookOpen size={32} />
          </div>
          <p className="text-gray-500 font-medium">Nenhum exercício encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((ex) => {
            const submission = submissions.find(s => s.resourceId === ex.id);
            const isCompleted = !!submission;
            const scorePercentage = isCompleted ? Math.round((submission.score / (submission.maxScore || 100)) * 100) : 0;

            return (
              <motion.div 
                key={ex.id} 
                whileHover={{ y: -4 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {ex.subject}
                  </span>
                  {isCompleted ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                      <CheckCircle2 size={12} /> Concluído ({scorePercentage}%)
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-[8px] font-bold uppercase tracking-tighter">
                      <Zap size={8} /> Prática
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{ex.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">{ex.description}</p>
                <button 
                  onClick={() => setActiveExercise(ex)}
                  className={cn(
                    "w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                    isCompleted 
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white" 
                      : "bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"
                  )}
                >
                  {isCompleted ? 'Praticar Novamente' : 'Praticar Agora'} <ArrowRight size={18} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentExamsView({ user, userProfile, selectedModel }: { user: User | null, userProfile: UserProfile | null, selectedModel: string }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [forms, setForms] = useState<SimuladoForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingExam, setTakingExam] = useState<Exam | null>(null);
  // navigate was unused, removed.

  useEffect(() => {
    if (!user) return;
    
    // Fetch published exams (Simulados only)
    const examsQuery = query(
      collection(db, 'exams'), 
      where('status', '==', 'published'),
      where('type', '==', 'simulado')
    );
    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExams(examsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exams');
    });

    // Fetch user submissions
    const submissionsQuery = query(collection(db, 'exam_submissions'), where('studentId', '==', user.uid));
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSubmission));
      setSubmissions(submissionsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
    });

    // Fetch active forms
    const formsQuery = query(collection(db, 'simulado_forms'), where('status', '==', 'active'));
    const unsubscribeForms = onSnapshot(formsQuery, (snapshot) => {
      const formsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SimuladoForm));
      setForms(formsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'simulado_forms');
    });

    return () => {
      unsubscribeExams();
      unsubscribeSubmissions();
      unsubscribeForms();
    };
  }, [user]);

  if (takingExam) {
    // Check for date restrictions
    const now = new Date();
    if (takingExam.startDate && now < new Date(takingExam.startDate.seconds * 1000)) {
      toast.error("Este simulado ainda não está aberto.");
      setTakingExam(null);
      return null;
    }
    if (takingExam.endDate && now > new Date(takingExam.endDate.seconds * 1000)) {
      toast.error("Este simulado já foi encerrado.");
      setTakingExam(null);
      return null;
    }

    // Check for max attempts
    const userSubmissions = submissions.filter(s => s.resourceId === takingExam.id);
    if (takingExam.maxAttempts && userSubmissions.length >= takingExam.maxAttempts) {
      toast.error(`Você já atingiu o limite de ${takingExam.maxAttempts} tentativas para este simulado.`);
      setTakingExam(null);
      return null;
    }

    return <ExamTakingView exam={takingExam} user={user} userProfile={userProfile} onCancel={() => setTakingExam(null)} selectedModel={selectedModel} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
            <BookOpen size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Simulados Oficiais</h2>
            <p className="text-sm text-gray-500">Foco em <span className="text-emerald-600 font-bold">diagnóstico e avaliação formal</span> para monitoramento de desempenho</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <Info size={16} className="text-emerald-600" />
          <p className="text-[10px] text-emerald-700 font-medium">
            Avaliações formais para medir seu progresso real. O feedback detalhado vem após o envio.
          </p>
        </div>
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
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[8px] font-bold uppercase tracking-tighter">
                        Avaliação
                      </span>
                      <h3 className="font-bold text-gray-900">{exam.title}</h3>
                    </div>
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
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {(exam.applicationMode === 'internal' || exam.applicationMode === 'hybrid' || !exam.applicationMode) && (
                        <button 
                          onClick={() => setTakingExam(exam)}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all text-sm"
                        >
                          Iniciar na Plataforma
                        </button>
                      )}
                      {(exam.applicationMode === 'external' || exam.applicationMode === 'hybrid') && (
                        <a 
                          href={forms.find(f => f.simuladoId === exam.id)?.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-6 py-2 bg-white text-emerald-600 border-2 border-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-all text-sm text-center flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={16} />
                          Responder em Formulário
                        </a>
                      )}
                    </div>
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

function StudyPlanView({ user, userProfile, selectedModel }: { user: User | null, userProfile: UserProfile | null, selectedModel: string }) {
  const navigate = useNavigate();
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingTips, setGeneratingTips] = useState(false);
  const [generatingRefined, setGeneratingRefined] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);
  const [savingDetails, setSavingDetails] = useState<string | null>(null);

  const refineSuggestions = async () => {
    if (!studyPlan || !user) return;
    setGeneratingRefined(true);
    try {
      const prompt = `Como um tutor educacional especialista no SAEP, gere um novo conjunto de 3 Tópicos Prioritários para estudo, mais específicos e detalhados.
      
      FRAQUEZAS GERAIS (Competências): ${studyPlan.weaknesses.join(', ')}
      CONHECIMENTOS ESPECÍFICOS FRÁGEIS: ${studyPlan.detailedWeaknesses?.join(', ') || 'Não detalhados'}
      TÓPICOS ANTERIORES SUGERIDOS: ${studyPlan.priorityTopics.map(t => `${t.topic} (${t.reason})`).join('; ')}
      
      OBJETIVO:
      Aprofundar nas fraquezas e sugerir tópicos mais granulares, técnicos e específicos que os anteriores. 
      As sugestões devem ser acionáveis e focadas em superar os conhecimentos específicos frágeis.
      
      RETORNE APENAS UM JSON NO FORMATO:
      {
        "priorityTopics": [
          { "topic": "Nome do Tópico Específico", "reason": "Por que estudar isso agora?", "priority": "Alta" | "Média" | "Baixa" }
        ]
      }`;

      const response = await generateContentWrapper({
        model: selectedModel,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          ...DEFAULT_CONFIG,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priorityTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    priority: { type: Type.STRING }
                  },
                  required: ["topic", "reason", "priority"]
                }
              }
            },
            required: ["priorityTopics"]
          }
        }
      });

      const aiData = safeParseJson(response.text, {});
      
      if (aiData.priorityTopics && studyPlan.id) {
        await updateDoc(doc(db, 'study_plans', studyPlan.id), {
          priorityTopics: aiData.priorityTopics
        });
        toast.success("Sugestões refinadas com sucesso!");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `study_plans/${studyPlan?.id}`);
    } finally {
      setGeneratingRefined(false);
    }
  };

  const saveDetails = async (topicIndex: number, details: string) => {
    if (!studyPlan) return;
    setSavingDetails(`${topicIndex}`);
    try {
      const newTopics = [...studyPlan.priorityTopics];
      newTopics[topicIndex].details = details;
      await updateDoc(doc(db, 'study_plans', studyPlan.id), { priorityTopics: newTopics });
      toast.success("Detalhes salvos!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `study_plans/${studyPlan.id}`);
    } finally {
      setSavingDetails(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'exam_submissions'), where('studentId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exam_submissions');
    });
    return () => unsubscribe();
  }, [user]);

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const filename = `Plano_Estudos_${user?.uid || 'aluno'}`;
      await pdfExportService.exportElementToPDF(reportRef.current, filename);
      toast.success("PDF exportado com sucesso!");
    } catch (err: any) {
      toast.error(`Erro ao exportar PDF: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const generateRecommendations = async () => {
    if (!studyPlan || !user) return;
    setGeneratingTips(true);
    try {
      const prompt = `Como um tutor educacional especialista, gere 5 recomendações gerais de estudo baseadas no perfil do aluno.
      
      PERFIL DO ALUNO:
      - Pontos Fortes: ${studyPlan.strengths.join(', ') || 'Nenhum identificado ainda'}
      - Pontos Fracos: ${studyPlan.weaknesses.join(', ') || 'Nenhum identificado ainda'}
      - Análise de Competências: ${JSON.stringify(studyPlan.competencyAnalysis || [])}
      
      OBJETIVO:
      Fornecer 5 recomendações estratégicas e práticas de estudo para ajudar o aluno a melhorar seus pontos fracos e manter seus pontos fortes, considerando também as competências avaliadas.
      
      RETORNE APENAS UM JSON NO FORMATO:
      {
        "recommendations": ["Recomendação 1", "Recomendação 2", "Recomendação 3", "Recomendação 4", "Recomendação 5"]
      }`;

      const response = await generateContentWrapper({
        model: selectedModel,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          ...DEFAULT_CONFIG,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["recommendations"]
          }
        }
      });

      const aiData = safeParseJson(response.text, {});
      
      if (aiData.recommendations && studyPlan.id) {
        await updateDoc(doc(db, 'study_plans', studyPlan.id), {
          recommendations: aiData.recommendations
        });
        toast.success("Dicas geradas com sucesso!");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `study_plans/${studyPlan?.id}`);
    } finally {
      setGeneratingTips(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'study_plans'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setStudyPlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StudyPlan);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'study_plans');
    });
    return () => unsubscribe();
  }, [user]);

  const generatePlan = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      // 1. Fetch all performance data
      const submissionsQuery = query(collection(db, 'exam_submissions'), where('studentId', '==', user.uid));
      const diagnosticsQuery = query(collection(db, 'diagnostics'), where('userId', '==', user.uid));
      
      const [submissionsSnap, diagnosticsSnap, questionsSnap, examsSnap] = await Promise.all([
        getDocs(submissionsQuery),
        getDocs(diagnosticsQuery),
        getDocs(query(collection(db, 'questions'), limit(100))),
        getDocs(query(collection(db, 'exams'), limit(20)))
      ]);

      const submissions = submissionsSnap.docs.map(doc => doc.data() as ExamSubmission);
      const diagnostics = diagnosticsSnap.docs.map(doc => doc.data());
      const availableQuestions = questionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      const availableExams = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));

      if (submissions.length === 0 && diagnostics.length === 0) {
        toast.error("Você precisa realizar pelo menos um simulado ou ter um diagnóstico importado para gerar um plano de estudos.");
        setGenerating(false);
        return;
      }

      // 2. Aggregate Competency Stats
      const competencyStats: { [key: string]: { correct: number, total: number } } = {};
      
      submissions.forEach(sub => {
        Object.entries(sub.competencyResults || {}).forEach(([comp, stats]) => {
          if (!competencyStats[comp]) competencyStats[comp] = { correct: 0, total: 0 };
          competencyStats[comp].correct += stats.correct;
          competencyStats[comp].total += stats.total;
        });
      });

      diagnostics.forEach(diag => {
        (diag.result?.diagnostico_por_competencia || []).forEach((comp: any) => {
          if (!competencyStats[comp.competencia]) competencyStats[comp.competencia] = { correct: 0, total: 0 };
          competencyStats[comp.competencia].correct += comp.acertos;
          competencyStats[comp.competencia].total += comp.total_questoes;
        });
      });

      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const detailedWeaknesses: string[] = [];
      const competencyAnalysis: any[] = [];

      Object.entries(competencyStats).forEach(([comp, stats]) => {
        const accuracy = stats.correct / stats.total;
        competencyAnalysis.push({ competency: comp, accuracy, ...stats });
        if (accuracy >= 0.75) strengths.push(comp);
        else if (accuracy < 0.6) {
          weaknesses.push(comp);
          // Collect detailed weaknesses from diagnostics if available
          diagnostics.forEach(diag => {
            (diag.result?.diagnostico_por_competencia || []).forEach((c: any) => {
              if (c.competencia === comp && c.conhecimentos_fracos) {
                detailedWeaknesses.push(...c.conhecimentos_fracos);
              }
            });
          });
        }
      });

      // Remove duplicates from detailedWeaknesses
      const uniqueDetailedWeaknesses = Array.from(new Set(detailedWeaknesses));

      // 3. Use Gemini to generate the adaptive plan
      const prompt = `Como um tutor educacional especialista no SAEP, gere um plano de estudos ADAPTATIVO e PERSONALIZADO.
      
      PERFIL DO ALUNO:
      - Pontos Fortes: ${strengths.join(', ') || 'Nenhum identificado ainda'}
      - Pontos Fracos (Competências): ${weaknesses.join(', ') || 'Nenhum identificado ainda'}
      - Conhecimentos Específicos Frágeis: ${uniqueDetailedWeaknesses.join(', ') || 'Não detalhados'}
      - Análise Detalhada: ${JSON.stringify(competencyAnalysis)}
      
      CONTEÚDO DISPONÍVEL:
      - Questões: ${availableQuestions.map(q => `- ID: ${q.id}, Competência: ${q.competenciaNome}, Texto: ${q.enunciado.substring(0, 30)}`).join('\n')}
      - Simulados/Exercícios: ${availableExams.map(e => `- ID: ${e.id}, Título: ${e.title}, Tipo: ${e.type}`).join('\n')}
      
      OBJETIVO:
      1. Identificar 3 Tópicos Prioritários para estudo com base nas fraquezas.
      2. Recomendar 3 a 5 Exercícios/Simulados específicos do banco acima que ajudem nessas fraquezas.
      3. Fornecer 5 Recomendações estratégicas de estudo.
      
      RETORNE APENAS UM JSON NO FORMATO:
      {
        "priorityTopics": [
          { "topic": "Nome do Tópico", "reason": "Por que estudar isso?", "priority": "Alta" | "Média" | "Baixa" }
        ],
        "recommendedExercises": [
          { "id": "ID_DO_RECURSO", "title": "Título do Simulado ou Exercício", "competency": "Competência Principal" }
        ],
        "recommendations": ["Recomendação 1", "Recomendação 2", ...]
      }`;

      const response = await generateContentWrapper({
        model: selectedModel,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          ...DEFAULT_CONFIG,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priorityTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    priority: { type: Type.STRING }
                  },
                  required: ["topic", "reason", "priority"]
                }
              },
              recommendedExercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    competency: { type: Type.STRING }
                  },
                  required: ["id", "title", "competency"]
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["priorityTopics", "recommendedExercises", "recommendations"]
          }
        }
      });

      const aiData = safeParseJson(response.text, {});

      const newPlan: Omit<StudyPlan, 'id'> = {
        userId: user.uid,
        strengths,
        weaknesses,
        detailedWeaknesses: uniqueDetailedWeaknesses,
        priorityTopics: aiData.priorityTopics || [],
        recommendedExercises: aiData.recommendedExercises || [],
        competencyAnalysis,
        recommendations: aiData.recommendations || [],
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'study_plans'), newPlan);
      
      // Disparar n8n para gerar recomendações de conteúdo externo
      await n8nEvents.pedagogicalRecommendation({
        userId: user.uid,
        recommendation: {
          competency: weaknesses.join(', '),
          weaknesses,
          priorityTopics: newPlan.priorityTopics
        }
      });

      toast.success("Plano de estudos adaptativo gerado com sucesso!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'study_plans');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-emerald-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/50 rounded-full text-xs font-bold tracking-widest uppercase border border-emerald-700/50">
              <Zap size={14} className="text-emerald-400" /> Inteligência Artificial
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Seu Plano de Estudos <span className="text-emerald-400 italic">Adaptativo</span>
            </h1>
            <p className="text-emerald-100/80 text-lg leading-relaxed">
              Analisamos cada resposta sua para criar uma trilha de aprendizagem única, focada no que você realmente precisa para o SAEP.
            </p>
          </div>
          <button 
            onClick={() => setShowConfirmation(true)}
            disabled={generating}
            className="group relative flex items-center gap-3 px-8 py-4 bg-white text-emerald-900 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-xl disabled:opacity-50"
          >
            {generating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="group-hover:scale-110 transition-transform" />}
            {generating ? "Analisando Desempenho..." : "Atualizar Meu Plano"}
          </button>
          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="group relative flex items-center gap-3 px-8 py-4 bg-emerald-800 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            Exportar PDF
          </button>
        </div>
        
        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gerar novo plano?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Isso irá analisar seu desempenho atual e criar um novo plano de estudos. O plano anterior será substituído.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setShowConfirmation(false);
                    generatePlan();
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Decorative elements */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-800 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-emerald-700 rounded-full blur-3xl opacity-20"></div>
      </div>

      {!studyPlan ? (
        <div className="bg-white dark:bg-gray-900 p-16 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 text-center space-y-6">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-300 dark:text-gray-600 mx-auto">
            <Target size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Comece sua jornada personalizada</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Ainda não temos dados suficientes para mapear seu perfil. Realize simulados ou exercícios para que possamos gerar seu plano.
            </p>
          </div>
          <button 
            onClick={generatePlan} 
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
          >
            Gerar Meu Plano Agora
          </button>
        </div>
      ) : (
        <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Priority Topics & Exercises */}
          <div className="lg:col-span-8 space-y-8">
            {/* Priority Topics */}
            <section className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Target className="text-emerald-600" size={28} /> Tópicos Prioritários
                </h3>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Foco Atual</span>
                  <span className="text-[10px] text-gray-400 italic">Atualizado em {studyPlan.createdAt?.toDate ? studyPlan.createdAt.toDate().toLocaleDateString() : 'recentemente'}</span>
                </div>
              </div>
              
              <div className="grid gap-6">
                {studyPlan.priorityTopics?.map((topic, idx) => (
                  <div key={idx} className="group p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                            topic.priority === 'Alta' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                            topic.priority === 'Média' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            Prioridade {topic.priority}
                          </span>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">{topic.topic}</h4>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{topic.reason}</p>
                      </div>
                      <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                    {(userProfile?.role === 'professor' || userProfile?.role === 'admin') && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detalhes Adicionais (Professor)</label>
                        <textarea
                          value={topic.details || ''}
                          onChange={(e) => {
                            const newTopics = [...studyPlan.priorityTopics];
                            newTopics[idx].details = e.target.value;
                            setStudyPlan({...studyPlan, priorityTopics: newTopics});
                          }}
                          className="w-full mt-1 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                          placeholder="Adicione informações complementares..."
                        />
                        <button
                          onClick={() => saveDetails(idx, topic.details || '')}
                          disabled={savingDetails === `${idx}`}
                          className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                        >
                          {savingDetails === `${idx}` ? 'Salvando...' : 'Salvar Detalhes'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </section>

            <div className="flex justify-center">
              <button
                onClick={refineSuggestions}
                disabled={generatingRefined}
                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center gap-3 disabled:opacity-50"
              >
                {generatingRefined ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                {generatingRefined ? "Refinando Sugestões..." : "Refinar Sugestões de Estudo"}
              </button>
            </div>

            {/* Recommended Exercises */}
            <section className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <CheckSquare className="text-emerald-600" size={28} /> Exercícios Recomendados
                </h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prática Direcionada</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studyPlan.recommendedExercises?.map((ex, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/student-exams`)}
                    className="p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between group cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                  >
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{ex.competency}</p>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{ex.title}</h4>
                    </div>
                    <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm group-hover:translate-x-1 transition-transform">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Competency Breakdown */}
            {studyPlan.competencyAnalysis && studyPlan.competencyAnalysis.length > 0 && (
              <section className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <BarChart3 className="text-emerald-600" size={28} /> Análise por Competência
                  </h3>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Desempenho Detalhado</span>
                </div>

                <div className="space-y-4">
                  {studyPlan.competencyAnalysis.map((comp, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{comp.competency}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{(comp.accuracy * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${comp.accuracy * 100}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          className={cn(
                            "h-full rounded-full",
                            comp.accuracy >= 0.75 ? "bg-emerald-500" :
                            comp.accuracy >= 0.6 ? "bg-amber-500" : "bg-red-500"
                          )}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 text-right">{comp.correct} acertos de {comp.total} questões</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* History Chart */}
            {history.length > 0 && (
              <section className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <History className="text-emerald-600" size={28} /> Histórico de Evolução
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history.map(h => ({
                      date: h.completedAt?.seconds ? new Date(h.completedAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A',
                      acuracia: Math.round((h.accuracy || 0) * 100)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={40} />
                      <Area type="monotone" dataKey="acuracia" stroke="#10b981" strokeWidth={4} fill="#10b981" fillOpacity={0.1} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Profile & Recommendations */}
          <div className="lg:col-span-4 space-y-8">
            {/* Performance Profile */}
            <section className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Seu Perfil SAEP</h4>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 size={16} /> Pontos Fortes
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {studyPlan.strengths.map(s => (
                      <span key={s} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/30">{s}</span>
                    ))}
                    {studyPlan.strengths.length === 0 && <span className="text-xs text-gray-400 italic">Nenhum identificado ainda</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                    <AlertCircle size={16} /> Pontos de Atenção
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {studyPlan.weaknesses.map(w => (
                      <span key={w} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold border border-red-100 dark:border-red-900/30">{w}</span>
                    ))}
                    {studyPlan.weaknesses.length === 0 && <span className="text-xs text-gray-400 italic">Nenhum identificado ainda</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* General Recommendations */}
            <section className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare size={16} /> Dicas do Tutor IA
                </h4>
                {(!studyPlan.recommendations || studyPlan.recommendations.length === 0) && (
                  <button
                    onClick={generateRecommendations}
                    disabled={generatingTips}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-bold disabled:opacity-50"
                  >
                    {generatingTips ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Gerar Dicas
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {studyPlan.recommendations && studyPlan.recommendations.length > 0 ? (
                  studyPlan.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 shrink-0"></div>
                      <p className="text-sm text-emerald-900/80 dark:text-emerald-100/70 leading-relaxed">{rec}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-emerald-900/60 dark:text-emerald-100/50 italic">
                    Nenhuma dica gerada ainda. Clique no botão acima para gerar recomendações personalizadas.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamTakingView({ exam, user, userProfile, onCancel, selectedModel }: { exam: Exam, user: User | null, userProfile: UserProfile | null, onCancel: () => void, selectedModel: string }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => {
    const saved = localStorage.getItem(`exam_progress_${exam.id}`);
    return saved ? JSON.parse(saved) : new Array(exam.questions.length).fill(-1);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [finalSubmission, setFinalSubmission] = useState<ExamSubmission | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Auto-save progress
  useEffect(() => {
    localStorage.setItem(`exam_progress_${exam.id}`, JSON.stringify(answers));
  }, [answers, exam.id]);

  const currentQuestion = exam.questions[currentQuestionIdx];

  const handleAnswer = (optionIdx: number) => {
    if (exam.type === 'exercicio' && isAnswerChecked) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIdx < exam.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setIsAnswerChecked(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
      setIsAnswerChecked(exam.type === 'exercicio' && answers[currentQuestionIdx - 1] !== -1);
    }
  };

  const handleSubmit = async () => {
    if (answers.includes(-1)) {
      // if (!window.confirm("Você ainda tem questões sem resposta. Deseja enviar assim mesmo?")) return;
      toast.warning("Enviando com questões sem resposta...");
    }

    setIsSubmitting(true);
    try {
      let score = 0;
      let maxScore = 0;
      const competencyResults: { [key: string]: { correct: number, total: number } } = {};

      exam.questions.forEach((q, idx) => {
        const correctIdx = q.alternativas.findIndex(a => a.id === q.respostaCorreta);
        const isCorrect = answers[idx] === (correctIdx !== -1 ? correctIdx : 0);
        const weight = 1; // Default weight
        maxScore += weight;
        if (isCorrect) score += weight;

        if (q.competenciaNome) {
          if (!competencyResults[q.competenciaNome]) {
            competencyResults[q.competenciaNome] = { correct: 0, total: 0 };
          }
          competencyResults[q.competenciaNome].total += weight;
          if (isCorrect) competencyResults[q.competenciaNome].correct += weight;
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
      
      // Trigger n8n automation
      await n8nEvents.examCompleted({
        studentId: user?.uid || '',
        examId: exam.id,
        score,
        proficiency: (score / maxScore) * 100
      });
      
      // Cognitive Error Analysis Trigger
      if (score < maxScore) {
        // Run analysis in background
        analyzeCognitiveErrors(submission, exam.questions, selectedModel, userProfile?.role as any || 'professor').then(async (result) => {
          if (result.errors && result.errors.length > 0) {
            await addDoc(collection(db, 'cognitive_error_analyses'), {
              userId: user?.uid || '',
              submissionId: docRef.id,
              errors: result.errors,
              createdAt: serverTimestamp()
            });
          }
        }).catch(err => console.error("Error generating cognitive analysis:", err));
      }
      
      // Gamification Logic
      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDocFromServer(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentXp = userData.xp || 0;
            const earnedXp = score * 10; // 10 XP per point
            const newXp = currentXp + earnedXp;
            const newLevel = Math.floor(newXp / 100) + 1;
            
            await updateDoc(userRef, {
              xp: newXp,
              level: newLevel
            });
            
            if (newLevel > (userData.level || 1)) {
              toast.success(`🎉 Parabéns! Você alcançou o nível ${newLevel}!`);
            } else if (earnedXp > 0) {
              toast.success(`✨ Você ganhou ${earnedXp} XP!`);
            }
          }
        } catch (e) {
          console.error("Error updating gamification:", e);
        }
      }

      setFinalSubmission({ id: docRef.id, ...submission } as ExamSubmission);
      setShowResult(true);
      
      // Clear auto-save on success
      localStorage.removeItem(`exam_progress_${exam.id}`);
      toast.success("Avaliação enviada com sucesso!");
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
            <h2 className="text-3xl font-bold text-gray-900">{exam.type === 'exercicio' ? 'Exercício Concluído!' : 'Simulado Concluído!'}</h2>
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
            Voltar para {exam.type === 'exercicio' ? 'Exercícios' : 'Simulados'}
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
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter",
                exam.type === 'exercicio' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
              )}>
                {exam.type === 'exercicio' ? 'Modo Prática' : 'Modo Simulado'}
              </span>
              <h2 className="text-xl font-bold text-gray-900">{exam.title}</h2>
            </div>
            <p className="text-xs text-gray-500">Questão {currentQuestionIdx + 1} de {exam.questions.length}</p>
          </div>
        </div>
        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all",
              exam.type === 'exercicio' ? "bg-blue-500" : "bg-emerald-500"
            )}
            style={{ width: `${((currentQuestionIdx + 1) / exam.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {exam.type === 'exercicio' && (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Zap size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-900">Aprendizado Ativo</p>
            <p className="text-[10px] text-blue-700">Feedback imediato e correção comentada habilitados para esta sessão.</p>
          </div>
        </div>
      )}

      {exam.type === 'simulado' && (
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-900">Avaliação Formal</p>
            <p className="text-[10px] text-emerald-700">O feedback detalhado será disponibilizado apenas após a finalização do simulado.</p>
          </div>
        </div>
      )}

      <motion.div 
        key={currentQuestionIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8"
      >
        <div className="space-y-4">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {currentQuestion.competenciaNome || 'Geral'}
          </span>
          <h3 className="text-xl font-medium text-gray-900 leading-relaxed">
            {currentQuestion.enunciado}
          </h3>
        </div>

        <div className="space-y-3">
          {currentQuestion.alternativas.map((opt, idx) => {
            const correctIdx = currentQuestion.alternativas.findIndex(a => a.id === currentQuestion.respostaCorreta);
            const isCorrectOption = idx === (correctIdx !== -1 ? correctIdx : 0);
            
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={exam.type === 'exercicio' && isAnswerChecked}
                className={cn(
                  "w-full p-4 text-left rounded-2xl border transition-all flex items-center gap-4 group",
                  answers[currentQuestionIdx] === idx 
                    ? (exam.type === 'exercicio' && isAnswerChecked 
                        ? (isCorrectOption ? "bg-emerald-50 border-emerald-500 shadow-sm" : "bg-red-50 border-red-500 shadow-sm")
                        : "bg-emerald-50 border-emerald-500 shadow-sm")
                    : (exam.type === 'exercicio' && isAnswerChecked && isCorrectOption
                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                        : "bg-gray-50 border-gray-100 hover:border-emerald-200 hover:bg-white")
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                  answers[currentQuestionIdx] === idx 
                    ? (exam.type === 'exercicio' && isAnswerChecked
                        ? (isCorrectOption ? "bg-emerald-500 text-white" : "bg-red-500 text-white")
                        : "bg-emerald-500 text-white")
                    : (exam.type === 'exercicio' && isAnswerChecked && isCorrectOption
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-gray-400 group-hover:text-emerald-600")
                )}>
                  {opt.id}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-medium",
                    answers[currentQuestionIdx] === idx 
                      ? (exam.type === 'exercicio' && isAnswerChecked
                          ? (isCorrectOption ? "text-emerald-900" : "text-red-900")
                          : "text-emerald-900")
                      : (exam.type === 'exercicio' && isAnswerChecked && isCorrectOption
                          ? "text-emerald-900"
                          : "text-gray-600")
                  )}>
                    {opt.texto}
                  </span>
                  {exam.type === 'exercicio' && isAnswerChecked && (
                    isCorrectOption ? (
                      <CheckCircle2 className="text-emerald-500" size={18} />
                    ) : (
                      answers[currentQuestionIdx] === idx && <XCircle className="text-red-500" size={18} />
                    )
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {exam.type === 'exercicio' && isAnswerChecked && currentQuestion.comentarioGabarito && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-blue-50 border border-blue-100 rounded-2xl space-y-2"
          >
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-widest">
              <HelpCircle size={14} /> Correção Comentada
            </div>
            <p className="text-sm text-blue-900 leading-relaxed">
              {currentQuestion.comentarioGabarito}
            </p>
          </motion.div>
        )}
      </motion.div>

      <div className="flex items-center justify-between">
        <button
          disabled={currentQuestionIdx === 0}
          onClick={handlePrevious}
          className="flex items-center gap-2 px-6 py-3 text-gray-500 font-bold hover:text-gray-900 disabled:opacity-30"
        >
          <ChevronLeft size={20} /> Anterior
        </button>

        <div className="flex gap-3">
          {exam.type === 'exercicio' && !isAnswerChecked && answers[currentQuestionIdx] !== -1 && (
            <button
              onClick={() => setIsAnswerChecked(true)}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100"
            >
              <Check size={20} /> Verificar Resposta
            </button>
          )}
          
          {(exam.type === 'simulado' || isAnswerChecked) && (
            currentQuestionIdx === exam.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50",
                  exam.type === 'exercicio' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                )}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                Finalizar {exam.type === 'exercicio' ? 'Exercício' : 'Simulado'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 text-white rounded-xl font-bold transition-all shadow-lg",
                  exam.type === 'exercicio' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : "bg-gray-900 hover:bg-gray-800 shadow-gray-200"
                )}
              >
                Próxima <ChevronRight size={20} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// GamificationView was unused, removed.
/*
function GamificationView({ user, userProfile }: { user: User | null, userProfile: UserProfile | null }) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'results'>('menu');
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Questões focadas nas capacidades técnicas do SAEP para Técnico em Desenvolvimento de Sistemas
  const questions = [
    {
      id: 1,
      descriptor: 'C3 - Lógica de Programação',
      text: 'Aplicar lógica de programação na resolução de problemas computacionais.',
      question: 'Qual estrutura de repetição é mais adequada quando não se sabe previamente o número exato de iterações, mas sim uma condição de parada?',
      options: [
        'Estrutura FOR (Para)',
        'Estrutura WHILE (Enquanto)',
        'Estrutura SWITCH (Escolha)',
        'Estrutura IF-ELSE (Se-Senão)'
      ],
      correctAnswer: 1,
      explanation: 'A estrutura WHILE (Enquanto) é ideal para laços condicionais onde o número de repetições é indefinido e depende de uma condição verdadeira para continuar.'
    },
    {
      id: 2,
      descriptor: 'C4 - Banco de Dados',
      text: 'Utilizar técnicas de modelagem e linguagem na manipulação de banco de dados.',
      question: 'Em um banco de dados relacional, qual comando SQL é utilizado para extrair dados de duas ou mais tabelas baseando-se em uma relação entre elas?',
      options: [
        'UPDATE',
        'INSERT INTO',
        'JOIN',
        'ALTER TABLE'
      ],
      correctAnswer: 2,
      explanation: 'A cláusula JOIN é usada para combinar linhas de duas ou mais tabelas, baseada em uma coluna comum entre elas.'
    },
    {
      id: 3,
      descriptor: 'C7 - Programação',
      text: 'Desenvolver aplicações e sistemas por meio de linguagem de programação.',
      question: 'Na Programação Orientada a Objetos (POO), qual pilar permite que uma classe filha herde atributos e métodos de uma classe pai?',
      options: [
        'Polimorfismo',
        'Encapsulamento',
        'Herança',
        'Abstração'
      ],
      correctAnswer: 2,
      explanation: 'A Herança é o mecanismo da POO que permite basear uma nova classe na definição de uma classe previamente existente.'
    },
    {
      id: 4,
      descriptor: 'C8 - Teste de Sistemas',
      text: 'Selecionar procedimentos de teste que assegurem a aderência aos requisitos.',
      question: 'Qual tipo de teste de software é focado em verificar se os componentes individuais de um sistema funcionam corretamente de forma isolada?',
      options: [
        'Teste de Integração',
        'Teste de Sistema',
        'Teste de Aceitação',
        'Teste Unitário'
      ],
      correctAnswer: 3,
      explanation: 'O Teste Unitário (ou Teste de Unidade) verifica o menor componente testável de um software (como funções ou métodos) de forma isolada.'
    },
    {
      id: 5,
      descriptor: 'C2 - Fundamentos de Eletroeletrônica',
      text: 'Compreender fundamentos de eletroeletrônica aplicada no desenvolvimento de sistemas.',
      question: 'Qual grandeza elétrica é medida em Volts (V) e representa a diferença de potencial elétrico entre dois pontos?',
      options: [
        'Corrente Elétrica',
        'Resistência Elétrica',
        'Tensão Elétrica',
        'Potência Elétrica'
      ],
      correctAnswer: 2,
      explanation: 'A Tensão Elétrica (ou diferença de potencial) é medida em Volts e é a força que impulsiona os elétrons em um circuito.'
    }
  ];

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === questions[currentQuestion].correctAnswer) {
      setScore(score + 10);
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setGameState('results');
      // Award XP
      if (userProfile && user) {
        try {
          const newXp = (userProfile.xp || 0) + score;
          const newLevel = Math.floor(newXp / 100) + 1;
          await updateDoc(doc(db, 'users', user.uid), {
            xp: newXp,
            level: newLevel
          });
          toast.success(`Você ganhou ${score} XP!`);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    }
  };

  const resetGame = () => {
    setGameState('menu');
    setScore(0);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  if (!userProfile?.gamificationEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700">Gamificação Desativada</h2>
        <p className="text-gray-500 max-w-md">
          O módulo de gamificação e revisão SAEP não está habilitado para o seu perfil no momento. 
          Fale com seu professor para liberar o acesso.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Arena SAEP
          </h2>
          <p className="text-gray-500 mt-2">Revise os descritores do SAEP de forma interativa e ganhe XP!</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Seu Nível</div>
            <div className="text-2xl font-black text-emerald-600">Lvl {userProfile.level || 1}</div>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div>
            <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">XP Total</div>
            <div className="text-2xl font-black text-blue-600">{userProfile.xp || 0}</div>
          </div>
        </div>
      </div>

      {gameState === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setGameState('playing')}>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Quiz de Descritores</h3>
            <p className="text-gray-500 mb-6">Teste seus conhecimentos nos principais descritores cobrados no SAEP.</p>
            <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
              Iniciar Desafio
            </button>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 border-dashed flex flex-col items-center justify-center text-center opacity-70">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">Batalha de Turmas</h3>
            <p className="text-gray-500 text-sm">Em breve! Dispute com seus colegas em tempo real.</p>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-white/20 rounded-lg text-sm font-bold tracking-wider">
                {questions[currentQuestion].descriptor}
              </span>
              <span className="font-medium opacity-90">{questions[currentQuestion].text}</span>
            </div>
            <div className="font-bold text-xl">
              {currentQuestion + 1} / {questions.length}
            </div>
          </div>
          
          <div className="p-8">
            <h3 className="text-2xl font-medium text-gray-900 mb-8 leading-relaxed">
              {questions[currentQuestion].question}
            </h3>
            
            <div className="space-y-4">
              {questions[currentQuestion].options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === questions[currentQuestion].correctAnswer;
                const showStatus = selectedAnswer !== null;
                
                let buttonClass = "w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ";
                
                if (!showStatus) {
                  buttonClass += "border-gray-200 hover:border-blue-500 hover:bg-blue-50";
                } else if (isCorrect) {
                  buttonClass += "border-emerald-500 bg-emerald-50";
                } else if (isSelected && !isCorrect) {
                  buttonClass += "border-red-500 bg-red-50";
                } else {
                  buttonClass += "border-gray-100 opacity-50";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={showStatus}
                    className={buttonClass}
                  >
                    <span className={cn(
                      "text-lg font-medium",
                      showStatus && isCorrect ? "text-emerald-700" :
                      showStatus && isSelected && !isCorrect ? "text-red-700" :
                      "text-gray-700"
                    )}>
                      {option}
                    </span>
                    {showStatus && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                    {showStatus && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2">Explicação</h4>
                    <p className="text-blue-800 leading-relaxed">{questions[currentQuestion].explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {showExplanation && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  {currentQuestion < questions.length - 1 ? 'Próxima Questão' : 'Ver Resultados'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'results' && (
        <div className="bg-white p-12 rounded-3xl border border-gray-200 shadow-sm text-center max-w-2xl mx-auto">
          <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Desafio Concluído!</h2>
          <p className="text-xl text-gray-500 mb-8">Você revisou {questions.length} descritores do SAEP.</p>
          
          <div className="bg-gray-50 rounded-2xl p-8 mb-8 inline-block min-w-[300px]">
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">XP Ganho</div>
            <div className="text-6xl font-black text-emerald-500">+{score}</div>
          </div>

          <div>
            <button
              onClick={resetGame}
              className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Voltar para a Arena
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
*/

// BIAnalysisView was unused, removed.
/*
function BIAnalysisView({ user, selectedModel }: { user: User | null, selectedModel: string }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dataStats, setDataStats] = useState<{ students: number, submissions: number, diagnostics: number } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch basic stats to show before generating
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'aluno')));
        const submissionsSnap = await getDocs(collection(db, 'exam_submissions'));
        const diagnosticsSnap = await getDocs(collection(db, 'diagnostics'));
        
        setDataStats({
          students: usersSnap.size,
          submissions: submissionsSnap.size,
          diagnostics: diagnosticsSnap.size
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users/exam_submissions/diagnostics');
      }
    };
    fetchStats();
  }, []);

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    toast.info("Gerando PDF da análise...");
    try {
      const filename = `Analise_BI_Educacional_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
      await pdfExportService.exportElementToPDF(reportRef.current, filename);
      toast.success("PDF exportado com sucesso!");
    } catch (err: any) {
      toast.error(`Erro ao exportar PDF: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      // 1. Fetch data
      const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'aluno')));
      const submissionsSnap = await getDocs(collection(db, 'exam_submissions'));
      const diagnosticsSnap = await getDocs(collection(db, 'diagnostics'));
      const examsSnap = await getDocs(collection(db, 'exams'));

      const students = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as UserProfile));
      const submissions = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as ExamSubmission));
      const diagnostics = diagnosticsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const exams = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as Exam));

      // 2. Format data for the prompt
      const studentsData = students.map(s => {
        const studentSubs = submissions.filter(sub => (sub as any).studentId === s.uid);
        const studentDiags = diagnostics.filter(d => (d as any).userId === s.uid || (d as any).aluno === s.displayName);
        
        const examsTaken = studentSubs.map(sub => {
          const exam = exams.find(e => e.id === (sub as any).resourceId);
          return {
            title: exam?.title || 'Desconhecido',
            subject: exam?.subject || 'Desconhecido',
            score: (sub as any).score,
            maxScore: (sub as any).maxScore || 100,
            date: (sub as any).completedAt?.toDate ? (sub as any).completedAt.toDate().toISOString() : (sub as any).completedAt
          };
        });

        return {
          id: s.uid,
          name: s.displayName || s.email,
          xp: s.xp || 0,
          level: s.level || 1,
          examsTaken,
          diagnosticsCount: studentDiags.length
        };
      });

      const prompt = `Você é um assistente especializado em análise de desempenho de alunos, com foco em Business Intelligence (BI) educacional.
Seu papel é analisar dados de alunos (notas, frequência, turma, disciplina, período, etc.) e gerar insights claros, objetivos e acionáveis para apoiar decisões pedagógicas.

A partir dos dados que eu fornecer, você deve:
- Calcular e descrever os principais indicadores de desempenho (médias, taxas, evolução, etc.)
- Destacar padrões relevantes, como melhora, queda, constância ou variações bruscas de desempenho
- Identificar alunos ou grupos em possível situação de risco (baixa média, alta taxa de faltas, queda acentuada, etc.)
- Comparar desempenho entre turmas, disciplinas ou períodos, quando houver dados para isso
- Sugerir ações pedagógicas ou intervenções práticas (reforço, acompanhamento, comunicação com responsáveis, etc.) com base nos dados
- Não inventar dados: quando algo não estiver disponível, deixe isso claro e, se fizer suposições, indique que são hipóteses.

DADOS DOS ALUNOS E DESEMPENHO:
${JSON.stringify(studentsData, null, 2)}

Formato obrigatório da resposta (use Markdown):

## Resumo geral da turma
Visão geral do desempenho da turma como um todo, em poucas frases.

## Métricas principais
(lista com valores. Ex: média geral de notas, média por disciplina, etc.)

## Alunos em destaque (positivo e em risco)
- Alunos com melhor desempenho ou evolução positiva.
- Alunos em possível situação de risco (notas baixas, queda brusca, etc.).

## Tendências e padrões
Padrões observados nos dados: melhoria geral, queda em determinada disciplina, etc.

## Recomendações práticas
Sugestões objetivas de ações pedagógicas ou de gestão.

Quando os dados forem poucos, incompletos ou inconsistentes, deixe isso explícito na análise, evitando tirar conclusões fortes sem base suficiente.`;

      const response = await generateContentWrapper({
        model: selectedModel,
        contents: prompt,
        config: {
          ...DEFAULT_CONFIG,
        }
      });

      setAnalysis(response.text || "Não foi possível gerar a análise.");
      toast.success("Análise de BI gerada com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar análise de BI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="text-emerald-600" size={32} />
            Análise de BI Educacional
          </h2>
          <p className="text-gray-500 mt-2">
            Gere insights pedagógicos acionáveis baseados no desempenho real dos alunos usando Inteligência Artificial.
          </p>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading || !dataStats || dataStats.students === 0}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-100"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
          {loading ? 'Analisando Dados...' : 'Gerar Análise Completa'}
        </button>
      </div>

      {!analysis && dataStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{dataStats.students}</div>
              <div className="text-sm text-gray-500">Alunos Registrados</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckSquare className="text-emerald-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{dataStats.submissions}</div>
              <div className="text-sm text-gray-500">Simulados Realizados</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">+5.2%</div>
              <div className="text-sm text-gray-500">Evolução</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">Álgebra</div>
              <div className="text-sm text-gray-500">Comp. Crítica</div>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-lg shadow-gray-200"
            >
              {isExporting ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
              {isExporting ? 'Exportando...' : 'Exportar Relatório PDF'}
            </button>
          </div>
          <div ref={reportRef} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-emerald-900 p-8 text-white">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <BarChart3 size={28} className="text-emerald-400" />
                Relatório de Inteligência Pedagógica
              </h3>
              <p className="text-emerald-100/80 mt-2">
                Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <div className="p-8 md:p-12">
              <div className="prose prose-emerald max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600">
                <Markdown>{analysis}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {!analysis && !loading && (
        <div className="bg-gray-50 p-12 rounded-[2rem] border-2 border-dashed border-gray-200 text-center space-y-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <TrendingUp className="text-gray-400" size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-700">Pronto para analisar os dados</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Clique no botão acima para que a Inteligência Artificial processe todas as notas, simulados e diagnósticos e gere um relatório de BI completo.
          </p>
        </div>
      )}
    </motion.div>
  );
}
*/

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

    let secondaryApp;
    try {
      // Initialize a secondary app to create the user without signing out the admin
      const { getApps, initializeApp } = await import('firebase/app');
      const apps = getApps();
      secondaryApp = apps.find(app => app.name === "SecondaryApp") || initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getSecondaryAuth(secondaryApp);
      
      const result = await createSecondaryUser(secondaryAuth, newEmail, newPassword);
      const newUser = result.user;

      // Save user profile in Firestore
      const userRef = doc(db, 'users', newUser.uid);
      await setDoc(userRef, {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newName || newEmail.split('@')[0],
        photoURL: '',
        emailVerified: false,
        role: newRole,
        createdAt: new Date().toISOString()
      });

      await secondaryAuth.signOut();
      toast.success(`Usuário ${newEmail} criado com sucesso!`);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('aluno');
    } catch (err: any) {
      console.error("Error creating user", err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error("Este e-mail já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        toast.error("A senha deve ter pelo menos 6 caracteres.");
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error("O cadastro por e-mail/senha não está habilitado no Firebase Console.");
      } else if (err.code === 'permission-denied' || err.message?.includes('permission-denied')) {
        toast.error("Você não tem permissão para criar usuários.");
      } else {
        toast.error(`Erro ao criar usuário: ${err.message || "Verifique os dados."}`);
      }
    } finally {
      if (secondaryApp) {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(secondaryApp).catch(console.error);
      }
      setCreating(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    // if (!window.confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita no banco de dados.")) return;
    toast.info("Excluindo usuário...");
    
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success("Usuário removido com sucesso do banco de dados.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleToggleGamification = async (uid: string, currentStatus: boolean | undefined) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        gamificationEnabled: !currentStatus
      });
      toast.success(`Gamificação ${!currentStatus ? 'ativada' : 'desativada'} para o usuário.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleSendPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`E-mail de redefinição de senha enviado para ${email}`);
    } catch (err: any) {
      console.error("Error sending password reset", err);
      toast.error(`Erro ao enviar e-mail: ${err.message}`);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportUsers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        if (rows.length === 0) {
          toast.error("A planilha está vazia.");
          return;
        }

        setCreating(true);
        let successCount = 0;
        let errorCount = 0;

        let secondaryApp;
        try {
          const { getApps, initializeApp } = await import('firebase/app');
          const apps = getApps();
          secondaryApp = apps.find(app => app.name === "SecondaryApp") || initializeApp(firebaseConfig, "SecondaryApp");
          const secondaryAuth = getSecondaryAuth(secondaryApp);

          for (const row of rows) {
            const email = row.email || row.Email || row.EMAIL;
            const name = row.nome || row.Nome || row.name || row.Name || row.NOME;
            const role = (row.perfil || row.Perfil || row.role || row.Role || 'aluno').toLowerCase();
            const password = row.senha || row.Senha || row.password || row.Password || '123456';

            if (!email) {
              errorCount++;
              continue;
            }

            try {
              const result = await createSecondaryUser(secondaryAuth, email, password);
              const newUser = result.user;

              const userRef = doc(db, 'users', newUser.uid);
              await setDoc(userRef, {
                uid: newUser.uid,
                email: newUser.email,
                displayName: name || email.split('@')[0],
                photoURL: '',
                emailVerified: false,
                role: ['aluno', 'professor', 'admin'].includes(role) ? role : 'aluno',
                createdAt: new Date().toISOString()
              });

              successCount++;
            } catch (err: any) {
              console.error(`Error creating user ${email}:`, err);
              errorCount++;
            }
          }

          await secondaryAuth.signOut();
          toast.success(`Importação concluída: ${successCount} criados, ${errorCount} erros.`);
        } catch (err: any) {
          console.error("Error in bulk import", err);
          toast.error("Erro fatal na importação.");
        } finally {
          if (secondaryApp) {
            const { deleteApp } = await import('firebase/app');
            await deleteApp(secondaryApp).catch(console.error);
          }
          setCreating(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        toast.error("Erro ao ler o arquivo CSV.");
        console.error(err);
      }
    });
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

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Importação em Massa</h4>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImportUsers}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={creating}
              className="w-full py-2 bg-white border-2 border-dashed border-gray-300 text-gray-600 rounded-xl font-medium hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              Importar CSV
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              A planilha deve conter as colunas: Nome, Email, Senha, Perfil
            </p>
          </div>
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
                    <th className="pb-3 font-bold text-gray-400 uppercase tracking-wider text-xs">Gamificação</th>
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
                        {u.createdAt ? ((u.createdAt as any).seconds ? new Date((u.createdAt as any).seconds * 1000).toLocaleDateString('pt-BR') : new Date(u.createdAt as any).toLocaleDateString('pt-BR')) : '-'}
                      </td>
                      <td className="py-3">
                        {u.role === 'aluno' && (
                          <button
                            onClick={() => handleToggleGamification(u.uid, u.gamificationEnabled)}
                            className={cn(
                              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                              u.gamificationEnabled ? "bg-emerald-500" : "bg-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                u.gamificationEnabled ? "translate-x-5" : "translate-x-1"
                              )}
                            />
                          </button>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleSendPassword(u.email)}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Enviar E-mail de Redefinição de Senha"
                          >
                            <Mail size={16} />
                          </button>
                          {u.uid !== user?.uid && (
                            <button 
                              onClick={() => handleDeleteUser(u.uid)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              title="Excluir Usuário"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
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
      handleFirestoreError(err, OperationType.WRITE, path);
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
              "max-w-[85%] px-4 py-3 text-sm shadow-sm transition-all hover:shadow-md overflow-x-auto",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-2xl rounded-tr-none" 
                : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none"
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
  const [webhookUrl, setWebhookUrl] = useState(profile?.settings?.webhookUrl || '');
  const [globalWebhookUrl, setGlobalWebhookUrl] = useState('');
  const [defaultGrade, setDefaultGrade] = useState(profile?.preferences?.defaultGrade || '');
  const [language, setLanguage] = useState(profile?.preferences?.language || 'Português');
  const [isTesting, setIsTesting] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setTheme(profile.settings?.theme || 'light');
      setNotifications(profile.settings?.notifications ?? true);
      setWebhookUrl(profile.settings?.webhookUrl || '');
      setDefaultGrade(profile.preferences?.defaultGrade || '');
      setLanguage(profile.preferences?.language || 'Português');
    }
  }, [profile]);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGlobalWebhookUrl(docSnap.data().webhookUrl || '');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'settings/global');
      }
    };
    fetchGlobalSettings();
  }, []);

  const handleTestWebhook = async (url: string, type: 'user' | 'global') => {
    if (!url) {
      toast.error('Informe uma URL para testar.');
      return;
    }
    setIsTesting(type);
    try {
      const success = await testWebhook(url, {
        message: 'Este é um teste de integração do Plano de Estudos Automático.',
        user: user?.email
      });
      
      if (success) {
        toast.success('Webhook testado com sucesso!');
      } else {
        toast.error('Erro no teste do webhook. Verifique os logs do n8n.');
      }
    } catch (err) {
      toast.error('Erro ao conectar com o webhook. Verifique a URL e o CORS.');
      console.error("Webhook Test Error:", err);
    } finally {
      setIsTesting(null);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        settings: { theme, notifications, webhookUrl },
        preferences: { defaultGrade, language },
        updatedAt: new Date().toISOString()
      });

      if (profile?.role === 'admin') {
        await setDoc(doc(db, 'settings', 'global'), {
          webhookUrl: globalWebhookUrl,
          updatedBy: user.uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

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
            <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-2xl border border-gray-200 shadow-sm" referrerPolicy="no-referrer" crossOrigin="anonymous" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl shadow-sm">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user?.displayName}</h3>
            <p className="text-gray-500">{user?.email}</p>
            {profile?.matricula && (
              <p className="text-sm font-bold text-emerald-600 mt-1">Matrícula: {profile.matricula}</p>
            )}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Webhook URL (n8n / Automação)</label>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tighter">Opcional</span>
            </div>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                  <input 
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://seu-n8n.com/webhook/..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => handleTestWebhook(webhookUrl, 'user')}
                  disabled={isTesting === 'user' || !webhookUrl}
                  className="px-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-bold text-xs hover:bg-emerald-100 transition-all disabled:opacity-50"
                >
                  {isTesting === 'user' ? <Loader2 className="animate-spin" size={16} /> : 'Testar'}
                </button>
              </div>
            <p className="text-[10px] text-gray-400 italic">Sempre que um diagnóstico for gerado, os dados serão enviados para esta URL.</p>
          </div>

          {profile?.role === 'admin' && (
            <div className="space-y-2 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                  <Settings size={14} />
                  Webhook Global (n8n / Automação)
                </label>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded uppercase tracking-tighter">Admin Only</span>
              </div>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" size={18} />
                    <input 
                      type="url"
                      value={globalWebhookUrl}
                      onChange={(e) => setGlobalWebhookUrl(e.target.value)}
                      placeholder="https://seu-n8n.com/webhook/global/..."
                      className="w-full pl-12 pr-4 py-3 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={() => handleTestWebhook(globalWebhookUrl, 'global')}
                    disabled={isTesting === 'global' || !globalWebhookUrl}
                    className="px-4 bg-purple-100 text-purple-700 rounded-xl border border-purple-200 font-bold text-xs hover:bg-purple-200 transition-all disabled:opacity-50"
                  >
                    {isTesting === 'global' ? <Loader2 className="animate-spin" size={16} /> : 'Testar'}
                  </button>
                </div>
              <p className="text-[10px] text-purple-600 italic">Esta URL será usada como padrão para todos os usuários que não tiverem um webhook pessoal configurado.</p>
            </div>
          )}

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

function AlunoView({ result, onUpdateResult, diagnosticId, userProfile, history, classAverages, selectedModel }: { result: DiagnosticResult | null, onUpdateResult: (newResult: DiagnosticResult) => void, diagnosticId: string | null, userProfile: UserProfile | null, history: any[], classAverages: Record<string, number>, selectedModel: string }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'Todos' | 'Forte' | 'Atenção' | 'Crítico'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [editingComp, setEditingComp] = useState<string | null>(null);
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null);
  const [editingQuestionFeedback, setEditingQuestionFeedback] = useState<string | null>(null);
  const [editingPrivateNote, setEditingPrivateNote] = useState<string | null>(null);
  const [activeQuestionTabs, setActiveQuestionTabs] = useState<Record<string, 'question' | 'feedback'>>({});
  const [editValue, setEditValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [notaValue, setNotaValue] = useState<string | number>('');
  const [privateNoteValue, setPrivateNoteValue] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});
  const reportRef = useRef<HTMLDivElement>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);

  const studentHistory = useMemo(() => {
    if (!result || !history) return [];
    return history
      .filter(h => h.result?.aluno === result.aluno)
      .sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateA - dateB;
      });
  }, [result, history]);

  const fetchSuggestions = async (comp: any) => {
    if (suggestions[comp.competencia]) return;
    setLoadingSuggestions(prev => ({ ...prev, [comp.competencia]: true }));
    try {
      const newSuggestions = await generateSuggestions(comp.conhecimentos_fracos, comp.recomendacoes, selectedModel, userProfile?.role as any || 'aluno');
      setSuggestions(prev => ({ ...prev, [comp.competencia]: newSuggestions }));
    } catch (err) {
      toast.error("Erro ao gerar sugestões.");
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [comp.competencia]: false }));
    }
  };

  const isProfessor = userProfile?.role === 'professor' || userProfile?.role === 'admin';

  const setQuestionTab = (questionKey: string, tab: 'question' | 'feedback') => {
    setActiveQuestionTabs(prev => ({ ...prev, [questionKey]: tab }));
  };

  const exportToPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      await pdfExportService.exportDiagnosticReport(result, userProfile);
      toast.success('Relatório exportado com sucesso!');
    } catch (err: any) {
      toast.error(`Erro ao gerar o PDF do relatório: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateRecoveryPlan = async () => {
    if (!result) return;
    setGeneratingPlan(true);
    try {
      // 1. Find student ID from exam_submissions
      const submissionsQuery = query(
        collection(db, 'exam_submissions'),
        where('studentName', '==', result.aluno)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      let studentId = '';
      if (!submissionsSnapshot.empty) {
        studentId = submissionsSnapshot.docs[0].data().studentId;
      } else {
        // Fallback: try to find in users by name
        const usersQuery = query(
          collection(db, 'users'),
          where('displayName', '==', result.aluno)
        );
        const usersSnapshot = await getDocs(usersQuery);
        if (!usersSnapshot.empty) {
          studentId = usersSnapshot.docs[0].id;
        }
      }

      if (!studentId) {
        toast.error("Não foi possível identificar o ID do aluno para buscar erros cognitivos.");
        setGeneratingPlan(false);
        return;
      }

      // 2. Fetch cognitive analyses
      const analysesQuery = query(
        collection(db, 'cognitive_error_analyses'),
        where('userId', '==', studentId)
      );
      const analysesSnapshot = await getDocs(analysesQuery);
      
      if (analysesSnapshot.empty) {
        toast.warning("Nenhuma análise de erro cognitivo encontrada para este aluno. Gere a análise primeiro.");
        setGeneratingPlan(false);
        return;
      }

      const studentAnalyses = analysesSnapshot.docs.map(doc => doc.data());
      const aggregatedErrors = studentAnalyses.reduce((acc: any[], curr: any) => {
        return acc.concat(curr.errors || []);
      }, []);

      const studentData = {
        studentId,
        studentName: result.aluno,
        totalErrors: aggregatedErrors.length,
        errors: aggregatedErrors
      };

      // 3. Generate Plan
      const plan = await generateRecoveryPlan(studentData, selectedModel, userProfile?.role as any || 'aluno');
      
      // 4. Save to Firestore
      await addDoc(collection(db, 'recovery_plans'), {
        userId: studentId,
        studentName: result.aluno,
        ...plan,
        diagnosticId: diagnosticId,
        createdAt: serverTimestamp()
      });

      // 5. Notify student (Internal)
      const { notificationService } = await import('./services/notificationService');
      await notificationService.createNotification({
        userId: studentId,
        title: 'Novo Plano de Recuperação',
        message: 'Um novo plano de estudos personalizado foi gerado para você.',
        type: 'info' as any,
        link: '/study-plan'
      });

      // 6. Notify student (n8n - External)
      try {
        const studentDoc = await getDoc(doc(db, 'users', studentId));
        const studentInfo = studentDoc.exists() ? studentDoc.data() : null;
        
        await n8nEvents.recoveryPlanGenerated({
          studentId,
          studentEmail: studentInfo?.email,
          studentName: result.aluno,
          submissionId: diagnosticId || 'diagnostic',
          plan: plan
        });
      } catch (n8nErr) {
        console.warn("Failed to trigger n8n notification:", n8nErr);
      }

      toast.success("Plano de recuperação gerado e enviado com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'recovery_plans');
      toast.error("Erro ao gerar plano de recuperação.");
    } finally {
      setGeneratingPlan(false);
    }
  };

  const filteredCompetencias = useMemo(() => {
    if (!result) return [];
    let comps = result.diagnostico_por_competencia;
    
    if (filter !== 'Todos') {
      comps = comps.filter(c => c.nivel === filter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      comps = comps.filter(c => c.competencia.toLowerCase().includes(term));
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

  const nextStepComp = useMemo(() => {
    if (!result) return null;
    return [...result.diagnostico_por_competencia].sort((a, b) => a.acuracia_ponderada - b.acuracia_ponderada)[0];
  }, [result]);

  const handleSaveEdit = async (competenciaName: string, type: 'recommendation' | 'privateNote' | 'professorFeedback' | 'questionFeedback' | 'professorNota' | 'questionNota' | 'fullFeedback' | 'fullQuestionFeedback' | 'questionPrivateNote' | 'studentMessage', value?: string | number, questionId?: string | number, nota?: string | number) => {
    if (!result) return;
    let updatedResult = { ...result };
    const newCompetencias = [...result.diagnostico_por_competencia];
    const idx = newCompetencias.findIndex(c => c.competencia === competenciaName);

    if (type === 'studentMessage') {
      updatedResult = { ...result, mensagem_para_o_aluno: (value !== undefined ? value : editValue) as string };
    } else if (idx !== -1) {
      if (type === 'recommendation') {
        newCompetencias[idx] = { ...newCompetencias[idx], recomendacoes: (value !== undefined ? value : editValue) as string };
      } else if (type === 'professorFeedback') {
        newCompetencias[idx] = { ...newCompetencias[idx], professor_feedback: (value !== undefined ? value : feedbackValue) as string };
      } else if (type === 'professorNota') {
        newCompetencias[idx] = { ...newCompetencias[idx], professor_nota: value !== undefined ? value : notaValue };
      } else if (type === 'fullFeedback') {
        newCompetencias[idx] = { 
          ...newCompetencias[idx], 
          professor_feedback: (value !== undefined ? value : feedbackValue) as string,
          professor_nota: nota !== undefined ? nota : notaValue
        };
      } else if (type === 'questionFeedback') {
        const qIdx = newCompetencias[idx].questoes?.findIndex(q => q.id === questionId);
        if (qIdx !== undefined && qIdx !== -1 && newCompetencias[idx].questoes) {
          const updatedQuestoes = [...newCompetencias[idx].questoes!];
          updatedQuestoes[qIdx] = { ...updatedQuestoes[qIdx], professor_feedback: (value !== undefined ? value : feedbackValue) as string };
          newCompetencias[idx] = { ...newCompetencias[idx], questoes: updatedQuestoes };
        }
      } else if (type === 'questionNota') {
        const qIdx = newCompetencias[idx].questoes?.findIndex(q => q.id === questionId);
        if (qIdx !== undefined && qIdx !== -1 && newCompetencias[idx].questoes) {
          const updatedQuestoes = [...newCompetencias[idx].questoes!];
          updatedQuestoes[qIdx] = { ...updatedQuestoes[qIdx], professor_nota: value !== undefined ? value : notaValue };
          newCompetencias[idx] = { ...newCompetencias[idx], questoes: updatedQuestoes };
        }
      } else if (type === 'fullQuestionFeedback') {
        const qIdx = newCompetencias[idx].questoes?.findIndex(q => q.id === questionId);
        if (qIdx !== undefined && qIdx !== -1 && newCompetencias[idx].questoes) {
          const updatedQuestoes = [...newCompetencias[idx].questoes!];
          updatedQuestoes[qIdx] = { 
            ...updatedQuestoes[qIdx], 
            professor_feedback: (value !== undefined ? value : feedbackValue) as string,
            professor_nota: nota !== undefined ? nota : notaValue
          };
          newCompetencias[idx] = { ...newCompetencias[idx], questoes: updatedQuestoes };
        }
      } else if (type === 'questionPrivateNote') {
        const qIdx = newCompetencias[idx].questoes?.findIndex(q => q.id === questionId);
        if (qIdx !== undefined && qIdx !== -1 && newCompetencias[idx].questoes) {
          const updatedQuestoes = [...newCompetencias[idx].questoes!];
          updatedQuestoes[qIdx] = { ...updatedQuestoes[qIdx], private_notes: (value !== undefined ? value : privateNoteValue) as string };
          newCompetencias[idx] = { ...newCompetencias[idx], questoes: updatedQuestoes };
        }
      } else {
        newCompetencias[idx] = { ...newCompetencias[idx], private_notes: (value !== undefined ? value : privateNoteValue) as string };
      }
      updatedResult = { ...result, diagnostico_por_competencia: newCompetencias };
    }
    
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
    
    setEditingComp(null);
    setEditingFeedback(null);
    setEditingQuestionFeedback(null);
    setEditingPrivateNote(null);
    setNotaValue('');
    setFeedbackValue('');
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

        <div className="flex gap-3">
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}/shared-diagnostic/${diagnosticId}`;
              navigator.clipboard.writeText(shareUrl);
              toast.success("Link de compartilhamento copiado!");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
          >
            <Share2 size={14} />
            Compartilhar
          </button>

          <button
            onClick={handleGenerateRecoveryPlan}
            disabled={generatingPlan}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
          >
            {generatingPlan ? <Loader2 className="animate-spin" size={14} /> : <Brain size={14} />}
            Gerar Plano de Recuperação
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

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm flex flex-col md:w-1/2 relative group">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-emerald-900">Mensagem para o Aluno</h3>
              {isProfessor && editingComp !== 'studentMessage' && (
                <button 
                  onClick={() => {
                    setEditingComp('studentMessage');
                    setEditValue(result.mensagem_para_o_aluno);
                  }}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
            
            {editingComp === 'studentMessage' ? (
              <div className="space-y-3">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border-2 border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px] transition-all bg-white"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setEditingComp(null)}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleSaveEdit('', 'studentMessage')}
                    className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                  >
                    <Check size={14} />
                    Salvar Mensagem
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-lg leading-relaxed text-emerald-800 font-medium italic">
                "{result.mensagem_para_o_aluno}"
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Média</p>
              <p className="text-xl font-bold text-emerald-900">{(result.summary.acuracia_ponderada * 100).toFixed(1)}%</p>
            </div>
            <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Acertos</p>
              <p className="text-xl font-bold text-blue-900">{result.summary.acertos}/{result.summary.total_questoes}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
            {/* Error Category Summary */}
            {result.diagnostico_por_competencia.some(c => c.questoes?.some(q => !q.acertou && q.analise_erro)) && (
              <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Brain size={20} className="text-amber-600" />
                  <h3 className="text-xl font-bold text-gray-900">Perfil de Dificuldades Cognitivas</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Interpretação', 'Conceito', 'Atenção', 'Lógica'].map(cat => {
                    const count = result.diagnostico_por_competencia.reduce((acc, c) => 
                      acc + (c.questoes?.filter(q => !q.acertou && q.analise_erro?.categoria === cat).length || 0), 0
                    );
                    if (count === 0) return null;
                    return (
                      <div key={cat} className={cn(
                        "p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all",
                        cat === 'Interpretação' ? "bg-blue-50 border-blue-100" :
                        cat === 'Conceito' ? "bg-emerald-50 border-emerald-100" :
                        cat === 'Atenção' ? "bg-amber-50 border-amber-100" :
                        "bg-red-50 border-red-100"
                      )}>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest mb-1",
                          cat === 'Interpretação' ? "text-blue-600" :
                          cat === 'Conceito' ? "text-emerald-600" :
                          cat === 'Atenção' ? "text-amber-600" :
                          "text-red-600"
                        )}>{cat}</p>
                        <p className={cn(
                          "text-3xl font-black",
                          cat === 'Interpretação' ? "text-blue-900" :
                          cat === 'Conceito' ? "text-emerald-900" :
                          cat === 'Atenção' ? "text-amber-900" :
                          "text-red-900"
                        )}>{count}</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">Ocorrências</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Steps Section */}
            <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl border border-emerald-500 shadow-lg text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Seus Próximos Passos</h3>
                  <p className="text-emerald-100 text-xs">Roteiro personalizado para sua evolução</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority 1: Critical Competencies */}
                {result.diagnostico_por_competencia.filter(c => c.nivel === 'Crítico').length > 0 ? (
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-50">Prioridade Máxima</p>
                    </div>
                    <p className="text-sm font-medium mb-2">Focar nas competências críticas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.diagnostico_por_competencia.filter(c => c.nivel === 'Crítico').map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-500/30 text-[10px] font-bold rounded-md border border-red-400/30">
                          {c.competencia}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-50">Excelente Trabalho</p>
                    </div>
                    <p className="text-sm font-medium">Você não possui competências em nível crítico! Continue assim.</p>
                  </div>
                )}

                {/* Priority 2: Study Plan */}
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-emerald-200" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-50">Plano de 7 Dias</p>
                  </div>
                  <p className="text-sm font-medium mb-2">Siga o cronograma gerado para reforçar seus pontos fracos.</p>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('recovery-plan');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[10px] font-bold bg-white text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    Ver Cronograma
                  </button>
                </div>

                {/* Priority 3: Cognitive Focus */}
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={14} className="text-emerald-200" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-50">Foco Cognitivo</p>
                  </div>
                  {(() => {
                    const errors = result.diagnostico_por_competencia.flatMap(c => c.questoes?.filter(q => !q.acertou && q.analise_erro) || []);
                    const categories = errors.map(e => e.analise_erro?.categoria);
                    const mostCommon = categories.reduce((acc, cat) => {
                      if (!cat) return acc;
                      acc[cat] = (acc[cat] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    const topCat = Object.entries(mostCommon).sort((a, b) => b[1] - a[1])[0];
                    
                    if (!topCat) return <p className="text-sm font-medium">Analise seus acertos para manter o padrão!</p>;
                    
                    return (
                      <>
                        <p className="text-sm font-medium mb-2">Atenção redobrada em: <span className="font-bold underline">{topCat[0]}</span></p>
                        <p className="text-[10px] text-emerald-100 leading-relaxed">
                          {topCat[0] === 'Interpretação' ? "Leia os enunciados duas vezes e destaque as palavras-chave." :
                           topCat[0] === 'Conceito' ? "Revise a teoria base antes de partir para os exercícios." :
                           topCat[0] === 'Atenção' ? "Faça uma revisão final antes de entregar suas respostas." :
                           "Trabalhe o passo a passo do seu raciocínio lógico."}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Overall Evolution History */}
            {studentHistory.length > 1 && (
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <History size={20} className="text-emerald-600" />
                  <h3 className="text-xl font-bold text-gray-900">Histórico de Evolução Geral</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studentHistory.map(h => ({
                      date: h.createdAt?.seconds ? new Date(h.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A',
                      acuracia: Math.round((h.result?.summary?.acuracia_ponderada || 0) * 100)
                    }))}>
                      <defs>
                        <linearGradient id="colorAcuracia" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#9ca3af' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tick={{ fontSize: 10, fill: '#9ca3af' }} 
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-emerald-600">{payload[0].value}%</span>
                                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">Média</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="acuracia" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorAcuracia)" 
                        dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ 
                          r: 12, 
                          fill: '#10b981', 
                          strokeWidth: 4, 
                          stroke: '#fff',
                          className: "drop-shadow-md transition-all duration-300"
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-4 text-xs text-gray-500 text-center italic">
                  Este gráfico mostra a evolução da média ponderada do aluno ao longo dos últimos diagnósticos realizados.
                </p>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-900">Análise por Competência</h3>
              </div>
              
              {/* Cognitive Error Legend */}
              <div className="flex flex-wrap gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Interpretação:</span>
                  <span className="text-[9px] text-gray-400">Compreensão do enunciado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Conceito:</span>
                  <span className="text-[9px] text-gray-400">Domínio teórico</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Atenção:</span>
                  <span className="text-[9px] text-gray-400">Foco e detalhes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Lógica:</span>
                  <span className="text-[9px] text-gray-400">Raciocínio e processos</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar competência..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Nível:</span>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as any)}
                      className="px-3 py-1.5 bg-gray-100 border-none rounded-xl text-[10px] font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="Todos">Todos os Níveis</option>
                      <option value="Forte">Forte</option>
                      <option value="Atenção">Atenção</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </div>

                  <div className="hidden sm:flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                  {['Todos', 'Forte', 'Atenção', 'Crítico'].map((f) => {
                    const count = f === 'Todos' 
                      ? result.diagnostico_por_competencia.length 
                      : result.diagnostico_por_competencia.filter(c => c.nivel === f).length;
                    
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={cn(
                          "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 whitespace-nowrap",
                          filter === f 
                            ? "bg-white text-emerald-600 shadow-sm" 
                            : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        {f !== 'Todos' && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            f === 'Forte' ? "bg-emerald-500" :
                            f === 'Atenção' ? "bg-amber-500" :
                            "bg-red-500"
                          )} />
                        )}
                        {f}
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-md text-[9px] transition-colors",
                          filter === f ? "bg-emerald-50 text-emerald-600" : "bg-gray-200 text-gray-500"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.5 }}
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
                          {nextStepComp?.competencia === comp.competencia && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold shadow-sm">
                              <Zap size={12} />
                              PRÓXIMO PASSO
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar and Class Comparison */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className={cn(
                              comp.nivel === 'Forte' ? "text-emerald-600" :
                              comp.nivel === 'Atenção' ? "text-amber-600" :
                              "text-red-600"
                            )}>Domínio da Competência</span>
                            <span className="text-gray-500">{Math.round(comp.acuracia_ponderada * 100)}%</span>
                          </div>
                          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50 shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${comp.acuracia_ponderada * 100}%` }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full relative",
                                comp.nivel === 'Forte' ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
                                comp.nivel === 'Atenção' ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                                "bg-gradient-to-r from-red-400 to-red-500"
                              )}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </motion.div>
                          </div>
                        </div>

                        {/* Class Comparison Indicator */}
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Média da Turma</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-700">{Math.round(classAverages[comp.competencia] || 0)}%</span>
                            <div className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                              (comp.acuracia_ponderada * 100) >= (classAverages[comp.competencia] || 0) 
                                ? "bg-emerald-100 text-emerald-700" 
                                : "bg-red-100 text-red-700"
                            )}>
                              {(comp.acuracia_ponderada * 100) >= (classAverages[comp.competencia] || 0) ? "Acima" : "Abaixo"}
                            </div>
                          </div>
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

                              {/* New Feedback Field */}
                              <div className="mt-4 pt-4 border-t border-red-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-xs font-bold text-red-800 uppercase tracking-wider">Feedback do Professor</h5>
                                  {isProfessor && (
                                    editingFeedback === comp.competencia ? (
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => handleSaveEdit(comp.competencia, 'professorFeedback', feedbackValue)}
                                          className="text-[10px] font-bold text-red-600 hover:text-red-700"
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
                                    ) : (
                                      <button 
                                        onClick={() => {
                                          setEditingFeedback(comp.competencia);
                                          setFeedbackValue(comp.professor_feedback || '');
                                        }}
                                        className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                                      >
                                        <Pencil size={10} />
                                        Editar
                                      </button>
                                    )
                                  )}
                                </div>
                                {editingFeedback === comp.competencia ? (
                                  <textarea
                                    value={feedbackValue}
                                    onChange={(e) => setFeedbackValue(e.target.value)}
                                    className="w-full p-3 text-sm text-gray-600 bg-white border border-red-200 rounded-lg focus:ring-1 focus:ring-red-400 outline-none min-h-[80px]"
                                    autoFocus
                                  />
                                ) : (
                                  <p className="text-sm text-red-700 leading-relaxed italic">
                                    {comp.professor_feedback || 'Nenhum feedback fornecido.'}
                                  </p>
                                )}
                              </div>
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

                          {/* Private Notes Field */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Notas Privadas do Professor</h5>
                              {isProfessor && (
                                editingPrivateNote === comp.competencia ? (
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handleSaveEdit(comp.competencia, 'privateNote', privateNoteValue)}
                                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                                    >
                                      Salvar
                                    </button>
                                    <button 
                                      onClick={() => setEditingPrivateNote(null)}
                                      className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
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
                                )
                              )}
                            </div>
                            {editingPrivateNote === comp.competencia ? (
                              <textarea
                                value={privateNoteValue}
                                onChange={(e) => setPrivateNoteValue(e.target.value)}
                                className="w-full p-3 text-sm text-gray-600 bg-white border border-emerald-200 rounded-lg focus:ring-1 focus:ring-emerald-400 outline-none min-h-[60px]"
                                autoFocus
                              />
                            ) : (
                              <p className="text-sm text-gray-600 leading-relaxed italic">
                                {comp.private_notes || 'Nenhuma nota privada.'}
                              </p>
                            )}
                          </div>

                          {/* Competency Evolution Chart */}
                          {studentHistory.length > 1 && (
                            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                              <div className="flex items-center gap-2">
                                <History size={14} className="text-emerald-600" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evolução de Desempenho</p>
                              </div>
                              <div className="h-40 w-full bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={studentHistory.map(h => {
                                    const c = h.result?.diagnostico_por_competencia?.find((dc: any) => dc.competencia === comp.competencia);
                                    return {
                                      date: h.createdAt?.seconds ? new Date(h.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A',
                                      acuracia: c ? Math.round(c.acuracia_ponderada * 100) : 0
                                    };
                                  })}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis 
                                      dataKey="date" 
                                      tick={{ fontSize: 10, fill: '#9ca3af' }} 
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <YAxis 
                                      domain={[0, 100]} 
                                      tick={{ fontSize: 10, fill: '#9ca3af' }} 
                                      axisLine={false}
                                      tickLine={false}
                                      width={25}
                                    />
                                    <Tooltip 
                                      content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100 animate-in fade-in zoom-in duration-200">
                                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                                              <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-bold text-emerald-600">{payload[0].value}%</span>
                                                <span className="text-[8px] text-gray-500 font-medium uppercase tracking-tighter">Média</span>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="acuracia" 
                                      stroke="#10b981" 
                                      strokeWidth={3} 
                                      dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                      activeDot={{ 
                                        r: 10, 
                                        fill: '#10b981', 
                                        strokeWidth: 3, 
                                        stroke: '#fff',
                                        className: "drop-shadow-sm transition-all duration-300"
                                      }}
                                      isAnimationActive={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {/* Professor Feedback Section */}
                          {(isProfessor || comp.nivel === 'Crítico' || comp.acertos < comp.total_questoes) && (
                            <div className={cn(
                              "mt-6 pt-6 border-t border-gray-100 space-y-4",
                              comp.nivel === 'Crítico' && "bg-red-50/20 -mx-6 px-6 pb-6 rounded-b-2xl"
                            )}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <MessageSquare size={14} className={comp.nivel === 'Crítico' ? "text-red-500" : "text-emerald-500"} />
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Feedback do Professor</p>
                                </div>
                                {isProfessor && (
                                  editingFeedback !== comp.competencia ? (
                                    <button 
                                      onClick={() => {
                                        setEditingFeedback(comp.competencia);
                                        setFeedbackValue(comp.professor_feedback || '');
                                        setNotaValue(comp.professor_nota || '');
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
                                <div className="space-y-4 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-1 space-y-2">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                        <Star size={10} className="text-amber-500" />
                                        Nota (0-10)
                                      </label>
                                      <input
                                        type="text"
                                        value={notaValue}
                                        onChange={(e) => setNotaValue(e.target.value)}
                                        className={cn(
                                          "w-full p-3 text-lg font-black rounded-xl focus:ring-2 outline-none transition-all text-center",
                                          comp.nivel === 'Crítico' 
                                            ? "text-red-900 bg-red-50 border-2 border-red-100 focus:ring-red-400 focus:border-red-400" 
                                            : "text-emerald-900 bg-emerald-50 border-2 border-emerald-100 focus:ring-emerald-400 focus:border-emerald-400"
                                        )}
                                        placeholder="0.0"
                                      />
                                      <div className="grid grid-cols-3 gap-1">
                                        {[0, 2.5, 5, 7.5, 10].map(v => (
                                          <button
                                            key={v}
                                            onClick={() => setNotaValue(v.toString())}
                                            className="py-1 text-[9px] font-bold bg-gray-100 text-gray-600 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                                          >
                                            {v}
                                          </button>
                                        ))}
                                        <button
                                          onClick={() => setNotaValue('')}
                                          className="py-1 text-[9px] font-bold bg-gray-100 text-gray-600 rounded hover:bg-red-100 hover:text-red-700 transition-colors flex items-center justify-center"
                                        >
                                          <RotateCcw size={8} />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                        <MessageSquare size={10} className="text-emerald-500" />
                                        Explicação Pedagógica
                                      </label>
                                      <textarea
                                        value={feedbackValue}
                                        onChange={(e) => setFeedbackValue(e.target.value)}
                                        className={cn(
                                          "w-full p-3 text-sm rounded-xl focus:ring-2 outline-none min-h-[100px] transition-all",
                                          comp.nivel === 'Crítico' 
                                            ? "text-red-900 bg-red-50 border-2 border-red-100 focus:ring-red-400 focus:border-red-400" 
                                            : "text-emerald-900 bg-emerald-50 border-2 border-emerald-100 focus:ring-emerald-400 focus:border-emerald-400"
                                        )}
                                        placeholder="Como o aluno pode melhorar?"
                                        autoFocus
                                      />
                                      
                                      {/* Quick Suggestions */}
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase mr-1 self-center">Sugestões:</span>
                                        {(comp.competencia === 'Cálculo Algébrico' 
                                          ? [
                                              "Atenção aos sinais nas operações.",
                                              "Revise a propriedade distributiva.",
                                              "Cuidado ao agrupar termos semelhantes.",
                                              "Revise a regra de sinais.",
                                              "Domínio excelente de simplificação."
                                            ]
                                          : [
                                              "Excelente progresso!",
                                              "Revise os conceitos básicos.",
                                              "Pratique mais exercícios.",
                                              "Atenção aos detalhes.",
                                              "Bom desempenho!"
                                            ]
                                        ).map((s, i) => (
                                          <button
                                            key={i}
                                            onClick={() => setFeedbackValue(prev => prev ? `${prev} ${s}` : s)}
                                            className="px-2 py-1 text-[9px] font-medium bg-white border border-gray-200 text-gray-600 rounded-full hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                                          >
                                            + {s}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                    <button 
                                      onClick={() => setEditingFeedback(null)}
                                      className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      onClick={() => handleSaveEdit(comp.competencia, 'fullFeedback')}
                                      className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                    >
                                      <Check size={14} />
                                      Salvar Feedback Completo
                                    </button>
                                  </div>
                                </div>
                              ) : (comp.professor_feedback || comp.professor_nota) ? (
                                <div className={cn(
                                  "p-4 rounded-xl border flex items-start gap-4",
                                  comp.nivel === 'Crítico'
                                    ? "bg-red-50/50 border-red-100/50"
                                    : "bg-emerald-50/50 border-emerald-100/50"
                                )}>
                                  {comp.professor_nota && (
                                    <div className={cn(
                                      "px-3 py-2 rounded-lg border flex flex-col items-center justify-center min-w-[60px]",
                                      comp.nivel === 'Crítico' ? "bg-red-100 border-red-200" : "bg-emerald-100 border-emerald-200"
                                    )}>
                                      <span className="text-[8px] font-bold text-gray-400 uppercase">Nota</span>
                                      <span className={cn("text-lg font-black", comp.nivel === 'Crítico' ? "text-red-700" : "text-emerald-700")}>
                                        {comp.professor_nota}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className={cn(
                                      "text-sm leading-relaxed font-medium",
                                      comp.nivel === 'Crítico' ? "text-red-800" : "text-emerald-800"
                                    )}>
                                      {comp.professor_feedback || "Nenhuma explicação fornecida."}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">Nenhum feedback personalizado inserido ainda.</p>
                              )}
                            </div>
                          )}

                          {/* Individual Questions Section */}
                          {comp.questoes && comp.questoes.length > 0 && (comp.nivel === 'Crítico' || comp.acertos < comp.total_questoes) && (
                            <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
                              <div className="flex items-center gap-2 mb-4">
                                <HelpCircle size={14} className="text-emerald-500" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detalhamento por Questão</p>
                              </div>
                              
                              <div className="space-y-4">
                                {comp.questoes.map((q, qIdx) => (
                                  <div 
                                    key={qIdx} 
                                    className={cn(
                                      "p-4 rounded-xl border transition-all overflow-hidden",
                                      q.acertou ? "bg-emerald-50/30 border-emerald-100/50" : "bg-red-50/30 border-red-100/50"
                                    )}
                                  >
                                    {/* Question Tabs */}
                                    <div className="flex items-center gap-1 mb-4 p-1 bg-white/40 rounded-lg w-fit border border-gray-100/50">
                                      <button
                                        onClick={() => setQuestionTab(`${comp.competencia}-${q.id}`, 'question')}
                                        className={cn(
                                          "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5",
                                          (activeQuestionTabs[`${comp.competencia}-${q.id}`] || 'question') === 'question'
                                            ? "bg-white text-emerald-700 shadow-sm"
                                            : "text-gray-500 hover:text-emerald-600"
                                        )}
                                      >
                                        <HelpCircle size={12} />
                                        Questão
                                      </button>
                                      <button
                                        onClick={() => setQuestionTab(`${comp.competencia}-${q.id}`, 'feedback')}
                                        className={cn(
                                          "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5",
                                          activeQuestionTabs[`${comp.competencia}-${q.id}`] === 'feedback'
                                            ? "bg-white text-emerald-700 shadow-sm"
                                            : "text-gray-500 hover:text-emerald-600"
                                        )}
                                      >
                                        <MessageSquare size={12} />
                                        Feedback & Nota
                                        { (q.professor_feedback || q.professor_nota) ? (
                                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        ) : !q.acertou && isProfessor && (
                                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                        )}
                                      </button>
                                    </div>

                                    {(activeQuestionTabs[`${comp.competencia}-${q.id}`] || 'question') === 'question' ? (
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                              q.acertou ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                            )}>
                                              Questão {q.id}
                                            </span>
                                            {!q.acertou && (
                                              <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-tight flex items-center gap-1">
                                                  <XCircle size={10} />
                                                  Incorreta
                                                </span>
                                                {isProfessor && !q.professor_feedback && (
                                                  <button 
                                                    onClick={() => {
                                                      setQuestionTab(`${comp.competencia}-${q.id}`, 'feedback');
                                                      setEditingQuestionFeedback(`${comp.competencia}-${q.id}`);
                                                      setFeedbackValue('');
                                                      setNotaValue('');
                                                    }}
                                                    className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full hover:bg-red-200 transition-colors flex items-center gap-1"
                                                  >
                                                    <Plus size={10} />
                                                    Adicionar Feedback
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          {q.enunciado && <p className="text-sm text-gray-700 font-medium mb-2">{q.enunciado}</p>}
                                          <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                                            <div className="p-2 bg-white/50 rounded-lg border border-gray-100">
                                              <p className="text-gray-400 font-bold uppercase tracking-tighter mb-1">Resposta do Aluno</p>
                                              <p className={cn("font-bold", q.acertou ? "text-emerald-700" : "text-red-700")}>{q.resposta_aluno}</p>
                                            </div>
                                            <div className="p-2 bg-white/50 rounded-lg border border-gray-100">
                                              <p className="text-gray-400 font-bold uppercase tracking-tighter mb-1">Gabarito</p>
                                              <p className="text-emerald-700 font-bold">{q.gabarito}</p>
                                            </div>
                                          </div>

                                          {/* Cognitive Error Analysis Section */}
                                          {!q.acertou && q.analise_erro && (
                                            <div className="mt-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 space-y-3">
                                              <div className="flex items-center gap-2">
                                                <Brain size={14} className="text-amber-600" />
                                                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Análise Cognitiva do Erro</p>
                                              </div>
                                              <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                                                    q.analise_erro.categoria === 'Interpretação' ? 'bg-blue-100 text-blue-700' :
                                                    q.analise_erro.categoria === 'Conceito' ? 'bg-emerald-100 text-emerald-700' :
                                                    q.analise_erro.categoria === 'Atenção' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                  )}>
                                                    {q.analise_erro.categoria}
                                                  </span>
                                                </div>
                                                <p className="text-xs text-gray-700 leading-relaxed">
                                                  <span className="font-bold">Diagnóstico:</span> {q.analise_erro.explicacao_detalhada}
                                                </p>
                                                <div className="p-3 bg-white/50 rounded-lg border border-amber-200/50">
                                                  <p className="text-[9px] font-bold text-amber-800 uppercase mb-1 flex items-center gap-1">
                                                    <Sparkles size={10} /> Sugestão de Intervenção (Professor)
                                                  </p>
                                                  <p className="text-xs text-amber-900 italic">
                                                    {q.analise_erro.sugestao_intervencao}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Integrated Feedback Section for Incorrect Questions */}
                                          {!q.acertou && (
                                            <div className="mt-4 p-4 bg-white/60 rounded-xl border border-red-100/50 space-y-4">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <MessageSquare size={14} className="text-red-500" />
                                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Feedback do Professor</p>
                                                </div>
                                                {isProfessor && editingQuestionFeedback !== `${comp.competencia}-${q.id}` && (
                                                  <button 
                                                    onClick={() => {
                                                      setEditingQuestionFeedback(`${comp.competencia}-${q.id}`);
                                                      setFeedbackValue(q.professor_feedback || '');
                                                      setNotaValue(q.professor_nota || '');
                                                    }}
                                                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                                  >
                                                    <Pencil size={10} />
                                                    {q.professor_feedback ? 'Editar' : 'Adicionar'}
                                                  </button>
                                                )}
                                              </div>

                                              {editingQuestionFeedback === `${comp.competencia}-${q.id}` ? (
                                                <div className="space-y-4 bg-white p-4 rounded-xl border border-red-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="md:col-span-1 space-y-2">
                                                      <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                        <Star size={10} className="text-amber-500" />
                                                        Nota (0-10)
                                                      </label>
                                                      <input
                                                        type="text"
                                                        value={notaValue}
                                                        onChange={(e) => setNotaValue(e.target.value)}
                                                        className="w-full p-3 text-lg font-black rounded-xl border-2 border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-center"
                                                        placeholder="0.0"
                                                      />
                                                      <div className="grid grid-cols-3 gap-1">
                                                        {[0, 2.5, 5, 7.5, 10].map(v => (
                                                          <button
                                                            key={v}
                                                            onClick={() => setNotaValue(v.toString())}
                                                            className="py-1 text-[9px] font-bold bg-gray-100 text-gray-600 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                                                          >
                                                            {v}
                                                          </button>
                                                        ))}
                                                        <button
                                                          onClick={() => setNotaValue('')}
                                                          className="py-1 text-[9px] font-bold bg-gray-100 text-gray-600 rounded hover:bg-red-100 hover:text-red-700 transition-colors flex items-center justify-center"
                                                        >
                                                          <RotateCcw size={8} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                    <div className="md:col-span-3 space-y-2">
                                                      <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                        <MessageSquare size={10} className="text-emerald-500" />
                                                        Explicação Pedagógica
                                                      </label>
                                                      <textarea
                                                        value={feedbackValue}
                                                        onChange={(e) => setFeedbackValue(e.target.value)}
                                                        className="w-full p-3 text-xs rounded-xl border-2 border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[80px] transition-all"
                                                        placeholder="Por que o aluno errou? Como ele pode melhorar?"
                                                        autoFocus
                                                      />
                                                      
                                                      {/* Quick Suggestions for Questions */}
                                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase mr-1 self-center">Sugestões:</span>
                                                        {(comp.competencia === 'Cálculo Algébrico' 
                                                          ? [
                                                              "Atenção aos sinais.",
                                                              "Revise a distributiva.",
                                                              "Agrupe termos semelhantes.",
                                                              "Erro de sinal básico.",
                                                              "Simplificação pendente."
                                                            ]
                                                          : [
                                                              "Revise este conceito.",
                                                              "Atenção ao enunciado.",
                                                              "Cálculo incorreto.",
                                                              "Faltou interpretação.",
                                                              "Quase lá!"
                                                            ]
                                                        ).map((s, i) => (
                                                          <button
                                                            key={i}
                                                            onClick={() => setFeedbackValue(prev => prev ? `${prev} ${s}` : s)}
                                                            className="px-2 py-1 text-[9px] font-medium bg-white border border-gray-200 text-gray-600 rounded-full hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                                                          >
                                                            + {s}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                                    <button 
                                                      onClick={() => setEditingQuestionFeedback(null)}
                                                      className="px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-700"
                                                    >
                                                      Cancelar
                                                    </button>
                                                    <button 
                                                      onClick={() => handleSaveEdit(comp.competencia, 'fullQuestionFeedback', feedbackValue, q.id, notaValue)}
                                                      className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                                    >
                                                      <Check size={12} />
                                                      Salvar Feedback
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (q.professor_feedback || q.professor_nota) ? (
                                                <div className="flex items-start gap-3">
                                                  {q.professor_nota && (
                                                    <div className="px-2 py-1 bg-red-100 border border-red-200 rounded-lg flex flex-col items-center justify-center min-w-[40px]">
                                                      <span className="text-[8px] font-bold text-gray-400 uppercase">Nota</span>
                                                      <span className="text-sm font-black text-red-700">{q.professor_nota}</span>
                                                    </div>
                                                  )}
                                                  <p className="text-xs text-red-800 italic leading-relaxed flex-1">
                                                    "{q.professor_feedback || "Nenhuma explicação fornecida."}"
                                                  </p>
                                                </div>
                                              ) : isProfessor ? (
                                                <button 
                                                  onClick={() => {
                                                    setEditingQuestionFeedback(`${comp.competencia}-${q.id}`);
                                                    setFeedbackValue('');
                                                    setNotaValue('');
                                                  }}
                                                  className="w-full py-4 border border-dashed border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition-all flex flex-col items-center gap-1"
                                                >
                                                  <Plus size={16} />
                                                  Clique para adicionar feedback e nota para esta questão incorreta
                                                </button>
                                              ) : (
                                                <p className="text-[10px] text-gray-400 italic">Nenhum feedback do professor para esta questão ainda.</p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <MessageSquare size={14} className="text-emerald-500" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Feedback e Avaliação</p>
                                          </div>
                                          
                                          {isProfessor && (
                                            <div className="flex items-center gap-2">
                                              {editingQuestionFeedback !== `${comp.competencia}-${q.id}` ? (
                                                <button 
                                                  onClick={() => {
                                                    setEditingQuestionFeedback(`${comp.competencia}-${q.id}`);
                                                    setFeedbackValue(q.professor_feedback || '');
                                                    setNotaValue(q.professor_nota || '');
                                                  }}
                                                  className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                                                >
                                                  <Pencil size={10} />
                                                  Editar
                                                </button>
                                              ) : (
                                                <div className="flex items-center gap-1">
                                                  <button 
                                                    onClick={() => handleSaveEdit(comp.competencia, 'fullQuestionFeedback', feedbackValue, q.id, notaValue)}
                                                    className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                                                    title="Salvar"
                                                  >
                                                    <Check size={12} />
                                                  </button>
                                                  <button 
                                                    onClick={() => setEditingQuestionFeedback(null)}
                                                    className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                                                    title="Cancelar"
                                                  >
                                                    <X size={12} />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {editingQuestionFeedback === `${comp.competencia}-${q.id}` ? (
                                          <div className="space-y-4 bg-white/50 p-4 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                              <div className="md:col-span-1 space-y-2">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                  <Star size={10} className="text-emerald-500" />
                                                  Nota (0-10)
                                                </label>
                                                <input
                                                  type="text"
                                                  value={notaValue}
                                                  onChange={(e) => setNotaValue(e.target.value)}
                                                  className="w-full p-3 text-sm rounded-xl border-2 border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-black text-emerald-700 transition-all"
                                                  placeholder="0.0"
                                                />
                                                <div className="grid grid-cols-3 gap-1">
                                                  {[0, 2.5, 5, 7.5, 10].map(v => (
                                                    <button
                                                      key={v}
                                                      onClick={() => setNotaValue(v.toString())}
                                                      className="py-1 text-[9px] font-bold bg-gray-100 text-gray-600 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                                                    >
                                                      {v}
                                                    </button>
                                                  ))}
                                                  <button
                                                    onClick={() => setNotaValue('')}
                                                    className="py-1 text-[9px] font-bold bg-gray-100 text-gray-600 rounded hover:bg-red-100 hover:text-red-700 transition-colors flex items-center justify-center"
                                                  >
                                                    <RotateCcw size={8} />
                                                  </button>
                                                </div>
                                              </div>
                                              <div className="md:col-span-3 space-y-2">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                                  <MessageSquare size={10} className="text-emerald-500" />
                                                  Explicação Pedagógica
                                                </label>
                                                <textarea
                                                  value={feedbackValue}
                                                  onChange={(e) => setFeedbackValue(e.target.value)}
                                                  className="w-full p-3 text-xs rounded-xl border-2 border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[80px] transition-all"
                                                  placeholder="Por que o aluno errou? Como ele pode melhorar?"
                                                  autoFocus
                                                />
                                                
                                                {/* Quick Suggestions for Questions */}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                  <span className="text-[9px] font-bold text-gray-400 uppercase mr-1 self-center">Sugestões:</span>
                                                  {(comp.competencia === 'Cálculo Algébrico' 
                                                    ? [
                                                        "Atenção aos sinais.",
                                                        "Revise a distributiva.",
                                                        "Agrupe termos semelhantes.",
                                                        "Erro de sinal básico.",
                                                        "Simplificação pendente."
                                                      ]
                                                    : [
                                                        "Revise este conceito.",
                                                        "Atenção ao enunciado.",
                                                        "Cálculo incorreto.",
                                                        "Faltou interpretação.",
                                                        "Quase lá!"
                                                      ]
                                                  ).map((s, i) => (
                                                    <button
                                                      key={i}
                                                      onClick={() => setFeedbackValue(prev => prev ? `${prev} ${s}` : s)}
                                                      className="px-2 py-1 text-[9px] font-medium bg-white border border-gray-200 text-gray-600 rounded-full hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                                                    >
                                                      + {s}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (q.professor_feedback || q.professor_nota) ? (
                                          <div className={cn(
                                            "p-4 rounded-xl border space-y-3",
                                            q.acertou ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"
                                          )}>
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <div className={cn(
                                                  "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                                                  q.acertou ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                )}>
                                                  {q.professor_nota || '-'}
                                                </div>
                                                <div>
                                                  <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Nota Atribuída</p>
                                                  <p className="text-[10px] font-medium text-gray-500">Avaliação do Instrutor</p>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex gap-3 pt-2 border-t border-gray-100/50">
                                              <p className={cn(
                                                "text-xs font-medium italic leading-relaxed",
                                                q.acertou ? "text-emerald-800" : "text-red-800"
                                              )}>
                                                {q.professor_feedback || "Nenhuma explicação fornecida."}
                                              </p>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                            <MessageSquare size={20} className="text-gray-300" />
                                            <p className="text-xs text-gray-400 font-medium">Nenhum feedback ou nota inserida para esta questão.</p>
                                            {isProfessor && (
                                              <button 
                                                onClick={() => {
                                                  setEditingQuestionFeedback(`${comp.competencia}-${q.id}`);
                                                  setFeedbackValue(q.professor_feedback || '');
                                                  setNotaValue(q.professor_nota || '');
                                                }}
                                                className="text-[10px] font-bold text-emerald-600 hover:underline"
                                              >
                                                Adicionar Feedback Agora
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        {/* Question Level Private Notes */}
                                        {isProfessor && (
                                          <div className="mt-4 pt-4 border-t border-gray-100/50 space-y-3">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <Lock size={12} className="text-gray-400" />
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Notas Privadas (Apenas Professor)</p>
                                              </div>
                                              {editingPrivateNote !== `${comp.competencia}-${q.id}-q` && (
                                                <button 
                                                  onClick={() => {
                                                    setEditingPrivateNote(`${comp.competencia}-${q.id}-q`);
                                                    setPrivateNoteValue(q.private_notes || '');
                                                  }}
                                                  className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                                >
                                                  <Pencil size={10} />
                                                  {q.private_notes ? 'Editar' : 'Adicionar'}
                                                </button>
                                              )}
                                            </div>
                                            
                                            {editingPrivateNote === `${comp.competencia}-${q.id}-q` ? (
                                              <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <textarea
                                                  value={privateNoteValue}
                                                  onChange={(e) => setPrivateNoteValue(e.target.value)}
                                                  className="w-full p-3 text-xs rounded-xl border-2 border-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[60px] transition-all bg-white"
                                                  placeholder="Notas internas sobre o desempenho do aluno nesta questão..."
                                                  autoFocus
                                                />
                                                <div className="flex justify-end gap-2">
                                                  <button 
                                                    onClick={() => setEditingPrivateNote(null)}
                                                    className="px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-gray-700"
                                                  >
                                                    Cancelar
                                                  </button>
                                                  <button 
                                                    onClick={() => handleSaveEdit(comp.competencia, 'questionPrivateNote', privateNoteValue, q.id)}
                                                    className="px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                                                  >
                                                    <Check size={12} />
                                                    Salvar Nota
                                                  </button>
                                                </div>
                                              </div>
                                            ) : q.private_notes ? (
                                              <p className="text-[11px] text-gray-600 italic leading-relaxed bg-white/50 p-2 rounded-lg border border-gray-100">
                                                "{q.private_notes}"
                                              </p>
                                            ) : (
                                              <p className="text-[10px] text-gray-400 italic">Nenhuma nota privada para esta questão.</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
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
                      <div className="text-center space-y-2">
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Média Ponderada (%)</p>
                          <p className="text-sm font-black text-gray-900">{(comp.acuracia_ponderada * 100).toFixed(1)}%</p>
                        </div>
                        <div className="h-1.5 w-16 md:w-20 bg-gray-200 rounded-full overflow-hidden mx-auto">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${comp.acuracia_ponderada * 100}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className={cn(
                              "h-full rounded-full",
                              comp.nivel === 'Forte' ? "bg-emerald-500" :
                              comp.nivel === 'Atenção' ? "bg-amber-500" :
                              "bg-red-500"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Search size={32} className="text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-gray-900 font-bold">Nenhuma competência encontrada</p>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    {searchTerm 
                      ? `Não encontramos resultados para "${searchTerm}" no nível ${filter}.`
                      : `Não há competências classificadas como "${filter}" neste diagnóstico.`
                    }
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setFilter('Todos');
                    setSearchTerm('');
                  }}
                  className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comparação com a Turma Section */}
        {result.diagnostico_por_competencia && result.diagnostico_por_competencia.length > 0 && (
          <div className="mt-12 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Comparação com a Turma</h3>
                <p className="text-sm text-gray-500">Desempenho do aluno em relação à média da turma por competência</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.diagnostico_por_competencia.map((comp, idx) => {
                const studentScore = Math.round(comp.acuracia_ponderada * 100);
                const classScore = Math.round(classAverages[comp.competencia] || 0);
                const isAboveAverage = studentScore >= classScore;

                return (
                  <div key={idx} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-gray-900 line-clamp-1" title={comp.competencia}>{comp.competencia}</h4>
                      <span className={cn(
                        "px-2 py-1 text-[10px] font-bold uppercase rounded-md whitespace-nowrap ml-2",
                        isAboveAverage ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {isAboveAverage ? "Acima da Média" : "Abaixo da Média"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Student Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-gray-600">Aluno</span>
                          <span className="text-gray-900 font-bold">{studentScore}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${studentScore}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className={cn(
                              "h-full rounded-full",
                              isAboveAverage ? "bg-emerald-500" : "bg-red-500"
                            )}
                          />
                        </div>
                      </div>

                      {/* Class Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-gray-500">Média da Turma</span>
                          <span className="text-gray-700 font-bold">{classScore}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${classScore}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className="h-full rounded-full bg-blue-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recovery Plan Section */}
        {result.plano_de_estudos_7_dias && result.plano_de_estudos_7_dias.length > 0 && (
          <div id="recovery-plan" className="mt-12 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm scroll-mt-24">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Seu Plano de Estudos de 7 Dias</h3>
                  <p className="text-sm text-gray-500">Cronograma intensivo para superar suas dificuldades</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/plan')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
              >
                Ver em Tela Cheia
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {result.plano_de_estudos_7_dias.map((dia) => (
                <div key={dia.dia} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Dia {dia.dia}</span>
                    <CheckCircle2 size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-3 line-clamp-1">{dia.tema}</h4>
                  <ul className="space-y-2 mb-4">
                    {dia.atividades.slice(0, 2).map((atv, idx) => (
                      <li key={idx} className="text-[10px] text-gray-600 flex gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="line-clamp-1">{atv}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-3 border-t border-gray-200/50">
                    <p className="text-[9px] text-gray-400 italic line-clamp-2">"{dia.criterio_sucesso}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Full Report for PDF Export */}
      <div style={{ display: 'none' }}>
        <div ref={fullReportRef} className="bg-white p-12 w-[1000px]">
          <div className="flex items-center justify-between mb-12 pb-8 border-b-2 border-gray-100">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{result.aluno}</h1>
              <p className="text-lg text-gray-500 font-bold uppercase tracking-widest">Relatório Completo de Desempenho</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Data de Emissão</p>
              <p className="text-lg font-bold text-gray-900">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-12">
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Média Geral</p>
              <p className="text-4xl font-black text-emerald-900">{(result.summary.acuracia_ponderada * 100).toFixed(1)}%</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Total de Acertos</p>
              <p className="text-4xl font-black text-blue-900">{result.summary.acertos}/{result.summary.total_questoes}</p>
            </div>
            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Competências</p>
              <p className="text-4xl font-black text-indigo-900">{result.diagnostico_por_competencia.length}</p>
            </div>
          </div>

          <div className="mb-12 p-8 bg-gray-50 rounded-3xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="text-emerald-600" size={20} />
              Mensagem Pedagógica
            </h3>
            <p className="text-xl text-gray-700 leading-relaxed italic font-medium">
              "{result.mensagem_para_o_aluno}"
            </p>
          </div>

          {studentHistory.length > 1 && (
            <div className="mb-12 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <History className="text-emerald-600" size={20} />
                Histórico de Evolução
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studentHistory.map(h => ({
                    date: h.createdAt?.seconds ? new Date(h.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'N/A',
                    acuracia: Math.round((h.result?.summary?.acuracia_ponderada || 0) * 100)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={40} />
                    <Area type="monotone" dataKey="acuracia" stroke="#10b981" strokeWidth={4} fill="#10b981" fillOpacity={0.1} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="space-y-12">
            <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-emerald-500 pb-2 w-fit">Análise Detalhada por Competência</h3>
            {result.diagnostico_por_competencia.map((comp, i) => (
              <div key={i} className="page-break-inside-avoid border-b border-gray-100 pb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-4 h-4 rounded-full",
                      comp.nivel === 'Forte' ? "bg-emerald-500" : comp.nivel === 'Atenção' ? "bg-amber-500" : "bg-red-500"
                    )} />
                    <h4 className="text-xl font-bold text-gray-900">{comp.competencia}</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                      comp.nivel === 'Forte' ? "bg-emerald-100 text-emerald-700" : comp.nivel === 'Atenção' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>
                      {comp.nivel}
                    </span>
                    <div className="text-right space-y-1">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Média Ponderada (%)</span>
                        <span className="text-xl font-black text-gray-900">{(comp.acuracia_ponderada * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div 
                          style={{ width: `${comp.acuracia_ponderada * 100}%` }}
                          className={cn(
                            "h-full rounded-full",
                            comp.nivel === 'Forte' ? "bg-emerald-500" :
                            comp.nivel === 'Atenção' ? "bg-amber-500" :
                            "bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-sm mb-4">
                      <span className="font-bold text-gray-700">Comparação com a Turma</span>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Aluno</span>
                          <span className="font-bold">{(comp.acuracia_ponderada * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full", (comp.acuracia_ponderada * 100) >= (classAverages[comp.competencia] || 0) ? "bg-emerald-500" : "bg-red-500")}
                            style={{ width: `${Math.min(100, Math.max(0, comp.acuracia_ponderada * 100))}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Média da Turma</span>
                          <span className="font-bold text-gray-600">{(classAverages[comp.competencia] || 0).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-400"
                            style={{ width: `${Math.min(100, Math.max(0, classAverages[comp.competencia] || 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Conhecimentos a Reforçar</p>
                    <div className="flex flex-wrap gap-2">
                      {comp.conhecimentos_fracos.map((c, ci) => (
                        <span key={ci} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg border border-gray-100">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recomendações</p>
                    <p className="text-sm text-gray-600 leading-relaxed italic">{comp.recomendacoes}</p>
                  </div>
                </div>

                {(comp.professor_feedback || comp.professor_nota) && (
                  <div className="mt-8 p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Feedback do Instrutor</p>
                    <div className="flex items-start gap-4">
                      {comp.professor_nota && (
                        <div className="px-4 py-2 bg-indigo-100 rounded-xl border border-indigo-200 text-center min-w-[70px]">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase">Nota</p>
                          <p className="text-xl font-black text-indigo-700">{comp.professor_nota}</p>
                        </div>
                      )}
                      <p className="text-sm text-indigo-900 font-medium leading-relaxed italic">
                        {comp.professor_feedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-20 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Gerado automaticamente pela Plataforma de Diagnóstico Educacional</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <AppContent />
        </AuthProvider>
      </ErrorBoundary>
    </HashRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, isAuthReady } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [results, setResults] = useState<Array<{ id: string, result: DiagnosticResult }>>([]);
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
  const [examSubmissions, setExamSubmissions] = useState<any[]>([]);
  const [evolutionFilter, setEvolutionFilter] = useState<'7d' | '30d' | 'all'>('all');
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    const provider = (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
    if (provider === 'openai') return 'gpt-4o-mini';
    if (provider === 'deepseek') return 'deepseek-chat';
    return 'gemini-3-flash-preview';
  });

  const handleProviderChange = (p: AIProvider) => {
    setAiProvider(p);
    localStorage.setItem('ai_provider', p);
    
    // Set default model for the new provider
    if (p === 'openai') {
      setSelectedModel('gpt-4o-mini');
    } else if (p === 'deepseek') {
      setSelectedModel('deepseek-chat');
    } else {
      setSelectedModel('gemini-3-flash-preview');
    }
    
    window.dispatchEvent(new Event('ai_provider_changed'));
    toast.success(`Provedor de IA alterado para ${p === 'gemini' ? 'Gemini' : p === 'openai' ? 'ChatGPT' : 'DeepSeek'}`);
  };
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [classAverages, setClassAverages] = useState<Record<string, number>>({});
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const resetHistory = () => {
    setHistory([]);
    setExamSubmissions([]);
  };

  useEffect(() => {
    if (!isAuthReady) return;
    const fetchAverages = async () => {
      try {
        const averages = await getClassCompetencyAverages();
        const averagesMap: Record<string, number> = {};
        averages.forEach(avg => {
          averagesMap[avg.competency] = avg.average;
        });
        setClassAverages(averagesMap);
      } catch (err) {
        // Error handled by service
      }
    };
    fetchAverages();
  }, [isAuthReady]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    
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
        handleFirestoreError(err, OperationType.WRITE, 'student_exams');
      }
    };
    assignExams();
  }, [user, isAuthReady]);

  const planRef = useRef<HTMLDivElement>(null);

  const navItems = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === 'aluno') {
      const items: any[] = [
        { type: 'header', label: 'Principal' },
        { id: 'student-dashboard', label: 'Meu Painel', icon: LayoutDashboard, path: '/student-dashboard' },
        { type: 'header', label: 'Módulos de Aprendizado' },
        { id: 'student-exams', label: 'Simulados', icon: BookOpen, path: '/student-exams', description: 'Diagnóstico e Avaliação' },
        { id: 'student-activities', label: 'Minhas Atividades', icon: CheckSquare, path: '/student-activities', description: 'Entregas e Notas' },
        { id: 'exercises', label: 'Exercícios', icon: CheckSquare, path: '/exercises', description: 'Prática e Aprendizado' },
        { id: 'student-sa', label: 'Situações de Aprendizagem', icon: BookOpen, path: '/student-sa', description: 'Desafios Práticos' },
        { id: 'correction-plans', label: 'Planos de Acerto', icon: FileText, path: '/correction-plans', description: 'Recuperação de Erros' },
        { id: 'learning-path', label: 'Minha Trilha', icon: Map, path: '/learning-path', description: 'Caminho Personalizado' },
        { id: 'student-journey', label: 'Minha Jornada', icon: MapIcon, path: '/student-journey', description: 'Evolução e Linha do Tempo' },
        { id: 'gamification', label: 'Minhas Conquistas', icon: Trophy, path: '/gamification', description: 'Nível e Medalhas' },
        { id: 'calendar', label: 'Calendário', icon: Calendar, path: '/calendar', description: 'Prazos e Eventos' },
        { id: 'communication', label: 'Comunicação', icon: MessageSquare, path: '/communication', description: 'Avisos e Fórum' },
        { type: 'header', label: 'Suporte IA' },
        { id: 'student-chatbot', label: 'Chatbot Educacional', icon: MessageSquare, path: '/student-chatbot', description: 'Assistente n8n' },
        { id: 'smart-content', label: 'Gerador IA', icon: Sparkles, path: '/smart-content', description: 'Conteúdo Personalizado' },
        { id: 'study-plan', label: 'Plano IA', icon: Zap, path: '/study-plan' },
        { type: 'header', label: 'Outros' },
        { id: 'history', label: 'Histórico', icon: History, path: '/history' },
        { id: 'recommendations', label: 'Recomendações IA', icon: Target, path: '/recommendations' },
        { id: 'plan', label: 'Meu Plano', icon: Calendar, disabled: !result, path: '/plan' },
        { id: 'profile', label: 'Perfil', icon: UserIcon, path: '/profile' },
      ];
      
      if (userProfile.gamificationEnabled) {
        items.splice(5, 0, { id: 'gamification', label: 'Gamificação', icon: Trophy, path: '/gamification', description: 'Jogos e Revisão SAEP' });
      }
      
      return items;
    }
    return [
      { type: 'header', label: 'Painel Principal' },
      { id: 'dashboard', label: 'Meu Painel', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'class-health', label: 'Saúde da Turma', icon: Activity, path: '/class-health', description: 'Métricas de Maturidade' },
      { id: 'heatmap', label: 'Monitoramento Heatmap', icon: Target, path: '/heatmap', description: 'Visão Geral TRI' },
      { id: 'activity-manager', label: 'Minhas Atividades', icon: CheckSquare, path: '/activity-manager', description: 'Atribuição e Correção' },
      
      { type: 'header', label: 'Gestão de Dados' },
      { id: 'data-import', label: 'Importação n8n', icon: Database, path: '/data-import', description: 'Integração SIAC' },
      { id: 'import-students', label: 'Importar Alunos', icon: Upload, path: '/import-students', description: 'CSV/Excel' },
      { id: 'import-exercises', label: 'Importar Exercícios', icon: BookOpen, path: '/import-exercises', description: 'Banco de Questões' },
      { id: 'external-forms', label: 'Formulários Externos', icon: ExternalLink, path: '/external-forms', description: 'Sincronização n8n' },
      { id: 'reports', label: 'Relatórios', icon: BarChart3, path: '/reports' },
      { id: 'consolidated-report', label: 'Consolidado', icon: BarChart2, path: '/consolidated-report' },
      { id: 'tri-analysis', label: 'Análise TRI', icon: Target, path: '/tri-analysis', description: 'Psicometria SAEP' },
      { id: 'question-optimizer', label: 'Otimizador IA', icon: Zap, path: '/question-optimizer', description: 'Refatoração de Itens' },
      { id: 'input', label: 'Entrada', icon: Upload, path: '/input' },
      { id: 'history', label: 'Histórico', icon: History, path: '/history' },
      
      { type: 'header', label: 'Gestão Pedagógica' },
      { id: 'classes', label: 'Turmas', icon: Users, path: '/classes' },
      { id: 'disciplines', label: 'Disciplinas', icon: BookOpen, path: '/disciplines' },
      { id: 'lesson-management', label: 'Gestão de Aulas', icon: Layout, path: '/lesson-management', description: 'Planejamento IA' },
      { id: 'generate-questions', label: 'Gerar Questões IA', icon: BrainCircuit, path: '/generate-questions', description: 'Criação SAEP' },
      { id: 'teacher-ai-assistant', label: 'IA Avançada', icon: Sparkles, path: '/teacher-ai-assistant', description: 'Estudos de Caso e Mais' },
      { id: 'generate-discursive', label: 'Gerar Discursivas IA', icon: FileText, path: '/generate-discursive', description: 'Questões Abertas' },
      { id: 'learning-situation', label: 'Gerador de SA', icon: BrainCircuit, path: '/learning-situation', description: 'Gerador SA' },
      { id: 'observatory', label: 'Observatório', icon: Telescope, path: '/observatory', description: 'Visão Pedagógica' },
      { id: 'pedagogical-rules', label: 'Regras do Sistema', icon: Zap, path: '/pedagogical-rules', description: 'Central de Regras' },
      { id: 'institutional-templates', label: 'Templates Base', icon: Library, path: '/institutional-templates', description: 'Padronização' },
      { id: 'teacher-activities', label: 'Entregas e Correções', icon: CheckSquare, path: '/teacher-activities', description: 'Gestão de Atividades' },
      { id: 'teacher-rubrics', label: 'Rubricas de Avaliação', icon: CheckSquare, path: '/teacher-rubrics', description: 'Critérios de Correção' },
      { id: 'calendar', label: 'Calendário', icon: Calendar, path: '/calendar', description: 'Prazos e Eventos' },
      { id: 'my-learning-situations', label: 'Minhas SAs', icon: BookOpen, path: '/my-learning-situations', description: 'Gestão de SAs' },
      { id: 'questions-bank', label: 'Banco de Questões', icon: Database, path: '/questions-bank' },
      { id: 'exams-management', label: 'Simulados', icon: BookOpen, path: '/exams', description: 'Avaliação Formal' },
      { id: 'google-forms-export', label: 'Exportar Google Forms', icon: Share2, path: '/google-forms-export', description: 'Integração Externa' },
      { id: 'exercises-management', label: 'Exercícios', icon: CheckSquare, path: '/exercises-management', description: 'Prática Dirigida' },
      
      { type: 'header', label: 'Comunicação e Admin' },
      { id: 'chat', label: 'Chat IA', icon: MessageSquare, path: '/chat' },
      { id: 'communication', label: 'Comunicação', icon: MessageSquare, path: '/communication', description: 'Avisos e Fórum' },
      { id: 'admin-users', label: 'Gestão', icon: Users, path: '/admin-users' },
      { id: 'ai-governance', label: 'Governança IA', icon: Shield, path: '/system-governance', description: 'Custos e Feature Flags' },
      { id: 'ai-providers', label: 'Provedores IA', icon: Settings, path: '/ai-providers', description: 'Gestão de Chaves' },
      { id: 'smart-content', label: 'Gerador IA', icon: Sparkles, path: '/smart-content', description: 'Conteúdo Inteligente' },
      
      { type: 'header', label: 'Visão do Aluno' },
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
      const filename = `Plano_Estudos_${result.aluno.replace(/\s+/g, '_')}`;
      await pdfExportService.exportElementToPDF(planRef.current, filename);
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar PDF.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthReady) return;
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
          handleFirestoreError(err, OperationType.GET, `diagnostics/${id}`);
        }
      };
      fetchDiagnostic();
    }
  }, [location.pathname, currentDiagnosticId, isAuthReady, userProfile, user]);

  const activeTab = useMemo(() => {
    const path = location.pathname.split('/')[1] || 'input';
    return path as 'input' | 'dashboard' | 'plan' | 'json' | 'history' | 'tasks' | 'chat' | 'profile' | 'aluno' | 'admin-users' | 'student-dashboard' | 'student-exams' | 'external-forms' | 'generate-discursive';
  }, [location]);

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

  // Exam Submissions Listener
  useEffect(() => {
    if (!user || !userProfile) {
      setExamSubmissions([]);
      return;
    }

    const path = 'exam_submissions';
    let q;
    
    if (userProfile.role === 'professor' || userProfile.role === 'admin') {
      q = query(
        collection(db, path),
        orderBy('completedAt', 'desc')
      );
    } else {
      q = query(
        collection(db, path),
        where('studentId', '==', user.uid),
        orderBy('completedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExamSubmissions(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user, userProfile]);

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
        const matricula = user.email?.substring(0, 10);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          matricula: matricula,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          role: role,
          createdAt: new Date().toISOString()
        });
      } else {
        // Just update last login or basic info, keep existing role
        const matricula = user.email?.substring(0, 10);
        await updateDoc(userRef, {
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          matricula: matricula,
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
      const matricula = user.email?.substring(0, 10);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        matricula: matricula,
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

  const archiveDiagnostic = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'diagnostics', id), {
        archived: !currentStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(currentStatus ? 'Diagnóstico restaurado com sucesso!' : 'Diagnóstico arquivado com sucesso!');
    } catch (err) {
      toast.error('Erro ao alterar status do diagnóstico.');
      handleFirestoreError(err, OperationType.UPDATE, `diagnostics/${id}`);
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
      // Group data by student
      const studentsData: Record<string, { rows: any[], email: string, matricula: string }> = {};
      data.forEach(row => {
        const studentName = row.aluno || row.Aluno || row.nome || row.Nome || row['Nome do Aluno'] || row['Nome do aluno'] || row['Nome Aluno'] || 'Estudante Sem Nome';
        const studentEmail = row.email || row.Email || row.correio || row.Correio || '';
        const studentMatricula = row.matricula || row.Matricula || row.id || row.ID || '';
        
        if (!studentsData[studentName]) {
          studentsData[studentName] = { rows: [], email: studentEmail, matricula: studentMatricula };
        }
        studentsData[studentName].rows.push(row);
        if (!studentsData[studentName].email && studentEmail) studentsData[studentName].email = studentEmail;
        if (!studentsData[studentName].matricula && studentMatricula) studentsData[studentName].matricula = studentMatricula;
      });

      const studentNames = Object.keys(studentsData);
      const allResults: DiagnosticResult[] = [];
      const savedIds: string[] = [];
      const path = 'diagnostics';

      toast.info(`Processando ${studentNames.length} alunos...`);

      // Process each student individually to avoid context limits and ensure all are processed
      for (const name of studentNames) {
        try {
          const studentInfo = studentsData[name];
          const results = await generateDiagnostic(studentInfo.rows, selectedModel, userProfile?.role as any || 'professor');
          
          if (results && results.length > 0) {
            const res = results[0]; 
            allResults.push(res);

            // Save to Firestore
            const docRef = await addDoc(collection(db, path), {
              userId: user.uid, // Professor ID
              aluno: res.aluno,
              studentEmail: studentInfo.email,
              studentMatricula: studentInfo.matricula,
              result: res,
              createdAt: new Date().toISOString()
            });
            savedIds.push(docRef.id);

            // Trigger n8n automation
            await n8nEvents.diagnosticCreated({
              professorId: user.uid,
              aluno: res.aluno,
              result: res
            });
          }
        } catch (err) {
          console.error(`Erro ao processar aluno ${name}:`, err);
          toast.error(`Erro ao processar aluno ${name}`);
        }
      }

      if (allResults.length === 0) {
        throw new Error("Nenhum diagnóstico pôde ser gerado.");
      }

      // Set the first result as the current one to display
      setResults(allResults.map((res, index) => ({ id: savedIds[index], result: res })));
      setResult(allResults[0]);
      setCurrentDiagnosticId(savedIds[0]);
      
      if (allResults.length > 1) {
        toast.success(`${allResults.length} diagnósticos gerados com sucesso!`);
        navigate('/history');
      } else {
        toast.success('Diagnóstico gerado com sucesso!');
        navigate(`/dashboard/${savedIds[0]}`);
      }
    } catch (err: any) {
      toast.error(`Erro ao gerar diagnóstico: ${err.message || "Verifique sua chave API e os dados."}`);
      setError(`Erro ao gerar diagnóstico: ${err.message || "Verifique sua chave API e os dados."}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    
    const getDate = (createdAt: any) => {
      if (!createdAt) return new Date(0);
      if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
      return new Date(createdAt);
    };

    let filteredHistory = history.filter(h => h.aluno === result.aluno);
    
    const now = new Date();
    if (evolutionFilter === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredHistory = filteredHistory.filter(h => getDate(h.createdAt) >= sevenDaysAgo);
    } else if (evolutionFilter === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredHistory = filteredHistory.filter(h => getDate(h.createdAt) >= thirtyDaysAgo);
    }

    const sorted = [...filteredHistory].sort((a, b) => 
      getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime()
    );

    return sorted.map(h => {
      const dateObj = getDate(h.createdAt);
      return {
        date: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: dateObj.toLocaleString('pt-BR'),
        acuracia: Math.round(h.result.summary.acuracia_geral * 100)
      };
    });
  }, [result, history, evolutionFilter]);

  const exportToCSV = () => {
    if (!result) return;

    const csvData: any[] = result.diagnostico_por_competencia.map(comp => ({
      'Aluno': result.aluno,
      'Competência': comp.competencia,
      'Nível': comp.nivel,
      'Média (%)': (comp.acuracia_ponderada * 100).toFixed(1),
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
      'Média (%)': (result.summary.acuracia_geral * 100).toFixed(1),
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
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 text-[#1A1A1A] dark:text-gray-100 font-sans selection:bg-emerald-100 flex">
      {/* Sidebar for Desktop */}
      {user && userProfile && (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden lg:flex flex-col h-screen sticky top-0 shrink-0">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none shrink-0">
                <BarChart3 size={24} />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate">EduDiagnóstico</h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider truncate">SAEP Pro</p>
              </div>
            </div>
            <NotificationBell userId={user.uid} />
          </div>
          
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((tab, idx) => (
              tab.type === 'header' ? (
                <div key={`header-${idx}`} className="px-3 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-4 first:mt-0">
                  {tab.label}
                </div>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && navigate(tab.path)}
                  disabled={tab.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id 
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
                      : tab.disabled ? "text-gray-400 dark:text-gray-600 cursor-not-allowed" : "text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  )}
                >
                  <tab.icon size={18} className={cn(activeTab === tab.id ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500")} />
                  <div className="text-left">
                    <p>{tab.label}</p>
                  </div>
                </button>
              )
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600" referrerPolicy="no-referrer" crossOrigin="anonymous" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                {userProfile.role === 'aluno' && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold">Lvl {userProfile.level || 1}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{userProfile.xp || 0} XP</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              {(userProfile.role === 'admin' || userProfile.role === 'professor') && <AIProviderToggle provider={aiProvider} onProviderChange={handleProviderChange} />}
              <div className="flex items-center gap-2">
                <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header & Email Verification Banner */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
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
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user && <NotificationBell userId={user.uid} />}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
                <BarChart3 size={18} />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">EduDiagnóstico</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user && <NotificationBell userId={user.uid} />}
              {userProfile && (userProfile.role === 'admin' || userProfile.role === 'professor') && <AIProviderToggle provider={aiProvider} onProviderChange={handleProviderChange} />}
              <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
              {!user && (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
                >
                  <LogIn size={16} />
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
              className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {navItems.map((tab, idx) => (
                  tab.type === 'header' ? (
                    <div key={`header-mob-${idx}`} className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] pt-4 first:pt-0">
                      {tab.label}
                    </div>
                  ) : (
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
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
                          : tab.disabled ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      )}
                    >
                      <tab.icon size={18} />
                      <div className="text-left">
                        <p>{tab.label}</p>
                        {tab.description && <p className="text-[10px] font-medium opacity-60">{tab.description}</p>}
                      </div>
                    </button>
                  )
                ))}
                
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4 px-4">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      {userProfile.role === 'aluno' && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold">Lvl {userProfile.level || 1}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{userProfile.xp || 0} XP</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {userProfile && (userProfile.role === 'admin' || userProfile.role === 'professor') && <AIProviderToggle provider={aiProvider} onProviderChange={handleProviderChange} />}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Sair da conta</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className={cn(
          "max-w-7xl mx-auto p-6 relative flex-1 w-full", 
          !user && "flex flex-col items-center justify-center min-h-[calc(100vh-120px)]"
        )}>
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
            className="max-w-md w-full py-12 space-y-8 mx-auto"
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
                  {authMode === 'login' ? 'Professor? Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={
                <Navigate to={
                  userProfile?.role === 'aluno' ? "/student-dashboard" : "/dashboard"
                } replace />
              } />
              <Route path="/exams" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ExamsManagementView user={user} userProfile={userProfile} selectedModel={selectedModel} defaultType="simulado" /></ProtectedRoute>} />
              <Route path="/simulados/inconsistencies" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ImportInconsistencyManager /></ProtectedRoute>} />
              <Route path="/exercises-management" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ExamsManagementView user={user} userProfile={userProfile} selectedModel={selectedModel} defaultType="exercicio" /></ProtectedRoute>} />
              <Route path="/questions-bank" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><QuestionsBankView user={user} userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/student-exams" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><StudentExamsView user={user} userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/student-activities" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><StudentActivitiesManager userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/exercises" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><ExercisesView user={user} userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/student-sa" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><StudentLearningSituationsView userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/learning-path" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><StudentLearningPathView userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/gamification" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><StudentGamificationView userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/correction-plans" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><CorrectionPlansRoute user={user} /></ProtectedRoute>} />
              <Route path="/student-chatbot" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><div className="max-w-4xl mx-auto"><StudentLearningChatbot userProfile={userProfile} /></div></ProtectedRoute>} />
              <Route path="/import-students" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><StudentImportUploader userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/import-exercises" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ExerciseImportUploader userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/study-plan" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno', 'professor', 'admin']}><StudyPlanView user={user} userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/adaptive-exam/:competency" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><AdaptiveExamView user={user} userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/student-insights" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><StudentInsightsView user={user} userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/professor-insights" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ProfessorInsightsView userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/consolidated-report" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ConsolidatedReportRoute history={history} examSubmissions={examSubmissions} onReset={resetHistory} /></ProtectedRoute>} />
              <Route path="/cognitive-analysis" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><CognitiveAnalysisView userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/socratic-tutor" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}><SocraticTutorView userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/smart-content" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno', 'professor', 'admin']}><SmartContentGenerator userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/generate-questions" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><SAEPItemGenerator user={user} userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/teacher-ai-assistant" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><TeacherAIAssistantPanel userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/generate-discursive" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><DiscursiveQuestionGenerator user={user} userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/observatory" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ClassObservatoryView /></ProtectedRoute>} />
              <Route path="/teacher-activities" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><TeacherActivitiesManager userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/teacher-rubrics" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><TeacherRubricsManager userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/activity-manager" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ActivityManager /></ProtectedRoute>} />
              <Route path="/heatmap" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><HeatmapLearning /></ProtectedRoute>} />
              <Route path="/pedagogical-rules" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['admin', 'professor']}><PedagogicalRulesManager /></ProtectedRoute>} />
              <Route path="/class-health" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><ClassHealthDashboard /></ProtectedRoute>} />
              <Route path="/student-journey" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno', 'professor', 'admin']}><StudentJourneyTimeline userId={user.uid} /></ProtectedRoute>} />
              <Route path="/institutional-templates" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['admin', 'professor']}><InstitutionalTemplateManager /></ProtectedRoute>} />
              <Route path="/system-governance" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['admin']}><FeatureFlagManager /></ProtectedRoute>} />
              <Route path="/student-activities" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno', 'admin']}><ActivityList userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno', 'professor', 'admin']}><CalendarView userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/communication" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno', 'professor', 'admin']}><CommunicationCenter userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['aluno', 'professor', 'admin']}><NotificationCenter userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/learning-situation" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><LearningSituationGenerator userProfile={userProfile} selectedModel={selectedModel} /></ProtectedRoute>} />
              <Route path="/my-learning-situations" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}><TeacherLearningSituationsView userProfile={userProfile} /></ProtectedRoute>} />
              <Route path="/ai-providers" element={<ProtectedRoute userProfile={userProfile} allowedRoles={['admin']}><AdminAIProviderManager /></ProtectedRoute>} />
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
                            {data.slice(0, 10).map((row, i) => (
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

            <Route path="/dashboard" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <ProfessorDashboardView user={user} userProfile={userProfile} />
              </ProtectedRoute>
            } />

            <Route path="/history" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin', 'aluno']}>
                <HistoryView 
                  history={history} 
                  deleteDiagnostic={deleteDiagnostic} 
                  archiveDiagnostic={archiveDiagnostic}
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

            <Route path="/advanced-dashboard" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <AdvancedDashboard 
                  userProfile={userProfile}
                  stats={{
                    totalStudents: 42,
                    totalExams: 156,
                    averageScore: 0.68,
                    successRate: 0.74,
                    evolutionRate: 0.12,
                    criticalCompetencies: ['Banco de Dados', 'Lógica de Programação']
                  }}
                  disciplinePerformance={[
                    { name: 'Lógica', score: 75 },
                    { name: 'Banco de Dados', score: 45 },
                    { name: 'Redes', score: 62 },
                    { name: 'Sistemas', score: 88 },
                    { name: 'Segurança', score: 54 }
                  ]}
                  studentEvolution={[
                    { date: 'Jan', score: 45 },
                    { date: 'Fev', score: 52 },
                    { date: 'Mar', score: 48 },
                    { date: 'Abr', score: 61 },
                    { date: 'Mai', score: 68 }
                  ]}
                  competencyDistribution={[
                    { name: 'Técnica', value: 40 },
                    { name: 'Analítica', value: 30 },
                    { name: 'Sócio-emocional', value: 20 },
                    { name: 'Gestão', value: 10 }
                  ]}
                  classComparison={[
                    { name: 'Turma A', score: 72 },
                    { name: 'Turma B', score: 65 },
                    { name: 'Turma C', score: 78 }
                  ]}
                />
              </ProtectedRoute>
            } />

            <Route path="/recommendations" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}>
                <RecommendationsView user={user} userProfile={userProfile} />
              </ProtectedRoute>
            } />

            <Route path="/google-forms-export" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <GoogleFormsExportView user={user} userProfile={userProfile} />
              </ProtectedRoute>
            } />

            <Route path="/chat" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin', 'aluno']}>
                <ChatView user={user} diagnostic={result} />
              </ProtectedRoute>
            } />

            <Route path="/student-dashboard" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}>
                <StudentDashboardView user={user} userProfile={userProfile} />
              </ProtectedRoute>
            } />

            <Route path="/exams-management" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <ExamsManagementView user={user} userProfile={userProfile} selectedModel={selectedModel} />
              </ProtectedRoute>
            } />

            <Route path="/tri-analysis" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <TRIDashboardView />
              </ProtectedRoute>
            } />

            <Route path="/ai-governance" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['admin']}>
                <AIGovernanceView />
              </ProtectedRoute>
            } />

            <Route path="/question-optimizer" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <QuestionOptimizerView userProfile={userProfile} />
              </ProtectedRoute>
            } />

            <Route path="/student-exams" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['aluno']}>
                <StudentExamsView user={user} userProfile={userProfile} selectedModel={selectedModel} />
              </ProtectedRoute>
            } />

            <Route path="/admin-users" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <AdminUsersView user={user} />
              </ProtectedRoute>
            } />

            <Route path="/bi-analysis" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <BIDashboardView />
              </ProtectedRoute>
            } />

            <Route path="/external-forms" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <ExternalFormsView user={user} userProfile={userProfile} />
              </ProtectedRoute>
            } />

            <Route path="/data-import" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <DataImportView />
              </ProtectedRoute>
            } />

            <Route path="/classes" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <ClassesManagementView />
              </ProtectedRoute>
            } />

            <Route path="/disciplines" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <DisciplinesManagementView />
              </ProtectedRoute>
            } />

            <Route path="/lesson-management" element={
              <ProtectedRoute userProfile={userProfile} allowedRoles={['professor', 'admin']}>
                <LessonManagementView userProfile={userProfile} selectedModel={selectedModel} />
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
                  history={history}
                  classAverages={classAverages}
                  selectedModel={selectedModel}
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
                        {results.length > 1 && (
                          <select
                            value={currentDiagnosticId || ''}
                            onChange={(e) => {
                              const selected = results.find(r => r.id === e.target.value);
                              if (selected) {
                                setResult(selected.result);
                                setCurrentDiagnosticId(selected.id);
                                navigate(`/dashboard/${selected.id}`);
                              }
                            }}
                            className="mt-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          >
                            {results.map(r => <option key={r.id} value={r.id}>{r.result.aluno}</option>)}
                          </select>
                        )}
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
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Média Geral</p>
                        <p className="text-3xl font-light">{(result.summary.acuracia_geral * 100).toFixed(1)}%</p>
                        <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-1000" 
                            style={{ width: `${result.summary.acuracia_geral * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Média Ponderada</p>
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
                            <h3 className="text-lg font-bold">Evolução da Média Geral</h3>
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
                                formatter={(value: number) => [`${value}%`, 'Média']}
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
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Média Ponderada</p>
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
                    <div id="recovery-plan" ref={planRef} className="space-y-8 p-4 bg-gray-50 rounded-2xl">
                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold">Plano de Estudos - 7 Dias</h2>
                        <p className="text-gray-500">Cronograma intensivo baseado nas competências em nível crítico.</p>
                        <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">{result.aluno}</p>
                      </div>

                      {/* Performance Comparison per Competency */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                          <BarChart3 size={20} className="text-emerald-600" />
                          <h3 className="text-lg font-bold text-gray-800">Seu Desempenho vs. Média da Turma</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {result.diagnostico_por_competencia.map((comp, idx) => {
                            const studentScore = Math.round((comp.acuracia_ponderada || comp.acuracia) * 100);
                            const classScore = Math.round(classAverages[comp.competencia] || 0);
                            const isAboveAverage = studentScore >= classScore;

                            return (
                              <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 flex flex-col"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight" title={comp.competencia}>
                                    {comp.competencia}
                                  </h4>
                                  <div className={cn(
                                    "flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    isAboveAverage ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                  )}>
                                    {isAboveAverage ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {isAboveAverage ? "Acima" : "Abaixo"}
                                  </div>
                                </div>

                                <div className="h-[120px] w-full mt-auto">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                      data={[
                                        { name: 'Você', value: studentScore, fill: '#10b981' },
                                        { name: 'Turma', value: classScore, fill: '#94a3b8' }
                                      ]}
                                      margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                      <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }} 
                                      />
                                      <YAxis domain={[0, 100]} hide />
                                      <Tooltip 
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                      />
                                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={35}>
                                        <LabelList 
                                          dataKey="value" 
                                          position="top" 
                                          formatter={(val: number) => `${val}%`} 
                                          style={{ fontSize: '11px', fontWeight: 'bold', fill: '#374151' }} 
                                        />
                                        {/* Color individual bars */}
                                        {[{ name: 'Você', value: studentScore, fill: '#10b981' }, { name: 'Turma', value: classScore, fill: '#94a3b8' }].map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
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
              <span className="font-bold tracking-tight">JuniorsStudent</span>
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
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">© 2024 JuniorsStudent - Versão 1.0.0</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Privacidade</a>
            <a href="#" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Termos</a>
            <a href="#" className="text-xs text-gray-400 hover:text-emerald-600 transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
