import { Simulado } from "../../types";

export interface FormCreationResult {
  externalFormId: string;
  publicUrl: string;
  adminUrl?: string;
  integrationToken: string;
}

export interface FormResponse {
  externalResponseId: string;
  alunoNome: string;
  alunoEmail: string;
  alunoMatricula: string;
  turma: string;
  submittedAt: Date;
  answers: Record<string, string>; // questionId -> selectedAlternative
}

export interface FormProvider {
  createForm(simulado: Simulado, questions: any[]): Promise<FormCreationResult>;
  getResponses(formId: string, integrationToken: string): Promise<FormResponse[]>;
  closeForm(formId: string): Promise<void>;
}
