export type Difficulty = "facil" | "media" | "dificil" | "Não informado" | string;

export type QuestionStatusIA =
  | "processado"
  | "pendente_revisao_ia"
  | "erro_ia"
  | string;

export interface QuestionAlternative {
  id?: string;
  letra?: string;
  texto?: string;
  label?: string;
  descricao?: string;
}

export interface Question {
  id: string;
  tenantId?: string;
  escolaId?: string;

  enunciado: string;
  disciplina?: string;
  competenciaNome?: string;
  competencia?: string;
  competenciaId?: string;

  competencias?: string[];
  conhecimentos?: string[];
  habilidades?: string[];
  tags?: string[];

  alternativas?: Array<string | QuestionAlternative>;

  respostaCorreta?: string;
  gabaritoComentado?: string;

  nivelBloom?: string;
  bloom?: string;
  dificuldade?: Difficulty;

  statusIA?: QuestionStatusIA;
  erroIA?: string | null;

  usoTotal?: number;
  taxaAcerto?: number;
  isAiGenerated?: boolean;
  
  tipoQuestao?: string;
  temaNome?: string;
  assets?: any[];
  
  createdAt?: any;
  updatedAt?: any;
}
