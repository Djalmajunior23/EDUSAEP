export type AIUserRole = 'TEACHER' | 'STUDENT' | 'ADMIN' | 'COORDINATOR';

export type AIIntent = 
  | 'gerar_simulado'
  | 'gerar_questoes'
  | 'gerar_gabarito'
  | 'criar_plano_estudo'
  | 'analisar_desempenho'
  | 'criar_aula_invertida'
  | 'criar_estudo_caso'
  | 'criar_atividade_gamificada'
  | 'recomendar_intervencao'
  | 'consultar_dados'
  | 'exportar_conteudo'
  | 'explicar_conteudo'
  | 'desconhecido';

export interface AIRequestContext {
  userId: string;
  userRole: AIUserRole;
  classId?: string;
  studentId?: string;
  subject?: string;
  competency?: string;
  difficulty?: 'Fácil' | 'Médio' | 'Difícil';
  additionalData?: any;
}

export interface AIResponse<T = any> {
  success: boolean;
  intent: AIIntent;
  data?: T;
  message?: string;
  error?: string;
}

export interface AILogEntry {
  timestamp: string;
  userId: string;
  userRole: AIUserRole;
  intent: AIIntent;
  prompt: string;
  responseParams: any;
  success: boolean;
}
