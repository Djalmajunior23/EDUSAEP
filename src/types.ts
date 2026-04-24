// src/types.ts

export type UserRole = 'ADMIN' | 'COORDINATOR' | 'TEACHER' | 'MONITOR' | 'STUDENT';

export interface UserProfile {
  uid: string;
  email: string;
  matricula?: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role: UserRole;
  institutionId?: string;
  xp?: number;
  level?: number;
  badges?: string[];
  gamificationEnabled?: boolean;
  preferences?: any;
  createdAt: string;
  updatedAt?: string;
  settings?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
    webhookUrl?: string;
  };
}

export interface Institution {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  address?: string;
  contactEmail?: string;
  settings?: any;
  createdAt: string;
}

export interface Course {
  id: string;
  institutionId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Subject {
  id: string;
  institutionId: string;
  courseId: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface Discipline {
  id: string;
  code: string; // Ex: UC-001
  name: string; // The name of the discipline/main competency
  description?: string;
  area: string;
  status: 'active' | 'inactive';
  teacherId?: string;
  createdAt?: any;
}

export interface QuestionAsset {
  id: string;
  type: 'image' | 'code' | 'table' | 'diagram' | 'case_study';
  content: string; // URL for images, raw text for code/case study, JSON string for tables/diagrams
  title?: string;
  caption?: string;
  language?: string; // For code blocks (e.g., 'javascript', 'sql')
  metadata?: any;
}

export interface Question {
  id?: string;
  questionUid: string;
  competenciaId: string;
  competenciaNome: string;
  temaId: string;
  temaNome: string;
  habilidade?: string;
  dificuldade: 'fácil' | 'médio' | 'difícil';
  bloom: 'lembrar' | 'compreender' | 'aplicar' | 'analisar' | 'avaliar' | 'criar';
  perfilGeracao: string;
  tipoQuestao: 'multipla_escolha' | 'discursiva' | 'verdadeiro_falso' | 'lacuna' | 'ordenacao' | 'associacao';
  enunciado: string;
  assets?: QuestionAsset[]; // Integrated assets (code, images, etc.)
  alternativas?: Array<{ id: string; texto: string; feedback?: string }>;
  respostaCorreta?: string; // ID for multiple choice
  respostaEsperada?: string; // Sample answer for discursive
  rubricaAvaliacao?: string; // Guidelines for manual scoring
  criteriosAvaliacao?: Array<{ criterio: string; pontuacao: number; descricao: string }> | string[]; // Detailed criteria for evaluators
  comentarioGabarito?: string;
  feedbackProfessorSugerido?: string;
  comentarioPedagogico?: string;
  justificativasAlternativas?: Record<string, string>;
  contextoHash: string;
  tags: string[];
  status: 'rascunho' | 'publicado';
  revisadaPorProfessor: boolean;
  usoTotal: number;
  taxaAcerto?: number;
  ultimaUtilizacao?: any;
  tempoEstimado?: number; // In seconds
  isAiGenerated?: boolean; // New marker for AI-generated questions
  origem: string;
  createdBy?: string;
  createdAt?: any;
  atualizadoEm?: any;
  note?: string;
  feedback?: string;
  aiExplicabilidade?: {
    justificativaDificuldade: string;
    justificativaBloom: string;
    analiseDistratores: string;
    intencaoPedagogica: string;
  };
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
  recommendedExercises?: Array<{
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
  recommendations?: string[];
  phases?: Array<{
    nome: string;
    objetivos: string[];
    topicos: string[];
    atividades: string[];
    recursos: string[];
  }>;
  mensagem_motivacional?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface Class {
  id: string;
  institutionId: string;
  courseId: string;
  subjectId: string;
  name: string;
  period: string;
  teacherId?: string;
  status: 'active' | 'inactive';
  createdAt?: any;
}

export interface ClassMembership {
  id: string;
  classId: string;
  studentId: string;
  role: 'STUDENT' | 'MONITOR';
  joinedAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
}

// Habilidade / Sub-competência
export interface Skill {
  // Habilidade / Sub-competência
  id: string;
  disciplineId: string; // Linked to Discipline/Main Competency
  name: string;
  description?: string;
}

export interface AssessmentItem {
  id: string;
  skillId: string; // Linked to Skill
  type: 'simulado' | 'exercicio' | 'diagnostico';
  source: 'platform' | 'siac' | 'external';
  content: string;
}

// ============================================================================
// CORE EDUCATIONAL INTELLIGENCE TYPES (20 ADVANCED MODULES)
// ============================================================================

export interface CognitiveLoadMetric {
  studentId: string;
  timestamp: string;
  activeActivities: number;
  averageDifficulty: number;
  timeSpentRecentMs: number;
  fatigueIndex: number; // 0 to 1
  status: 'optimal' | 'moderate' | 'overloaded';
  suggestedAction?: string;
}

export interface FalseLearningDetection {
  studentId: string;
  competencyId: string;
  suspicionScore: number; // 0 to 100
  inconsistencyPattern: string; // e.g., "High score on Hard, failed Easy"
  guessingProbability: number;
  detectedAt: string;
}

export interface LearningRhythm {
  studentId: string;
  classification: 'lento' | 'medio' | 'rapido';
  velocityCalculatedAt: string;
  recommendedActivityVolume: number;
  historicalVelocity: { date: string; v: number }[];
}

export interface ErrorMapEntry {
  competencyId: string;
  skillId: string;
  errorFrequency: number;
  affectedStudentsIds: string[];
  cognitiveRootCause: 'conceptual' | 'attention' | 'interpretation' | 'execution';
  suggestedInterventions: string[];
}

// ============================================================================
// INNOVATION AI MODULES (20 NEW FEATURES)
// ============================================================================

export interface InvisibleGapDetection {
  studentId: string;
  targetCompetencyId: string;
  missingPrerequisiteId: string;
  confidenceScore: number;
  evidence: string[]; // e.g. ["Failed 3 consecutive items depending on X"]
}

export interface StudentConsistencyMetric {
  studentId: string;
  consistencyScore: number; // 0 to 100
  trend: 'stable' | 'oscillating' | 'declining' | 'improving';
  volatilityIndex: number; 
  lastCalculatedAt: string;
}

export interface ResponseTimeAnalysis {
  studentId: string;
  questionId: string;
  timeSpentSeconds: number;
  expectedTimeSeconds: number;
  classification: 'fast_guess' | 'normal' | 'struggling' | 'mastery';
}

export interface KnowledgeRetentionMetric {
  studentId: string;
  competencyId: string;
  retentionRate: number; // %
  decayCurvePredicted: number[]; // projected retention over next 7 days
  needsImmediateSpacedRepetition: boolean;
}

export interface AutomatedPBLDefinition {
  title: string;
  scenario: string;
  problemStatement: string;
  competenciesCovered: string[];
  evaluationRubric: { criteria: string, weight: number }[];
  complexityLevel: 'iniciante' | 'intermediario' | 'avancado';
}

export interface SimuladoForm {
  id?: string;
  simuladoId: string;
  provider: 'google' | 'microsoft' | 'typeform';
  externalFormId: string;
  publicUrl: string;
  adminUrl?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: any;
  lastSyncAt?: any;
  responseCount?: number;
}

export interface DidacticResource {
  id?: string;
  title: string;
  description?: string;
  type: 'PDF' | 'Slides' | 'DOC' | 'XLS' | 'Image' | 'Video' | 'Link' | 'Other';
  origin: 'UPLOAD_INTERNO' | 'GOOGLE_DRIVE' | 'ONEDRIVE' | 'EXTERNAL_LINK';
  storagePath?: string;
  externalUrl?: string;
  ownerId: string;
  sharedWithClasses: string[]; // IDs of classes
  tags: string[];
  stats: {
    views: number;
    downloads: number;
  };
  createdAt: any;
  updatedAt?: any;
}

// ============================================================================
// ULTRA EXPANSION TYPES
// ============================================================================

export interface GamificationProfile {
  studentId: string;
  points: number;
  level: number;
  experience: number;
  achievements: string[];
  streak: number;
  lastActivityAt: any;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  type: 'academic' | 'engagement' | 'social';
}

export interface InteractiveQuiz {
  id?: string;
  title: string;
  description: string;
  teacherId: string;
  classId?: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    type: 'multiple' | 'boolean' | 'interpretative';
    feedback?: string;
  }>;
  isActive: boolean;
  createdAt: any;
}

export interface QuizAttempt {
  id?: string;
  quizId: string;
  studentId: string;
  answers: number[];
  score: number;
  completedAt: any;
  feedback?: string;
}

export interface Simulator {
  id?: string;
  title: string;
  description: string;
  type: 'tech' | 'professional' | 'logic' | 'soft_skill';
  scenario: string;
  stages: Array<{
    title: string;
    description: string;
    challenge: string;
    options?: string[];
    correctAction?: string;
    feedback: string;
  }>;
  difficulty: 1 | 2 | 3 | 4 | 5;
  xpReward: number;
  createdAt: any;
}

export interface PracticalLab {
  id?: string;
  title: string;
  objective: string;
  description: string;
  steps: Array<{
    title: string;
    instruction: string;
    expectedOutcome: string;
  }>;
  resources: string[];
  rubricId?: string;
  teacherId: string;
  createdAt: any;
}

export interface LabSubmission {
  id?: string;
  labId: string;
  studentId: string;
  studentName: string;
  content: string;
  attachments?: string[];
  status: 'pending' | 'reviewed';
  feedback?: string;
  grade?: number;
  submittedAt: any;
}

export enum OperationType {
  CREATE = 'create',
  READ = 'get',
  UPDATE = 'update',
  DELETE = 'delete',
  WRITE = 'write',
  LIST = 'list'
}
