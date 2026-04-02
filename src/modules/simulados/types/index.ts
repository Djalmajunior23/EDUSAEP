export type ApplicationMode = 'internal' | 'external' | 'hybrid';
export type CorrectionPolicy = 'highest_score' | 'last_attempt' | 'first_attempt';
export type FormProviderType = 'n8n' | 'google_forms' | 'microsoft_forms' | 'custom';
export type ProcessingStatus = 'pending' | 'processed' | 'error' | 'inconsistent';

export interface Simulado {
  id: string;
  title: string;
  description: string;
  disciplineId: string;
  competenceIds: string[];
  questionIds: string[];
  applicationMode: ApplicationMode;
  status: 'draft' | 'active' | 'closed';
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
  createdBy: string;
  startDate: any; // Timestamp
  endDate: any; // Timestamp
  maxAttempts: number;
  correctionPolicy: CorrectionPolicy;
}

export interface SimuladoForm {
  id: string;
  simuladoId: string;
  provider: FormProviderType;
  externalFormId: string;
  publicUrl: string;
  adminUrl?: string;
  status: 'active' | 'closed';
  createdAt: any; // Timestamp
  lastSyncAt?: any; // Timestamp
  responseCount: number;
  integrationToken: string;
}

export interface ImportedResponse {
  id: string;
  simuladoId: string;
  formId: string;
  alunoId?: string; // Optional if inconsistent
  alunoNome: string;
  alunoEmail: string;
  alunoMatricula: string;
  turma: string;
  submittedAt: any; // Timestamp
  source: 'external_form';
  attemptNumber: number;
  answers: Record<string, string>; // questionId -> selectedAlternative
  totalCorrect: number;
  totalWrong: number;
  score: number;
  percentage: number;
  processingStatus: ProcessingStatus;
  externalResponseId: string;
  hash: string;
}

export interface ResponseItem {
  id: string;
  importedResponseId: string;
  questionId: string;
  selectedAlternative: string;
  correctAlternative: string;
  isCorrect: boolean;
  competenceId: string;
  disciplineId: string;
  descriptorId?: string;
  difficultyLevel?: string;
}

export interface ImportLog {
  id: string;
  simuladoId: string;
  formId: string;
  executedBy: string;
  executedAt: any; // Timestamp
  totalRead: number;
  totalImported: number;
  totalRejected: number;
  totalDuplicated: number;
  status: 'success' | 'partial' | 'error';
  details?: string;
}

export interface ImportInconsistency {
  id: string;
  importLogId: string;
  importedResponseId: string;
  type: 'student_not_found' | 'ambiguous_student' | 'invalid_data';
  description: string;
  originalData: any;
  resolutionStatus: 'pending' | 'resolved' | 'ignored';
  resolvedBy?: string;
  resolvedAt?: any; // Timestamp
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number; // Index 0-3
  competency: string;
  disciplineId: string;
  descriptorId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}
