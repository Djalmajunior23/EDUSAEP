export interface LearningSituation {
  id?: string;
  title: string;
  context: string;
  centralChallenge: string;
  objective: string;
  steps: Array<{ title: string; description: string; duration: string }>;
  resources: string[];
  deliverables: string[];
  evaluationCriteria: Array<{ criteria: string; points: number }>;
  marketRelation: string;
  course: string;
  competency: string;
  complexity: 'fácil' | 'médio' | 'difícil';
  duration: string;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'published';
  classId?: string; // ID da turma para qual foi publicada
}

export interface SASubmission {
  id?: string;
  saId: string;
  studentId: string;
  studentName: string;
  content: string; // Resposta do aluno (texto ou link)
  submittedAt: string;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

export interface AIProviderConfig {
  id?: string;
  name: string;
  provider: 'openai' | 'gemini' | 'deepseek' | 'groq';
  apiKey: string;
  isActive: boolean;
  priority: number;
  allowedRoles: Array<'ADMIN' | 'TEACHER' | 'STUDENT' | 'COORDINATOR' | 'MONITOR'>;
  createdAt: string;
  updatedAt: string;
}

export interface ImportBatch {
  id?: string;
  type: 'students' | 'exercises';
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  errors?: Array<{ row: number; message: string }>;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
}

export interface Rubric {
  id?: string;
  title: string;
  description: string;
  criteria: RubricCriterion[];
  totalPoints: number;
  createdBy: string;
  createdAt: any;
  isArchived?: boolean;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  type: 'activity' | 'exam' | 'holiday' | 'reminder';
  createdBy?: string;
  createdAt?: any;
}

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  type: 'announcement' | 'forum';
  classId?: string;
  createdBy: string;
  authorName: string;
  createdAt: any;
  commentCount?: number;
}

export interface ForumComment {
  id?: string;
  announcementId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
}

export type NotificationType = 
  | 'activity_published' 
  | 'activity_submitted' 
  | 'activity_graded' 
  | 'activity_returned' 
  | 'calendar_event' 
  | 'system_alert'
  | 'forum_reply';

export interface AppNotification {
  id?: string;
  userId: string; // Recipient
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  createdAt: any;
  metadata?: Record<string, any>;
}

export interface Activity {
  id?: string;
  title: string;
  description: string;
  classId?: string;
  dueDate: string;
  points: number;
  submissionType: 'text' | 'file' | 'mixed';
  allowResubmission: boolean;
  acceptLate: boolean;
  maxAttachments: number;
  rubricId?: string;
  createdBy: string;
  createdAt: any;
  status: 'draft' | 'active' | 'closed';
}

export interface ActivitySubmission {
  id?: string;
  activityId: string;
  studentId: string;
  studentName: string;
  content: string;
  attachments?: Array<{ name: string; url: string; size: number }>;
  status: 'draft' | 'submitted' | 'late' | 'grading' | 'graded' | 'returned';
  grade?: number;
  concept?: string;
  feedback?: string;
  privateNotes?: string;
  rubricScores?: Record<string, { score: number; feedback: string }>;
  submittedAt: any;
  gradedAt?: any;
  gradedBy?: string;
}

export interface Question {
  id?: string;
  text: string;
  options: string[];
  correctOption: number;
  bloomLevel: 'lembrar' | 'entender' | 'aplicar' | 'analisar' | 'avaliar' | 'criar';
  difficulty: 'fácil' | 'médio' | 'difícil';
  competency: string;
  theme: string;
  tags?: string[];
  explanation?: string;
  createdBy: string;
  createdAt: any;
  usoTotal?: number;
}

export interface Exam {
  id?: string;
  title: string;
  description: string;
  type: 'simulado' | 'avaliacao' | 'recuperacao' | 'exercicio';
  status: 'rascunho' | 'publicado' | 'encerrado';
  dueDate: string;
  duration: number; // minutes
  totalQuestions: number;
  totalPoints: number;
  questions: string[]; // IDs das questões
  isAdaptive?: boolean; // Se ativado, a ordem das questões muda baseada no desempenho
  adaptiveConfig?: {
    startDifficulty: 'fácil' | 'médio';
    minQuestions: number;
    maxQuestions: number;
    masteryThreshold: number; // Porcentagem para considerar domínio
  };
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  submissionsCount?: number;
  averageScore?: number;
}
