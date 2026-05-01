import React, { useState, useMemo, useEffect, useRef } from "react";
import { StudyPlanView } from "./components/views/StudyPlanView";
import { ExamTakingView } from "./components/views/ExamTakingView";
import { AdminUsersView } from "./components/views/AdminUsersView";
import { SecurityDashboardView } from "./components/views/SecurityDashboardView";
import { AlunoView } from "./components/views/AlunoView";
import { ProfessorDashboardView } from "./components/views/ProfessorDashboardView";
import { StudentDashboardView } from "./components/views/StudentDashboardView";
import { SmartContentGenerator } from "./components/common/SmartContentGenerator";
import { SAEPItemGenerator } from "./components/admin/SAEPItemGenerator";
import { DiscursiveQuestionGenerator } from "./components/professor/DiscursiveQuestionGenerator";
import { LearningSituationGenerator } from "./components/professor/LearningSituationGenerator";
import { TeacherLearningSituationsView } from "./components/professor/TeacherLearningSituationsView";
import { TeacherAIAssistantPanel } from "./components/professor/TeacherAIAssistantPanel";
import { TeacherCopilotDashboard } from "./components/professor/TeacherCopilotDashboard";
import { TeacherCommandCenterPage } from "./components/professor/command-center/TeacherCommandCenterPage";
import { ClassObservatoryView } from "./components/professor/ClassObservatoryView";
import { StudentLearningSituationsView } from "./components/student/StudentLearningSituationsView";
import { StudentLearningChatbot } from "./components/student/StudentLearningChatbot";
import { StudentLearningPathView } from "./components/student/StudentLearningPathView";
import { StudentImportUploader } from "./components/import/StudentImportUploader";
import { ExerciseImportUploader } from "./components/import/ExerciseImportUploader";
import { TeacherActivitiesManager } from "./components/professor/TeacherActivitiesManager";
import { TeacherRubricsManager } from "./components/professor/TeacherRubricsManager";
import { QuestionsBankView } from "./components/professor/QuestionsBankView";
import { ExamsManagementView } from "./components/professor/ExamsManagementView";
import { CalendarView } from "./components/calendar/CalendarView";
import { CommunicationCenter } from "./components/communication/CommunicationCenter";
import { NotificationCenter } from "./components/notifications/NotificationCenter";
import { StudentActivitiesManager } from "./components/student/StudentActivitiesManager";
import { AdminAIProviderManager } from "./components/admin/AdminAIProviderManager";
import { ClassHealthDashboard } from "./components/analytics/ClassHealthDashboard";
import { PedagogicalRulesManager } from "./components/admin/PedagogicalRulesManager";
import { StudentJourneyTimeline } from "./components/student/StudentJourneyTimeline";
import { InstitutionalTemplateManager } from "./components/admin/InstitutionalTemplateManager";
import { FeatureFlagManager } from "./components/admin/FeatureFlagManager";
import { CorrectionPlanView } from "./components/student/CorrectionPlanView";
import { BIDashboardView } from "./components/dashboard/BIDashboardView";
import { DataImportView } from "./components/admin/DataImportView";
import { ClassesManagementView } from "./components/admin/ClassesManagementView";
import { DisciplinesManagementView } from "./components/admin/DisciplinesManagementView";
import { LessonManagementView } from "./components/professor/LessonManagementView";
import { ResourcesManagerView } from "./components/professor/ResourcesManagerView";
import { getClassCompetencyAverages } from "./services/dashboardService";
import {
  UserProfile,
  Question,
  Exam,
  ExamSubmission,
  StudyPlan,
} from "./types";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
// Initialize Gemini
import { MassRescueDashboard } from "./components/professor/MassRescueDashboard";
import { Sidebar } from "./components/shared/Sidebar";

// Configuração do worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

type AIProvider = "gemini" | "openai" | "deepseek";

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
  Lock,
  Sun,
  Moon,
  MessageSquare,
  Send,
  Loader2,
  User as UserIcon,
  Search,
  ChevronLeft,
  ExternalLink,
  Users,
  X,
  Check,
  XCircle,
  HelpCircle,
  Menu,
  Database,
  Zap as ZapIcon,
  ArrowRight,
  Target,
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
  Archive,
  BarChart2,
  Layout,
  Activity,
  Bot,
  Map as MapIcon,
  Library,
  Shield,
} from "lucide-react";
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
  LabelList,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { AI_CONFIG } from "./ai-config";
import {
  generateDiagnostic,
  generateSuggestions,
  DiagnosticResult,
  generateRecoveryPlan,
  analyzeCognitiveErrors,
  safeParseJson,
  generateContentWrapper,
  DEFAULT_CONFIG,
} from "./services/geminiService";
import { n8nEvents } from "./services/n8nService";


import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { ImportInconsistencyManager } from "./components/professor/ImportInconsistencyManager";
import { pdfExportService } from "./services/pdfExportService";
import { NotificationBell } from "./components/notifications/NotificationBell";
import { EduJarvisPanel } from "./components/eduJarvis/EduJarvisPanel";
import { auth, db, firebaseConfig } from "./firebase";
import {
  User,
  sendPasswordResetEmail,
} from "firebase/auth";
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
  limit,
} from "firebase/firestore";

import { ExternalFormsView } from "./components/professor/ExternalFormsView";
import { FlippedClassroomView } from "./components/views/modules/FlippedClassroomView";
import { CaseStudiesView } from "./components/views/modules/CaseStudiesView";
import { ConsolidatedReportView } from "./components/professor/ConsolidatedReportView";
import { QuestionOptimizerView } from "./components/professor/QuestionOptimizerView";
import { AIGovernanceView } from "./components/admin/AIGovernanceView";
import { TRIDashboardView } from "./components/professor/TRIDashboardView";
import { handleFirestoreError, OperationType } from "./services/errorService";

import { PedagogicalIntelligenceHub } from "./components/professor/PedagogicalIntelligenceHub";
import BIInteligentePage from "./pages/BIInteligentePage";
import GamificacaoPage from "./pages/GamificacaoPage";
import SupabaseAdminStatusPage from "./pages/SupabaseAdminStatusPage";
import { EduJarvisUltraDashboard } from "./components/eduJarvis/EduJarvisUltraDashboard";
import { TutorJarvisView } from "./components/eduJarvis/TutorJarvisView";
import { ActivityGradingPage } from "./pages/professor/ActivityGradingPage";





import { GoogleFormsExportView } from "./components/professor/GoogleFormsExportView";
import { RecommendationsView } from "./components/student/RecommendationsView";
import { ActivityManager } from "./components/professor/ActivityManager";
import { ActivityList } from "./components/student/ActivityList";
import { HeatmapLearning } from "./components/shared/HeatmapLearning";
import { HistoryView } from "./components/views/HistoryView";
import { ReportsView } from "./components/views/ReportsView";
import { TasksView } from "./components/views/TasksView";
import { AdaptiveExamView } from "./components/views/AdaptiveExamView";
import { SocraticTutorView } from "./components/views/SocraticTutorView";
import { ExercisesView } from "./components/views/ExercisesView";
import { StudentExamsView } from "./components/views/StudentExamsView";
import { ChatView } from "./components/views/ChatView";
import { ProfileView } from "./components/views/ProfileView";
import { GamificationDashboardView } from "./components/views/GamificationDashboardView";
import { InteractiveQuizView } from "./components/views/InteractiveQuizView";
import { LabsView } from "./components/views/LabsView";
import { SimulatorsView } from "./components/views/SimulatorsView";
import { cn } from "./lib/utils";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { ObservatorioAlunoView } from "./components/observatory/ObservatorioAlunoView";
import { EvidencePortfolioView } from "./components/portfolio/EvidencePortfolioView";

function DarkModeToggle({
  darkMode,
  setDarkMode,
}: {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

function AIProviderToggle({
  provider,
  onProviderChange,
}: {
  provider: AIProvider;
  onProviderChange: (p: AIProvider) => void;
}) {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
      {(["gemini", "openai", "deepseek"] as AIProvider[]).map((p) => (
        <button
          key={p}
          onClick={() => onProviderChange(p)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
            provider === p
              ? "bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    userProfile,
    isAuthReady,
    isProfessor,
    isAluno,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resendVerification,
    logout,
  } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [results, setResults] = useState<
    Array<{ id: string; result: DiagnosticResult }>
  >([]);
  const [currentDiagnosticId, setCurrentDiagnosticId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [examSubmissions, setExamSubmissions] = useState<any[]>([]);
  const [evolutionFilter, setEvolutionFilter] = useState<"7d" | "30d" | "all">(
    "all",
  );
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem("ai_provider") as AIProvider) || "gemini";
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    const provider =
      (localStorage.getItem("ai_provider") as AIProvider) || "gemini";
    if (provider === "openai") return "gpt-4o-mini";
    if (provider === "deepseek") return "deepseek-chat";
    return "fast";
  });

  const handleProviderChange = (p: AIProvider) => {
    setAiProvider(p);
    localStorage.setItem("ai_provider", p);

    // Set default model for the new provider
    if (p === "openai") {
      setSelectedModel("gpt-4o-mini");
    } else if (p === "deepseek") {
      setSelectedModel("deepseek-chat");
    } else {
      setSelectedModel("fast");
    }

    window.dispatchEvent(new Event("ai_provider_changed"));
    toast.success(
      `Provedor de IA alterado para ${p === "gemini" ? "Gemini" : p === "openai" ? "ChatGPT" : "DeepSeek"}`,
    );
  };
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [classAverages, setClassAverages] = useState<Record<string, number>>(
    {},
  );
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("darkMode") === "true" ||
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
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
        averages.forEach((avg) => {
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
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const assignExams = async () => {
      try {
        const examsSnapshot = await getDocs(collection(db, "exams"));
        const studentExamsSnapshot = await getDocs(
          query(
            collection(db, "student_exams"),
            where("studentId", "==", user.uid),
          ),
        );

        const assignedExamIds = studentExamsSnapshot.docs.map(
          (doc) => doc.data().examId,
        );

        for (const examDoc of examsSnapshot.docs) {
          if (!assignedExamIds.includes(examDoc.id)) {
            await addDoc(collection(db, "student_exams"), {
              studentId: user.uid,
              examId: examDoc.id,
              status: "pending",
              createdAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "student_exams");
      }
    };
    assignExams();
  }, [user, isAuthReady]);

  const planRef = useRef<HTMLDivElement>(null);

  const navItems = useMemo(() => {
    if (!userProfile) return [];
    if (userProfile.role === "STUDENT" || userProfile.role === "MONITOR") {
      const items: any[] = [
        { type: "header", label: "Principal" },
        {
          id: "student-dashboard",
          label: "Meu Painel",
          icon: LayoutDashboard,
          path: "/student-dashboard",
        },
        {
          id: "student-observatory",
          label: "Observatório 360",
          icon: Telescope,
          path: "/student-observatory",
          description: "Visão Geral do Aluno",
        },
        { type: "header", label: "Módulos de Aprendizado" },
        {
          id: "student-exams",
          label: "Simulados",
          icon: BookOpen,
          path: "/student-exams",
          description: "Diagnóstico e Avaliação",
        },
        {
          id: "student-activities",
          label: "Minhas Atividades",
          icon: CheckSquare,
          path: "/student-activities",
          description: "Entregas e Notas",
        },
        {
          id: "evidence-portfolio",
          label: "Portfólio",
          icon: Archive,
          path: "/evidence-portfolio",
          description: "Acervo de Evidências",
        },
        {
          id: "exercises",
          label: "Exercícios",
          icon: CheckSquare,
          path: "/exercises",
          description: "Prática e Aprendizado",
        },
        {
          id: "student-sa",
          label: "Situações de Aprendizagem",
          icon: BookOpen,
          path: "/student-sa",
          description: "Desafios Práticos",
        },
        {
          id: "correction-plans",
          label: "Planos de Acerto",
          icon: FileText,
          path: "/correction-plans",
          description: "Recuperação de Erros",
        },
        {
          id: "learning-path",
          label: "Minha Trilha",
          icon: MapIcon,
          path: "/learning-path",
          description: "Caminho Personalizado",
        },
        {
          id: "student-journey",
          label: "Minha Jornada",
          icon: MapIcon,
          path: "/student-journey",
          description: "Evolução e Linha do Tempo",
        },
        {
          id: "calendar",
          label: "Calendário",
          icon: Calendar,
          path: "/calendar",
          description: "Prazos e Eventos",
        },
        {
          id: "communication",
          label: "Comunicação",
          icon: MessageSquare,
          path: "/communication",
          description: "Avisos e Fórum",
        },
        { type: "header", label: "Suporte IA" },
        {
          id: "student-chatbot",
          label: "Chatbot Educacional",
          icon: MessageSquare,
          path: "/student-chatbot",
          description: "Assistente n8n",
        },
        {
          id: "tutor-jarvis",
          label: "Tutor Jarvis 2.0",
          icon: Brain,
          path: "/tutor-jarvis",
          description: "Apoio ao Estudo Inteligente",
        },
        {
          id: "smart-content",
          label: "Gerador IA",
          icon: Sparkles,
          path: "/smart-content",
          description: "Conteúdo Personalizado",
        },
        { id: "study-plan", label: "Plano IA", icon: ZapIcon, path: "/study-plan" },
        { type: "header", label: "Outros" },
        { id: "history", label: "Histórico", icon: History, path: "/history" },
        {
          id: "recommendations",
          label: "Recomendações IA",
          icon: Target,
          path: "/recommendations",
        },
        {
          id: "plan",
          label: "Meu Plano",
          icon: Calendar,
          disabled: !result,
          path: "/plan",
        },
        { id: "profile", label: "Perfil", icon: UserIcon, path: "/profile" },
      ];

      if (userProfile.gamificationEnabled) {
        items.splice(items.findIndex((i) => i.id === "learning-path") + 1, 0, {
          id: "gamification",
          label: "Gamificação",
          icon: Trophy,
          path: "/gamification",
          description: "Jogos e Revisão SAEP",
        });
      } else {
        items.splice(
          items.findIndex((i) => i.id === "communication"),
          0,
          {
            id: "gamification-stats",
            label: "Meus Pontos",
            icon: Trophy,
            path: "/gamification",
          },
        );
      }

      return items;
    }
    return [
      { type: "header", label: "Painel Principal" },
      {
        id: "dashboard",
        label: "Meu Painel",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        id: "intelligence",
        label: "Central de Inteligência",
        icon: BrainCircuit,
        path: "/intelligence",
        description: "20 Módulos de IA Educacional",
      },
      {
        id: "edujarvis-ultra",
        label: "EduJarvis ULTRA",
        icon: ZapIcon,
        path: "/edujarvis-ultra",
        description: "Orquestrador Pedagógico 2.0",
      },
      {
        id: "class-health",
        label: "Saúde da Turma",
        icon: Activity,
        path: "/class-health",
        description: "Métricas de Maturidade",
      },
      {
        id: "heatmap",
        label: "Monitoramento Heatmap",
        icon: Target,
        path: "/heatmap",
        description: "Visão Geral TRI",
      },
      {
        id: "activity-manager",
        label: "Minhas Atividades",
        icon: CheckSquare,
        path: "/activity-manager",
        description: "Atribuição e Correção",
      },

      { type: "header", label: "Gestão de Dados" },
      {
        id: "data-import",
        label: "Importação n8n",
        icon: Database,
        path: "/data-import",
        description: "Integração SIAC",
      },
      {
        id: "import-students",
        label: "Importar Alunos",
        icon: Upload,
        path: "/import-students",
        description: "CSV/Excel",
      },
      {
        id: "import-exercises",
        label: "Importar Exercícios",
        icon: BookOpen,
        path: "/import-exercises",
        description: "Banco de Questões",
      },
      {
        id: "external-forms",
        label: "Formulários Externos",
        icon: ExternalLink,
        path: "/external-forms",
        description: "Sincronização n8n",
      },
      { id: "reports", label: "Relatórios", icon: BarChart3, path: "/reports" },
      {
        id: "consolidated-report",
        label: "Consolidado",
        icon: BarChart2,
        path: "/consolidated-report",
      },
      {
        id: "tri-analysis",
        label: "Análise TRI",
        icon: Target,
        path: "/tri-analysis",
        description: "Psicometria SAEP",
      },
      {
        id: "question-optimizer",
        label: "Otimizador IA",
        icon: ZapIcon,
        path: "/question-optimizer",
        description: "Refatoração de Itens",
      },
      { id: "input", label: "Entrada", icon: Upload, path: "/input" },
      { id: "history", label: "Histórico", icon: History, path: "/history" },

      { type: "header", label: "Gestão Pedagógica" },
      { id: "classes", label: "Turmas", icon: Users, path: "/classes" },
      {
        id: "disciplines",
        label: "Disciplinas",
        icon: BookOpen,
        path: "/disciplines",
      },
      {
        id: "lesson-management",
        label: "Gestão de Aulas",
        icon: Layout,
        path: "/lesson-management",
        description: "Planejamento IA",
      },
      {
        id: "generate-questions",
        label: "Gerar Questões IA",
        icon: BrainCircuit,
        path: "/generate-questions",
        description: "Criação SAEP",
      },
      {
        id: "teacher-ai-assistant",
        label: "IA Avançada",
        icon: Sparkles,
        path: "/teacher-ai-assistant",
        description: "Estudos de Caso e Mais",
      },
      {
        id: "generate-discursive",
        label: "Gerar Discursivas IA",
        icon: FileText,
        path: "/generate-discursive",
        description: "Questões Abertas",
      },
      {
        id: "learning-situation",
        label: "Gerador de SA",
        icon: BrainCircuit,
        path: "/learning-situation",
        description: "Gerador SA",
      },
      {
        id: "observatory",
        label: "Observatório",
        icon: Telescope,
        path: "/observatory",
        description: "Visão Pedagógica",
      },
      {
        id: "pedagogical-rules",
        label: "Regras do Sistema",
        icon: ZapIcon,
        path: "/pedagogical-rules",
        description: "Central de Regras",
      },
      {
        id: "institutional-templates",
        label: "Templates Base",
        icon: Library,
        path: "/institutional-templates",
        description: "Padronização",
      },
      {
        id: "teacher-activities",
        label: "Entregas e Correções",
        icon: CheckSquare,
        path: "/teacher-activities",
        description: "Gestão de Atividades",
      },
      {
        id: "teacher-rubrics",
        label: "Rubricas de Avaliação",
        icon: CheckSquare,
        path: "/teacher-rubrics",
        description: "Critérios de Correção",
      },
      {
        id: "calendar",
        label: "Calendário",
        icon: Calendar,
        path: "/calendar",
        description: "Prazos e Eventos",
      },
      {
        id: "my-learning-situations",
        label: "Minhas SAs",
        icon: BookOpen,
        path: "/my-learning-situations",
        description: "Gestão de SAs",
      },
      {
        id: "questions-bank",
        label: "Banco de Questões",
        icon: Database,
        path: "/questions-bank",
      },
      {
        id: "exams-management",
        label: "Simulados",
        icon: BookOpen,
        path: "/exams",
        description: "Avaliação Formal",
      },
      {
        id: "google-forms-export",
        label: "Exportar Google Forms",
        icon: Share2,
        path: "/google-forms-export",
        description: "Integração Externa",
      },
      {
        id: "exercises-management",
        label: "Exercícios",
        icon: CheckSquare,
        path: "/exercises-management",
        description: "Prática Dirigida",
      },

      { type: "header", label: "Comunicação e Admin" },
      { id: "chat", label: "Chat IA", icon: MessageSquare, path: "/chat" },
      {
        id: "communication",
        label: "Comunicação",
        icon: MessageSquare,
        path: "/communication",
        description: "Avisos e Fórum",
      },
      { id: "admin-users", label: "Gestão", icon: Users, path: "/admin-users" },
      {
        id: "security-hub",
        label: "Cybersecurity",
        icon: Shield,
        path: "/security-hub",
        description: "EuAiCore SecOps",
      },
      {
        id: "ai-governance",
        label: "Governança IA",
        icon: Shield,
        path: "/system-governance",
        description: "Custos e Feature Flags",
      },
      {
        id: "ai-providers",
        label: "Provedores IA",
        icon: Settings,
        path: "/ai-providers",
        description: "Gestão de Chaves",
      },
      {
        id: "smart-content",
        label: "Gerador IA",
        icon: Sparkles,
        path: "/smart-content",
        description: "Conteúdo Inteligente",
      },

      { type: "header", label: "Visão do Aluno" },
      {
        id: "STUDENT",
        label: "Detalhes",
        icon: UserCheck,
        disabled: !result,
        path:
          result && currentDiagnosticId
            ? `/aluno/${currentDiagnosticId}`
            : "/aluno",
      },
      {
        id: "plan",
        label: "Plano",
        icon: Calendar,
        disabled: !result,
        path: "/plan",
      },
      { id: "profile", label: "Perfil", icon: UserIcon, path: "/profile" },
    ];
  }, [userProfile, result, currentDiagnosticId]);

  const exportPlanToPDF = async () => {
    if (!planRef.current || !result) return;

    setLoading(true);
    toast.info("Preparando PDF...");

    try {
      const filename = `Plano_Estudos_${result.aluno.replace(/\s+/g, "_")}`;
      await pdfExportService.exportElementToPDF(planRef.current, filename);
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthReady) return;
    const parts = location.pathname.split("/");
    const view = parts[1];
    const id = parts[2];

    if (
      (view === "STUDENT" || view === "dashboard") &&
      id &&
      id !== currentDiagnosticId
    ) {
      const fetchDiagnostic = async () => {
        try {
          const docRef = doc(db, "diagnostics", id);
          const docSnap = await getDocFromServer(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();

            // Authorization check for students
            if (userProfile?.role === "STUDENT" && data.userId !== user?.uid) {
              toast.error(
                "Você não tem permissão para acessar este diagnóstico.",
              );
              navigate("/student-dashboard");
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
    const path = location.pathname.split("/")[1] || "input";
    return path;
  }, [location]);

  // History Listener
  useEffect(() => {
    if (!user || !userProfile) {
      setHistory([]);
      return;
    }

    const path = "diagnostics";
    let q;

    if (isProfessor) {
      q = query(collection(db, path), orderBy("createdAt", "desc"));
    } else {
      q = query(
        collection(db, path),
        where("studentId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHistory(docs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
      },
    );

    return () => unsubscribe();
  }, [user, userProfile]);

  // Exam Submissions Listener
  useEffect(() => {
    if (!user || !userProfile) {
      setExamSubmissions([]);
      return;
    }

    const path = "exam_submissions";
    let q;

    if (isProfessor) {
      q = query(collection(db, path), orderBy("completedAt", "desc"));
    } else {
      q = query(
        collection(db, path),
        where("studentId", "==", user.uid),
        orderBy("completedAt", "desc"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExamSubmissions(docs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
      },
    );

    return () => unsubscribe();
  }, [user, userProfile]);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("the client is offline")
        ) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthenticating(true);
    try {
      await loginWithEmail(email, password);
      toast.success("Login realizado com sucesso!");
    } catch (err: any) {
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
      await registerWithEmail(email, password, displayName);
      setVerificationSent(true);
      toast.success("Conta criada! Verifique seu e-mail.");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso.");
      } else {
        setError("Falha ao criar conta. Verifique os dados.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const checkVerificationStatus = async () => {
    setIsVerifying(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          toast.success("E-mail verificado com sucesso!");
        } else {
          toast.info(
            "E-mail ainda não verificado. Por favor, cheque sua caixa de entrada.",
          );
        }
      }
    } catch (err: any) {
      toast.error("Erro ao verificar status: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const performLogout = async () => {
    try {
      await logout();
      setResult(null);
      setData([]);
      setHistory([]);
      setExamSubmissions([]);
      setIsMobileMenuOpen(false);
      navigate("/input");
      toast.success("Desconectado com sucesso!");
    } catch (err) {
      console.error("Logout Error", err);
      toast.error("Erro ao desconectar.");
    }
  };

  const deleteDiagnostic = async (id: string) => {
    const path = `diagnostics/${id}`;
    try {
      await deleteDoc(doc(db, "diagnostics", id));
      toast.success("Diagnóstico excluído com sucesso!");
    } catch (err) {
      toast.error("Erro ao excluir diagnóstico.");
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const archiveDiagnostic = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "diagnostics", id), {
        archived: !currentStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(
        currentStatus
          ? "Diagnóstico restaurado com sucesso!"
          : "Diagnóstico arquivado com sucesso!",
      );
    } catch (err) {
      toast.error("Erro ao alterar status do diagnóstico.");
      handleFirestoreError(err, OperationType.UPDATE, `diagnostics/${id}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (results: any) => {
          setData(results.data);
          setError(null);
          toast.success("Arquivo CSV carregado com sucesso!");
          setIsProcessingFile(false);
        },
        error: (err: any) => {
          setError("Erro ao processar CSV: " + err.message);
          toast.error("Erro ao processar CSV.");
          setIsProcessingFile(false);
        },
      });
    } else if (
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".ods")
    ) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          setData(data as any[]);
          setError(null);
          toast.success("Planilha carregada com sucesso!");
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
      toast.success("Dados colados com sucesso!");
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
      const studentsData: Record<
        string,
        { rows: any[]; email: string; matricula: string }
      > = {};
      data.forEach((row) => {
        const studentName =
          row.aluno ||
          row.Aluno ||
          row.nome ||
          row.Nome ||
          row["Nome do Aluno"] ||
          row["Nome do aluno"] ||
          row["Nome Aluno"] ||
          "Estudante Sem Nome";
        const studentEmail =
          row.email || row.Email || row.correio || row.Correio || "";
        const studentMatricula =
          row.matricula || row.Matricula || row.id || row.ID || "";

        if (!studentsData[studentName]) {
          studentsData[studentName] = {
            rows: [],
            email: studentEmail,
            matricula: studentMatricula,
          };
        }
        studentsData[studentName].rows.push(row);
        if (!studentsData[studentName].email && studentEmail)
          studentsData[studentName].email = studentEmail;
        if (!studentsData[studentName].matricula && studentMatricula)
          studentsData[studentName].matricula = studentMatricula;
      });

      const studentNames = Object.keys(studentsData);
      const allResults: DiagnosticResult[] = [];
      const savedIds: string[] = [];
      const path = "diagnostics";

      toast.info(`Processando ${studentNames.length} alunos...`);

      // Process each student individually to avoid context limits and ensure all are processed
      for (const name of studentNames) {
        try {
          const studentInfo = studentsData[name];
          const results = await generateDiagnostic(
            studentInfo.rows,
            selectedModel,
            (userProfile?.role as any) || "TEACHER",
          );

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
              createdAt: new Date().toISOString(),
            });
            savedIds.push(docRef.id);

            // Trigger n8n automation
            await n8nEvents.diagnosticCreated({
              professorId: user.uid,
              aluno: res.aluno,
              result: res,
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
      setResults(
        allResults.map((res, index) => ({ id: savedIds[index], result: res })),
      );
      setResult(allResults[0]);
      setCurrentDiagnosticId(savedIds[0]);

      if (allResults.length > 1) {
        toast.success(`${allResults.length} diagnósticos gerados com sucesso!`);
        navigate("/history");
      } else {
        toast.success("Diagnóstico gerado com sucesso!");
        navigate(`/dashboard/${savedIds[0]}`);
      }
    } catch (err: any) {
      toast.error(
        `Erro ao gerar diagnóstico: ${err.message || "Verifique sua chave API e os dados."}`,
      );
      setError(
        `Erro ao gerar diagnóstico: ${err.message || "Verifique sua chave API e os dados."}`,
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.diagnostico_por_competencia.map((d) => ({
      name:
        d.competencia.length > 20
          ? d.competencia.substring(0, 20) + "..."
          : d.competencia,
      acuracia: d.acuracia_ponderada * 100,
      nivel: d.nivel,
    }));
  }, [result]);

  const evolutionData = useMemo(() => {
    if (!result || !history.length) return [];

    const getDate = (createdAt: any) => {
      if (!createdAt) return new Date(0);
      if (createdAt.seconds) return new Date(createdAt.seconds * 1000);
      return new Date(createdAt);
    };

    let filteredHistory = history.filter((h) => h.aluno === result.aluno);

    const now = new Date();
    if (evolutionFilter === "7d") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredHistory = filteredHistory.filter(
        (h) => getDate(h.createdAt) >= sevenDaysAgo,
      );
    } else if (evolutionFilter === "30d") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredHistory = filteredHistory.filter(
        (h) => getDate(h.createdAt) >= thirtyDaysAgo,
      );
    }

    const sorted = [...filteredHistory].sort(
      (a, b) => getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime(),
    );

    return sorted.map((h) => {
      const dateObj = getDate(h.createdAt);
      return {
        date: dateObj.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        fullDate: dateObj.toLocaleString("pt-BR"),
        acuracia: Math.round(h.result.summary.acuracia_geral * 100),
      };
    });
  }, [result, history, evolutionFilter]);

  const exportToCSV = () => {
    if (!result) return;

    const csvData: any[] = result.diagnostico_por_competencia.map((comp) => ({
      Aluno: result.aluno,
      Competência: comp.competencia,
      Nível: comp.nivel,
      "Média (%)": (comp.acuracia_ponderada * 100).toFixed(1),
      Acertos: comp.acertos,
      "Total Questões": comp.total_questoes,
      "Conhecimentos Fracos": (comp.conhecimentos_fracos || []).join("; "),
      Recomendações: comp.recomendacoes,
    }));

    // Add summary row
    csvData.push({
      Aluno: result.aluno,
      Competência: "RESUMO GERAL",
      Nível: "-",
      "Média (%)": (result.summary.acuracia_geral * 100).toFixed(1),
      Acertos: result.summary.acertos,
      "Total Questões": result.summary.total_questoes,
      "Conhecimentos Fracos": "-",
      Recomendações: "-",
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `diagnostico_${result.aluno.replace(/\s+/g, "_")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 text-[#1A1A1A] dark:text-gray-100 font-sans selection:bg-emerald-100 flex">
      {/* Sidebar for Desktop */}
      <Sidebar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        aiProvider={aiProvider}
        onProviderChange={handleProviderChange}
        handleLogout={performLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header & Email Verification Banner */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          {user && !user.emailVerified && (
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center justify-between text-amber-800 text-xs font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} />
                <span>
                  Seu e-mail não está verificado. Verifique seu e-mail para
                  acessar todas as funcionalidades.
                </span>
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
                  {isVerifying && (
                    <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  {isVerifying ? "Verificando..." : "Já verifiquei"}
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
                <h1 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
                  EduDiagnóstico
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && <NotificationBell userId={user.uid} />}
              {isProfessor && (
                <AIProviderToggle
                  provider={aiProvider}
                  onProviderChange={handleProviderChange}
                />
              )}
              <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
              {!user && (
                <button
                  onClick={loginWithGoogle}
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
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {navItems.map((tab, idx) =>
                  tab.type === "header" ? (
                    <div
                      key={`header-mob-${idx}`}
                      className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] pt-4 first:pt-0"
                    >
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
                          : tab.disabled
                            ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50",
                      )}
                    >
                      <tab.icon size={18} />
                      <div className="text-left">
                        <p>{tab.label}</p>
                        {tab.description && (
                          <p className="text-[10px] font-medium opacity-60">
                            {tab.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ),
                )}

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4 px-4">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      {userProfile.role === "STUDENT" && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold">
                            Lvl {userProfile.level || 1}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            {userProfile.xp || 0} XP
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {isProfessor && (
                        <AIProviderToggle
                          provider={aiProvider}
                          onProviderChange={handleProviderChange}
                        />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={performLogout}
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

        <main
          className={cn(
            "max-w-7xl mx-auto p-6 relative flex-1 w-full",
            !user &&
              "flex flex-col items-center justify-center min-h-[calc(100vh-120px)]",
          )}
        >
          {loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full text-center space-y-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2
                      className="text-emerald-600 animate-pulse"
                      size={24}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    Gerando Diagnóstico
                  </h3>
                  <p className="text-sm text-gray-500">
                    A inteligência artificial está analisando os dados e criando
                    um plano de estudos personalizado...
                  </p>
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
                  {authMode === "login"
                    ? "Bem-vindo de volta"
                    : "Crie sua conta"}
                </h2>
                <p className="text-gray-500">
                  {authMode === "login"
                    ? "Acesse seus diagnósticos e planos de estudo."
                    : "Comece a gerar diagnósticos inteligentes hoje."}
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl space-y-6">
                <form
                  onSubmit={
                    authMode === "login" ? handleEmailLogin : handleRegister
                  }
                  className="space-y-4"
                >
                  {authMode === "register" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Nome Completo
                      </label>
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
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      E-mail
                    </label>
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
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Senha
                    </label>
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
                    {isAuthenticating
                      ? "Aguarde..."
                      : authMode === "login"
                        ? "Entrar"
                        : "Criar Conta"}
                  </button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400 font-bold tracking-widest">
                      Ou continue com
                    </span>
                  </div>
                </div>

                <button
                  onClick={loginWithGoogle}
                  disabled={isAuthenticating}
                  className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {isAuthenticating ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {isAuthenticating ? "Conectando..." : "Google"}
                </button>

                <div className="text-center">
                  <p className="text-xs text-emerald-600 font-medium mb-4 bg-emerald-50 py-2 rounded-lg">
                    👨‍🎓 Alunos: Por favor, utilizem o login com Google.
                  </p>
                  <button
                    onClick={() =>
                      setAuthMode(authMode === "login" ? "register" : "login")
                    }
                    className="text-sm font-bold text-gray-500 hover:text-emerald-700"
                  >
                    {authMode === "login"
                      ? "Professor? Não tem uma conta? Cadastre-se"
                      : "Já tem uma conta? Entre"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route
                  path="/"
                  element={
                    <Navigate
                      to={
                        userProfile?.role === "STUDENT"
                          ? "/student-dashboard"
                          : "/dashboard"
                      }
                      replace
                    />
                  }
                />
                <Route
                  path="/exams"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ExamsManagementView
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                        defaultType="simulado"
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/simulados/inconsistencies"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ImportInconsistencyManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exercises-management"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ExamsManagementView
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                        defaultType="exercicio"
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/questions-bank"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <QuestionsBankView
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-exams"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <StudentExamsView
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-activities"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <StudentActivitiesManager userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exercises"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <ExercisesView
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-sa"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <StudentLearningSituationsView
                        userProfile={userProfile}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quizzes"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "STUDENT",
                        "MONITOR",
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                      ]}
                    >
                      <InteractiveQuizView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/labs"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "STUDENT",
                        "MONITOR",
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                      ]}
                    >
                      <LabsView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-simulators"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "STUDENT",
                        "MONITOR",
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                      ]}
                    >
                      <SimulatorsView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learning-path"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <StudentLearningPathView userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gamification"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <GamificationDashboardView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/correction-plans"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <div className="py-8">
                        <CorrectionPlanView studentId={user?.uid || ""} />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-chatbot"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <div className="max-w-4xl mx-auto">
                        <StudentLearningChatbot userProfile={userProfile} />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/import-students"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <StudentImportUploader userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/import-exercises"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ExerciseImportUploader userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/study-plan"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "STUDENT",
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "MONITOR",
                      ]}
                    >
                      <StudyPlanView
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/adaptive-exam/:competency"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <AdaptiveExamView
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/consolidated-report"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <div className="py-8">
                        <ConsolidatedReportView
                          history={[
                            ...history,
                            ...examSubmissions.map((sub) => ({
                              ...sub,
                              isSubmission: true,
                              createdAt: sub.completedAt,
                              aluno: sub.studentName || sub.studentId,
                            })),
                          ]}
                          onReset={resetHistory}
                        />
                      </div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/socratic-tutor"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <SocraticTutorView
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/smart-content"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "STUDENT",
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "MONITOR",
                      ]}
                    >
                      <SmartContentGenerator
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/copilot"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <TeacherCopilotDashboard
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/command-center"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <TeacherCommandCenterPage userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/generate-questions"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <SAEPItemGenerator
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher-ai-assistant"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <TeacherAIAssistantPanel
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/generate-discursive"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <DiscursiveQuestionGenerator
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/observatory"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ClassObservatoryView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher-activities"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <TeacherActivitiesManager
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher-rubrics"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <TeacherRubricsManager userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activity-manager"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ActivityManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/heatmap"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <HeatmapLearning />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pedagogical-rules"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["ADMIN", "TEACHER", "COORDINATOR"]}
                    >
                      <PedagogicalRulesManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/class-health"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ClassHealthDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-journey"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "STUDENT",
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "MONITOR",
                      ]}
                    >
                      <StudentJourneyTimeline userId={user.uid} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/institutional-templates"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["ADMIN", "TEACHER", "COORDINATOR"]}
                    >
                      <InstitutionalTemplateManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/system-governance"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["ADMIN"]}
                    >
                      <FeatureFlagManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-activities"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "ADMIN"]}
                    >
                      <ActivityList userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-observatory"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <ObservatorioAlunoView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/evidence-portfolio"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <EvidencePortfolioView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "STUDENT",
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "MONITOR",
                      ]}
                    >
                      <CalendarView userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/communication"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "STUDENT",
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "MONITOR",
                      ]}
                    >
                      <CommunicationCenter userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "STUDENT",
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "MONITOR",
                      ]}
                    >
                      <NotificationCenter userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learning-situation"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <LearningSituationGenerator
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/simulators"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <SimulatorsView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/aula-invertida"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "STUDENT",
                      ]}
                    >
                      <FlippedClassroomView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos-caso"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "STUDENT",
                      ]}
                    >
                      <CaseStudiesView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-learning-situations"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <TeacherLearningSituationsView
                        userProfile={userProfile}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-providers"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["ADMIN"]}
                    >
                      <AdminAIProviderManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/input"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                            <div className="space-y-2">
                              <h2 className="text-2xl font-bold">
                                Importar Dados
                              </h2>
                              <p className="text-gray-500">
                                Carregue o arquivo CSV ou Excel do simulado ou
                                cole o JSON bruto.
                              </p>
                            </div>

                            <div className="space-y-4">
                              <label className="block">
                                <span className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Arquivo de Planilha (CSV, Excel)
                                </span>
                                <div className="relative group">
                                  <input
                                    type="file"
                                    accept=".csv, .xlsx, .xls, .ods"
                                    onChange={handleFileUpload}
                                    disabled={isProcessingFile}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                  />
                                  <div
                                    className={`border-2 border-dashed border-gray-200 rounded-xl p-8 text-center transition-colors bg-gray-50 ${isProcessingFile ? "opacity-50" : "group-hover:border-emerald-400"}`}
                                  >
                                    {isProcessingFile ? (
                                      <div className="flex flex-col items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
                                        <p className="text-sm text-gray-600">
                                          Processando arquivo...
                                        </p>
                                      </div>
                                    ) : (
                                      <>
                                        <Upload
                                          className="mx-auto text-gray-400 mb-3 group-hover:text-emerald-500 transition-colors"
                                          size={32}
                                        />
                                        <p className="text-sm text-gray-600">
                                          {data.length > 0
                                            ? `${data.length} linhas carregadas`
                                            : "Clique ou arraste o arquivo CSV ou Excel aqui"}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </label>

                              <div className="relative">
                                <div
                                  className="absolute inset-0 flex items-center"
                                  aria-hidden="true"
                                >
                                  <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                  <span className="px-2 bg-white text-gray-500 uppercase tracking-widest text-[10px] font-bold">
                                    OU
                                  </span>
                                </div>
                              </div>

                              <label className="block">
                                <span className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Colar JSON
                                </span>
                                <textarea
                                  onChange={handlePaste}
                                  placeholder='[{"aluno": "João", "competencia": "C1", "acertou": 1, "bloom": "Médio"}, ...]'
                                  className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                />
                              </label>

                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 block">
                                  Modelo Gemini
                                </label>
                                <select
                                  value={selectedModel}
                                  onChange={(e) =>
                                    setSelectedModel(e.target.value)
                                  }
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                                >
                                  <option value="gemini-1.5-flash">
                                    Gemini 1.5 Flash (Rápido)
                                  </option>
                                  <option value="gemini-1.5-pro">
                                    Gemini 1.5 Pro (Complexo)
                                  </option>
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
                                <AlertCircle
                                  size={18}
                                  className="shrink-0 mt-0.5"
                                />
                                <p>{error}</p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-6">
                            <div className="bg-emerald-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                              <div className="relative z-10 space-y-4">
                                <h3 className="text-xl font-bold">
                                  Instruções de Mapeamento
                                </h3>
                                <ul className="space-y-3 text-emerald-100 text-sm">
                                  <li className="flex gap-2">
                                    <ChevronRight
                                      size={16}
                                      className="shrink-0 text-emerald-400"
                                    />
                                    <span>
                                      O sistema detecta automaticamente colunas
                                      como <b>competencia</b>, <b>bloom</b> e{" "}
                                      <b>acertou</b>.
                                    </span>
                                  </li>
                                  <li className="flex gap-2">
                                    <ChevronRight
                                      size={16}
                                      className="shrink-0 text-emerald-400"
                                    />
                                    <span>
                                      Pesos automáticos: Fácil (1.0), Médio
                                      (1.5), Difícil (2.0), Superdifícil (3.0).
                                    </span>
                                  </li>
                                  <li className="flex gap-2">
                                    <ChevronRight
                                      size={16}
                                      className="shrink-0 text-emerald-400"
                                    />
                                    <span>
                                      Gere diagnósticos individuais ou por turma
                                      (o sistema agrupa por aluno).
                                    </span>
                                  </li>
                                </ul>
                              </div>
                              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                                Prévia dos Dados
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-100">
                                      {data.length > 0 &&
                                        Object.keys(data[0])
                                          .slice(0, 4)
                                          .map((k) => (
                                            <th
                                              key={k}
                                              className="pb-2 font-semibold text-gray-600"
                                            >
                                              {k}
                                            </th>
                                          ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {data.slice(0, 10).map((row, i) => (
                                      <tr
                                        key={i}
                                        className="border-b border-gray-50 last:border-0"
                                      >
                                        {Object.values(row)
                                          .slice(0, 4)
                                          .map((v: any, j) => (
                                            <td
                                              key={j}
                                              className="py-2 text-gray-500 truncate max-w-[100px]"
                                            >
                                              {String(v)}
                                            </td>
                                          ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {data.length === 0 && (
                                  <p className="text-center py-8 text-gray-400 italic">
                                    Nenhum dado carregado
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ProfessorDashboardView
                        user={user}
                        userProfile={userProfile}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "STUDENT",
                        "MONITOR",
                      ]}
                    >
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
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ReportsView history={history} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <TasksView user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/intelligence"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <PedagogicalIntelligenceHub />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/advanced-dashboard"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <EduJarvisUltraDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recommendations"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <RecommendationsView
                        user={user}
                        userProfile={userProfile}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/google-forms-export"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <GoogleFormsExportView
                        user={user}
                        userProfile={userProfile}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "STUDENT",
                        "MONITOR",
                      ]}
                    >
                      <ChatView user={user} diagnostic={result} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-dashboard"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <StudentDashboardView
                        user={user}
                        userProfile={userProfile}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exams-management"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ExamsManagementView
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tri-analysis"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <TRIDashboardView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-governance"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["ADMIN"]}
                    >
                      <AIGovernanceView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/question-optimizer"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <QuestionOptimizerView userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student-exams"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <StudentExamsView
                        user={user}
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/security-hub"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["ADMIN", "TEACHER", "COORDINATOR"]}
                    >
                      <SecurityDashboardView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-users"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <AdminUsersView user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bi-analysis"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <BIDashboardView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/external-forms"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ExternalFormsView
                        user={user}
                        userProfile={userProfile}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/data-import"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <DataImportView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/classes"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ClassesManagementView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/disciplines"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <DisciplinesManagementView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lesson-management"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <LessonManagementView
                        userProfile={userProfile}
                        selectedModel={selectedModel}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ResourcesManagerView
                        user={user}
                        userProfile={userProfile as any}
                      />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "STUDENT",
                        "MONITOR",
                      ]}
                    >
                      <ProfileView user={user} profile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/aluno/:id?"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "STUDENT",
                        "MONITOR",
                      ]}
                    >
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
                  }
                />
                <Route
                  path="/dashboard/:id?"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "STUDENT",
                        "MONITOR",
                      ]}
                    >
                      {result ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-8"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">
                                Dashboard de Diagnóstico
                              </h2>
                              <p className="text-sm text-gray-500">
                                Visão geral do desempenho de {result.aluno}
                              </p>
                              {results.length > 1 && (
                                <select
                                  value={currentDiagnosticId || ""}
                                  onChange={(e) => {
                                    const selected = results.find(
                                      (r) => r.id === e.target.value,
                                    );
                                    if (selected) {
                                      setResult(selected.result);
                                      setCurrentDiagnosticId(selected.id);
                                      navigate(`/dashboard/${selected.id}`);
                                    }
                                  }}
                                  className="mt-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                  {results.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.result.aluno}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() =>
                                  navigate(
                                    currentDiagnosticId
                                      ? `/aluno/${currentDiagnosticId}`
                                      : "/aluno",
                                  )
                                }
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 group"
                              >
                                <UserCheck
                                  size={18}
                                  className="group-hover:scale-110 transition-transform"
                                />
                                Ver Detalhes do Aluno
                              </button>
                              <button
                                onClick={exportToCSV}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm group"
                              >
                                <Download
                                  size={18}
                                  className="text-emerald-600 group-hover:scale-110 transition-transform"
                                />
                                Exportar CSV
                              </button>
                            </div>
                          </div>

                          {/* Summary Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                Média Geral
                              </p>
                              <p className="text-3xl font-light">
                                {(result.summary.acuracia_geral * 100).toFixed(
                                  1,
                                )}
                                %
                              </p>
                              <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 transition-all duration-1000"
                                  style={{
                                    width: `${result.summary.acuracia_geral * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                Média Ponderada
                              </p>
                              <p className="text-3xl font-light">
                                {(
                                  result.summary.acuracia_ponderada * 100
                                ).toFixed(1)}
                                %
                              </p>
                              <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-1000"
                                  style={{
                                    width: `${result.summary.acuracia_ponderada * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                Total Questões
                              </p>
                              <p className="text-3xl font-light">
                                {result.summary.total_questoes}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {result.summary.acertos} acertos totais
                              </p>
                            </div>
                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                                Aluno
                              </p>
                              <p className="text-xl font-bold text-emerald-900 truncate">
                                {result.aluno}
                              </p>
                              <p className="text-xs text-emerald-700 mt-2">
                                Diagnóstico Individual
                              </p>
                            </div>
                          </div>

                          {/* Alerts */}
                          {userProfile?.role !== "STUDENT" && userProfile?.role !== "MONITOR" && result.summary.alertas_dados?.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-center">
                              <AlertCircle
                                className="text-amber-600"
                                size={20}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-amber-900">
                                  Alertas de Dados / Segurança
                                </p>
                                <p className="text-xs text-amber-700">
                                  {(result.summary.alertas_dados || []).join(", ")}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Bar Chart */}
                            <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                              <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-bold">
                                  Desempenho por Competência
                                </h3>
                                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                                  <span className="flex items-center gap-1.5 text-emerald-600">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                                    Forte
                                  </span>
                                  <span className="flex items-center gap-1.5 text-amber-600">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />{" "}
                                    Atenção
                                  </span>
                                  <span className="flex items-center gap-1.5 text-red-600">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />{" "}
                                    Crítico
                                  </span>
                                </div>
                              </div>
                              <div className="h-80 w-full">
                                <ResponsiveContainer
                                  width="100%"
                                  height="100%"
                                  minWidth={0}
                                  minHeight={0}
                                >
                                  <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ left: 20, right: 40 }}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      horizontal={false}
                                      stroke="#f0f0f0"
                                    />
                                    <XAxis
                                      type="number"
                                      domain={[0, 100]}
                                      hide
                                    />
                                    <YAxis
                                      dataKey="name"
                                      type="category"
                                      width={150}
                                      tick={{ fontSize: 11, fontWeight: 500 }}
                                      axisLine={false}
                                      tickLine={false}
                                    />
                                    <Tooltip
                                      cursor={{ fill: "#f8fafc" }}
                                      contentStyle={{
                                        borderRadius: "12px",
                                        border: "none",
                                        boxShadow:
                                          "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                      }}
                                    />
                                    <Bar
                                      dataKey="acuracia"
                                      radius={[0, 4, 4, 0]}
                                      barSize={20}
                                    >
                                      {chartData.map((entry, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={
                                            entry.nivel === "Forte"
                                              ? "#10b981"
                                              : entry.nivel === "Atenção"
                                                ? "#f59e0b"
                                                : "#ef4444"
                                          }
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Ações Sugeridas para Instrutor (moved from below) */}
                            {isProfessor && (
                              <div className="mt-6 p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl">
                                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">
                                  Ações Sugeridas para Instrutor
                                </p>
                                <ul className="space-y-2">
                                  {result.acoes_para_o_instrutor
                                    .slice(0, 3)
                                    .map((acao, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-emerald-900 flex gap-2"
                                      >
                                        <span className="text-emerald-400">
                                          •
                                        </span>{" "}
                                        {acao}
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}

                            {/* Evolution Chart */}
                            {(evolutionData.length > 1 ||
                              evolutionFilter !== "all") && (
                              <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                      <History size={20} />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-bold">
                                        Evolução da Média Geral
                                      </h3>
                                      <p className="text-xs text-gray-500">
                                        Progresso ao longo dos diagnósticos
                                        realizados
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-center">
                                    <button
                                      onClick={() => setEvolutionFilter("7d")}
                                      className={cn(
                                        "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                        evolutionFilter === "7d"
                                          ? "bg-white text-blue-600 shadow-sm"
                                          : "text-gray-500 hover:text-gray-700",
                                      )}
                                    >
                                      7 Dias
                                    </button>
                                    <button
                                      onClick={() => setEvolutionFilter("30d")}
                                      className={cn(
                                        "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                        evolutionFilter === "30d"
                                          ? "bg-white text-blue-600 shadow-sm"
                                          : "text-gray-500 hover:text-gray-700",
                                      )}
                                    >
                                      30 Dias
                                    </button>
                                    <button
                                      onClick={() => setEvolutionFilter("all")}
                                      className={cn(
                                        "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                        evolutionFilter === "all"
                                          ? "bg-white text-blue-600 shadow-sm"
                                          : "text-gray-500 hover:text-gray-700",
                                      )}
                                    >
                                      Tudo
                                    </button>
                                  </div>
                                </div>

                                {evolutionData.length > 1 ? (
                                  <div className="h-64 w-full">
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                      minWidth={0}
                                      minHeight={0}
                                    >
                                      <LineChart
                                        data={evolutionData}
                                        margin={{
                                          top: 10,
                                          right: 30,
                                          left: 0,
                                          bottom: 0,
                                        }}
                                      >
                                        <CartesianGrid
                                          strokeDasharray="3 3"
                                          vertical={false}
                                          stroke="#f0f0f0"
                                        />
                                        <XAxis
                                          dataKey="date"
                                          axisLine={false}
                                          tickLine={false}
                                          tick={{
                                            fontSize: 11,
                                            fill: "#94a3b8",
                                          }}
                                          dy={10}
                                        />
                                        <YAxis
                                          domain={[0, 100]}
                                          axisLine={false}
                                          tickLine={false}
                                          tick={{
                                            fontSize: 11,
                                            fill: "#94a3b8",
                                          }}
                                        />
                                        <Tooltip
                                          contentStyle={{
                                            borderRadius: "12px",
                                            border: "none",
                                            boxShadow:
                                              "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                          }}
                                          labelStyle={{
                                            fontWeight: "bold",
                                            marginBottom: "4px",
                                          }}
                                          formatter={(value: any) => [
                                            `${value}%`,
                                            "Média",
                                          ]}
                                        />
                                        <Line
                                          type="monotone"
                                          dataKey="acuracia"
                                          stroke="#3b82f6"
                                          strokeWidth={3}
                                          dot={{
                                            r: 6,
                                            fill: "#3b82f6",
                                            strokeWidth: 2,
                                            stroke: "#fff",
                                          }}
                                          activeDot={{ r: 8, strokeWidth: 0 }}
                                          animationDuration={1500}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                ) : (
                                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <History
                                      className="text-gray-300"
                                      size={40}
                                    />
                                    <p className="text-gray-500 text-sm italic px-8">
                                      {evolutionFilter === "all"
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
                            {result.diagnostico_por_competencia.map(
                              (comp, i) => (
                                <div
                                  key={i}
                                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                                >
                                  <div
                                    className={cn(
                                      "px-6 py-4 border-b flex items-center justify-between",
                                      comp.nivel === "Forte"
                                        ? "bg-emerald-50 border-emerald-100"
                                        : comp.nivel === "Atenção"
                                          ? "bg-amber-50 border-amber-100"
                                          : "bg-red-50 border-red-100",
                                    )}
                                  >
                                    <h4 className="font-bold text-sm truncate pr-2">
                                      {comp.competencia}
                                    </h4>
                                    <span
                                      className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        comp.nivel === "Forte"
                                          ? "bg-emerald-200 text-emerald-800"
                                          : comp.nivel === "Atenção"
                                            ? "bg-amber-200 text-amber-800"
                                            : "bg-red-200 text-red-800",
                                      )}
                                    >
                                      {comp.nivel}
                                    </span>
                                  </div>
                                  <div className="p-6 space-y-4 flex-1">
                                    <div className="flex justify-between items-end">
                                      <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                          Média Ponderada
                                        </p>
                                        <p className="text-2xl font-light">
                                          {(
                                            comp.acuracia_ponderada * 100
                                          ).toFixed(0)}
                                          %
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                          Questões
                                        </p>
                                        <p className="text-sm font-medium">
                                          {comp.acertos}/{comp.total_questoes}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Conhecimentos Críticos
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {comp.conhecimentos_fracos.map(
                                          (c, j) => (
                                            <span
                                              key={j}
                                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-medium"
                                            >
                                              {c}
                                            </span>
                                          ),
                                        )}
                                        {comp.conhecimentos_fracos.length ===
                                          0 && (
                                          <span className="text-[10px] text-gray-400 italic">
                                            Nenhum identificado
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50">
                                      <p className="text-xs text-gray-600 leading-relaxed">
                                        <span className="font-bold text-gray-900">
                                          Recomendação:
                                        </span>{" "}
                                        {comp.recomendacoes}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <Navigate
                          to={
                            userProfile?.role === "STUDENT"
                              ? "/student-dashboard"
                              : "/input"
                          }
                        />
                      )}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/plan"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={[
                        "TEACHER",
                        "ADMIN",
                        "COORDINATOR",
                        "STUDENT",
                        "MONITOR",
                      ]}
                    >
                      {result ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="max-w-4xl mx-auto space-y-8"
                        >
                          <div
                            id="recovery-plan"
                            ref={planRef}
                            className="space-y-8 p-4 bg-gray-50 rounded-2xl"
                          >
                            <div className="text-center space-y-2">
                              <h2 className="text-3xl font-bold">
                                Plano de Estudos - 7 Dias
                              </h2>
                              <p className="text-gray-500">
                                Cronograma intensivo baseado nas competências em
                                nível crítico.
                              </p>
                              <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">
                                {result.aluno}
                              </p>
                            </div>

                            {/* Performance Comparison per Competency */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 px-2">
                                <BarChart3
                                  size={20}
                                  className="text-emerald-600"
                                />
                                <h3 className="text-lg font-bold text-gray-800">
                                  Seu Desempenho vs. Média da Turma
                                </h3>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {result.diagnostico_por_competencia.map(
                                  (comp, idx) => {
                                    const studentScore = Math.round(
                                      (comp.acuracia_ponderada ||
                                        comp.acuracia) * 100,
                                    );
                                    const classScore = Math.round(
                                      classAverages[comp.competencia] || 0,
                                    );
                                    const isAboveAverage =
                                      studentScore >= classScore;

                                    return (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 flex flex-col"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <h4
                                            className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight"
                                            title={comp.competencia}
                                          >
                                            {comp.competencia}
                                          </h4>
                                          <div
                                            className={cn(
                                              "flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                              isAboveAverage
                                                ? "bg-emerald-50 text-emerald-600"
                                                : "bg-red-50 text-red-600",
                                            )}
                                          >
                                            {isAboveAverage ? (
                                              <TrendingUp size={10} />
                                            ) : (
                                              <TrendingDown size={10} />
                                            )}
                                            {isAboveAverage
                                              ? "Acima"
                                              : "Abaixo"}
                                          </div>
                                        </div>

                                        <div className="h-[120px] w-full mt-auto">
                                          <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                            minWidth={0}
                                            minHeight={0}
                                          >
                                            <BarChart
                                              data={[
                                                {
                                                  name: "Você",
                                                  value: studentScore,
                                                  fill: "#10b981",
                                                },
                                                {
                                                  name: "Turma",
                                                  value: classScore,
                                                  fill: "#94a3b8",
                                                },
                                              ]}
                                              margin={{
                                                top: 20,
                                                right: 10,
                                                left: -20,
                                                bottom: 0,
                                              }}
                                            >
                                              <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="#f3f4f6"
                                              />
                                              <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{
                                                  fontSize: 10,
                                                  fill: "#6b7280",
                                                  fontWeight: 600,
                                                }}
                                              />
                                              <YAxis domain={[0, 100]} hide />
                                              <Tooltip
                                                cursor={{ fill: "#f9fafb" }}
                                                contentStyle={{
                                                  borderRadius: "12px",
                                                  border: "none",
                                                  boxShadow:
                                                    "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                                }}
                                              />
                                              <Bar
                                                dataKey="value"
                                                radius={[4, 4, 0, 0]}
                                                barSize={35}
                                              >
                                                <LabelList
                                                  dataKey="value"
                                                  position="top"
                                                  formatter={(val: any) =>
                                                    `${val}%`
                                                  }
                                                  style={{
                                                    fontSize: "11px",
                                                    fontWeight: "bold",
                                                    fill: "#374151",
                                                  }}
                                                />
                                                {/* Color individual bars */}
                                                {[
                                                  {
                                                    name: "Você",
                                                    value: studentScore,
                                                    fill: "#10b981",
                                                  },
                                                  {
                                                    name: "Turma",
                                                    value: classScore,
                                                    fill: "#94a3b8",
                                                  },
                                                ].map((entry, index) => (
                                                  <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.fill}
                                                  />
                                                ))}
                                              </Bar>
                                            </BarChart>
                                          </ResponsiveContainer>
                                        </div>
                                      </motion.div>
                                    );
                                  },
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              {result.plano_de_estudos_7_dias.map((dia) => (
                                <div
                                  key={dia.dia}
                                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex"
                                >
                                  <div className="w-24 bg-emerald-600 flex flex-col items-center justify-center text-white shrink-0">
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                                      Dia
                                    </span>
                                    <span className="text-4xl font-light">
                                      {dia.dia}
                                    </span>
                                  </div>
                                  <div className="p-8 flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-xl font-bold text-emerald-900">
                                        {dia.tema}
                                      </h3>
                                      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        <CheckCircle2 size={12} />
                                        Meta do Dia
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                          Atividades
                                        </p>
                                        <ul className="space-y-2">
                                          {dia.atividades.map((atv, idx) => (
                                            <li
                                              key={idx}
                                              className="text-sm text-gray-700 flex gap-2"
                                            >
                                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                              {atv}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                          Critério de Sucesso
                                        </p>
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
                              {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                <Download size={18} />
                              )}
                              Baixar PDF
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                              <Calendar size={18} /> Adicionar ao Google Agenda
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <Navigate to="/input" />
                      )}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/json"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      {result ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-2xl font-bold">
                                Saída JSON Estruturada
                              </h2>
                              <p className="text-gray-500">
                                Formato pronto para integração com sistemas
                                externos.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  JSON.stringify(result, null, 2),
                                );
                                toast.success(
                                  "JSON copiado para a área de transferência!",
                                );
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
                      ) : (
                        <Navigate to="/input" />
                      )}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edujarvis-ultra"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <EduJarvisUltraDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tutor-jarvis"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["STUDENT", "MONITOR"]}
                    >
                      <TutorJarvisView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mass-rescue"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <MassRescueDashboard userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activity-grading/:activityId"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <ActivityGradingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bi-inteligente"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR"]}
                    >
                      <BIInteligentePage user={user} userProfile={userProfile} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gamificacao"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["TEACHER", "ADMIN", "COORDINATOR", "STUDENT", "MONITOR"]}
                    >
                      <GamificacaoPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/supabase-status"
                  element={
                    <ProtectedRoute
                      userProfile={userProfile}
                      allowedRoles={["ADMIN"]}
                    >
                      <SupabaseAdminStatusPage />
                    </ProtectedRoute>
                  }
                />
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
                Transformando dados de avaliações em caminhos claros para o
                sucesso acadêmico através de inteligência artificial
                especializada.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Padrões Suportados
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>SAEP (Pernambuco)</li>
                <li>SAEB (Nacional)</li>
                <li>Matriz de Referência BNCC</li>
                <li>Taxonomia de Bloom</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Segurança
              </h4>
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <CheckCircle2 size={16} />
                Processamento Local & Seguro
              </div>
              <p className="text-xs text-gray-400">
                Seus dados são processados via API Gemini e não são armazenados
                permanentemente em nossos servidores.
              </p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              © 2024 JuniorsStudent - Versão 1.0.0
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Privacidade
              </a>
              <a
                href="#"
                className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Termos
              </a>
              <a
                href="#"
                className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Suporte
              </a>
            </div>
          </div>
        </footer>

        {user && userProfile && (
          <>
            <button
              onClick={() => setIsJarvisOpen(!isJarvisOpen)}
              className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all z-40 flex items-center justify-center animate-bounce-slow"
              title="EduJarvis"
            >
              <Bot size={28} />
            </button>
            <EduJarvisPanel
              isOpen={isJarvisOpen}
              onClose={() => setIsJarvisOpen(false)}
              userRole={userProfile.role}
              contextData={{ path: location.pathname }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
