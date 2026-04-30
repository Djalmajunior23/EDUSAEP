export type UserRole = "ALUNO" | "PROFESSOR" | "ADMIN" | "TEACHER" | "STUDENT" | "COORDINATOR" | "MONITOR";

export interface EduJarvisMessageType {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  type?: 'text' | 'learning_path' | 'intervention' | 'report' | 'vision_analysis' | 'chart';
  payload?: any;
}

export type AgentType =
  | "professor"
  | "student"
  | "evaluator"
  | "question"
  | "bi"
  | "tutor"
  | "fallback"
  | "adaptiveTrail";

export type CostMode = "economico" | "normal" | "avancado";

export interface EduJarvisRequest {
  userId: string;
  userRole: UserRole;
  command?: string;
  context?: Record<string, any>;
  image?: string; // Base64 image
  action?: string;
  input?: Record<string, any>;
  agent?: AgentType | string;
  costMode?: CostMode;
}

export interface EduJarvisResponse {
  success: boolean;
  source?: "local_rule" | "database" | "cache" | "ai";
  agent?: AgentType | string;
  action?: string;
  response: string;
  data?: any;
  payload?: any;
  metadata: {
    createdAt: string;
    cached?: boolean;
    costMode?: CostMode;
    estimatedCost?: number;
  };
}

export type Intent =
  | "GERAR_SIMULADO"
  | "GERAR_ESTUDO_CASO"
  | "GERAR_AULA_INVERTIDA"
  | "ANALISAR_DESEMPENHO"
  | "GERAR_PLANO_AULA"
  | "EXPLICAR_CONTEUDO"
  | "GERAR_TRILHA_APRENDIZAGEM"
  | "SUGERIR_INTERVENCAO"
  | "ANALISAR_RISCO_ACADEMICO"
  | "GERAR_RELATORIO_SEMANAL"
  | "CONSULTAR_MEMORIA"
  | "COMANDO_VOZ"
  | "CORRECAO_VISAO"
  | "GERAR_BI_INSIGHTS"
  | "IMPORTAR_QUESTOES"
  | "OTIMIZAR_QUESTAO"
  | "COMANDO_GERAL";
