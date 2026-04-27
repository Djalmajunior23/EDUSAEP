export interface QuestionContent {
  enunciado: string;
  alternativas: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correta: 'A' | 'B' | 'C' | 'D' | 'E';
  competencia: string;
  conhecimento: string;
  dificuldade: 'Fácil' | 'Médio' | 'Difícil';
  bloom: string;
  justificativa: string;
  comentarios_distratores: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string;
  };
}

export interface StudyPlan {
  conteudoRevisar: string;
  competenciaRelacionada: string;
  explicacaoResumida: string;
  exerciciosRecomendados: string[];
  materiaisSugeridos: string[];
  prazoSugerido: string;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  justificativaPedagogica: string;
}

export interface PerformanceAnalysis {
  taxaAcerto: number;
  pontosCriticos: string[];
  competenciasFrageis: string[];
  relatorioTurma?: string;
  planoIntervencao?: string;
}

export interface FlippedClassroomPlan {
  tema: string;
  objetivos: string[];
  materialPreAula: { tipo: string; descricao: string; link?: string }[];
  atividadesSala: { duracao: string; atividade: string; descricao: string }[];
  avaliacaoFomatica: string;
}

export interface CaseStudy {
  titulo: string;
  contextoPratico: string;
  problemaCentral: string;
  questoesGuia: string[];
  competenciasDesenvolvidas: string[];
}
