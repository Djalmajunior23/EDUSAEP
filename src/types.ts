// src/types.ts

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
  }>;
  createdAt: any;
  updatedAt: any;
}

export interface Class {
  id: string;
  name: string;
  period: string;
  status: 'active' | 'inactive';
}

export interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
}

export interface Discipline {
  // Main Competency
  id: string;
  code: string; // Ex: UC-001
  name: string; // The name of the discipline/main competency
  description?: string;
  area: string;
  status: 'active' | 'inactive';
  teacherId?: string;
}

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
