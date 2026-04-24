import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Telescope, 
  BookOpen, 
  CheckSquare, 
  Archive, 
  Map as MapIcon, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  History, 
  Target, 
  User as UserIcon, 
  Trophy, 
  BrainCircuit, 
  Activity, 
  Database, 
  Upload, 
  ExternalLink, 
  BarChart3, 
  BarChart2, 
  Users, 
  Layout, 
  Library, 
  Shield, 
  Settings, 
  Share2, 
  LogOut,
  ChevronDown,
  BarChart3 as LogoIcon,
  Bell,
  FileText,
  Brain,
  Bot,
  MonitorPlay,
  Beaker
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  description?: string;
  disabled?: boolean;
  type?: 'item' | 'header';
}

interface SidebarProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  aiProvider: string;
  onProviderChange: (p: any) => void;
  handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  darkMode, 
  setDarkMode, 
  aiProvider, 
  onProviderChange,
  handleLogout 
}) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = React.useMemo(() => {
    if (!userProfile) return [];

    const role = userProfile.role;

    if (role === 'STUDENT' || role === 'MONITOR') {
      return [
        { type: 'header', id: 'h-main', label: 'Principal' },
        { id: 'student-dashboard', label: 'Meu Painel', icon: LayoutDashboard, path: '/student-dashboard', description: 'Visão Geral' },
        { id: 'student-observatory', label: 'Observatório 360', icon: Telescope, path: '/student-observatory', description: 'Visão do Aluno' },
        
        { type: 'header', id: 'h-academic', label: 'Acadêmico' },
        { id: 'student-exams', label: 'Simulados', icon: BookOpen, path: '/student-exams', description: 'Avaliações' },
        { id: 'student-quizzes', label: 'Quizzes Rápidos', icon: Zap, path: '/quizzes', description: 'Gamificação' },
        { id: 'student-activities', label: 'Atividades', icon: CheckSquare, path: '/student-activities', description: 'Entregas' },
        { id: 'learning-path', label: 'Minha Trilha', icon: MapIcon, path: '/learning-path', description: 'Caminhos' },
        { id: 'student-sa', label: 'Situações Práticas', icon: Zap, path: '/student-sa', description: 'Desafios' },
        { id: 'student-simulators', label: 'Simuladores', icon: MonitorPlay, path: '/student-simulators', description: 'Cenários' },
        { id: 'labs', label: 'Laboratórios', icon: Beaker, path: '/labs', description: 'Mão na Massa' },
        
        { type: 'header', id: 'h-ia', label: 'Inteligência IA' },
        { id: 'student-chatbot', label: 'Tutor Socrático', icon: MessageSquare, path: '/student-chatbot', description: 'Apoio IA' },
        { id: 'recommendations', label: 'Recomendações', icon: Target, path: '/recommendations', description: 'Foco de Estudo' },
        { id: 'gamification', label: 'Conquistas & XP', icon: Trophy, path: '/gamification', description: 'Minha Evolução' },
        
        { type: 'header', id: 'h-tools', label: 'Ferramentas' },
        { id: 'calendar', label: 'Calendário', icon: Calendar, path: '/calendar' },
        { id: 'history', label: 'Meu Histórico', icon: History, path: '/history' },
        { id: 'profile', label: 'Meu Perfil', icon: UserIcon, path: '/profile' },
      ];
    }

    // Teacher / Coordinator / Admin
    return [
      { type: 'header', id: 'h-admin-dash', label: 'Monitoramento' },
      { id: 'command-center', label: 'Sala de Comando', icon: MonitorPlay, path: '/command-center', badge: 'ULTRA' },
      { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'copilot', label: 'Copiloto Pedagógico', icon: Bot, path: '/copilot', badge: 'BETA' },
      { id: 'class-health', label: 'Saúde da Turma', icon: Activity, path: '/class-health', description: 'Maturidade' },
      { id: 'intelligence', label: 'Inteligência Hub', icon: BrainCircuit, path: '/intelligence', description: 'Módulos IA' },
      { id: 'generate-questions', label: 'Gerar Questões IA', icon: Sparkles, path: '/generate-questions' },
      { id: 'advanced-ia', label: 'IA Avançada', icon: Zap, path: '/teacher-ai-assistant', description: 'Estudos de Caso' },
      { id: 'discursive-generator', label: 'Gerar Discursivas IA', icon: FileText, path: '/generate-discursive' },
      { id: 'sa-generator', label: 'Gerador de SA', icon: Brain, path: '/learning-situation' },
      { id: 'quizzes', label: 'Gestão de Quizzes', icon: Zap, path: '/quizzes', description: 'Jogos Rápidos' },
      { id: 'simulators-manager', label: 'Simuladores', icon: MonitorPlay, path: '/student-simulators', description: 'Cenários Práticos' },
      { id: 'labs-manager', label: 'Laboratórios Práticos', icon: Beaker, path: '/labs', description: 'Prática Guiada' },
      { id: 'class-observatory', label: 'Observatório', icon: Telescope, path: '/observatory', description: 'Visão Pedagógica' },
      
      { type: 'header', id: 'h-pedagogical', label: 'Questões e Avaliações' },
      { id: 'questions-bank', label: 'Banco de Itens', icon: Database, path: '/questions-bank', description: 'Acervo' },
      { id: 'generate-questions-quick', label: 'Gerador IA', icon: Sparkles, path: '/generate-questions', description: 'Criação Rápida' },
      { id: 'exams-management', label: 'Simulados', icon: BookOpen, path: '/exams', description: 'Gestão SAEP' },
      { id: 'activity-manager', label: 'Gestão de Atividades', icon: CheckSquare, path: '/activity-manager' },
      
      { type: 'header', id: 'h-mgmt', label: 'Gestão Acadêmica' },
      { id: 'classes', label: 'Turmas', icon: Users, path: '/classes' },
      { id: 'disciplines', label: 'Disciplinas', icon: Library, path: '/disciplines' },
      { id: 'lesson-management', label: 'Planos de Aula', icon: Layout, path: '/lesson-management' },
      
      { type: 'header', id: 'h-data', label: 'Dados e BI' },
      { id: 'reports', label: 'Relatórios', icon: BarChart3, path: '/reports' },
      { id: 'tri-analysis', label: 'Análise TRI', icon: Target, path: '/tri-analysis' },
      { id: 'data-import', label: 'Importação SIAC', icon: Database, path: '/data-import' },
      
      { type: 'header', id: 'h-sys', label: 'Sistema' },
      { id: 'system-governance', label: 'Governança IA', icon: Shield, path: '/system-governance' },
      { id: 'admin-users', label: 'Usuários', icon: Users, path: '/admin-users' },
      { id: 'profile', label: 'Perfil', icon: UserIcon, path: '/profile' },
    ];
  }, [userProfile]);

  const activeId = location.pathname.split('/')[1] || 'dashboard';

  if (!user || !userProfile) return null;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden lg:flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none shrink-0">
            <LogoIcon size={24} />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate">EDUSAEP</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider truncate">Plataforma Ultra</p>
          </div>
        </div>
        <NotificationBell userId={user.uid} />
      </div>
      
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        {navItems.map((item: any, idx) => (
          item.type === 'header' ? (
            <div key={`header-${item.id || idx}`} className="px-3 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-4 first:mt-0">
              {item.label}
            </div>
          ) : (
            <button
              key={item.id}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                activeId === item.id || location.pathname === item.path
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
                  : item.disabled ? "text-gray-400 dark:text-gray-600 cursor-not-allowed" : "text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              )}
            >
              <item.icon size={18} className={cn(
                "transition-colors",
                activeId === item.id || location.pathname === item.path ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500 group-hover:text-emerald-500"
              )} />
              <div className="text-left flex-1 overflow-hidden">
                <p className="truncate">{item.label}</p>
                {item.description && <p className="text-[10px] opacity-60 font-normal truncate">{item.description}</p>}
              </div>
            </button>
          )
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600" referrerPolicy="no-referrer" crossOrigin="anonymous" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shrink-0 uppercase">
              {user.displayName?.charAt(0) || user.email?.charAt(0)}
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName || user.email?.split('@')[0]}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider font-bold">{userProfile.role}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
               onClick={() => setDarkMode(!darkMode)}
               className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
               title={darkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {darkMode ? <Sparkles size={16} /> : <UserIcon size={16} />} 
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
          
          {(userProfile.role === 'ADMIN' || userProfile.role === 'TEACHER') && (
            <select 
              value={aiProvider} 
              onChange={(e) => onProviderChange(e.target.value)}
              className="text-[10px] font-bold bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg px-2 py-1 outline-none transition-all"
            >
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          )}
        </div>
      </div>
    </aside>
  );
};
