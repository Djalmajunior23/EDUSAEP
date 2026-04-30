export type ErrorType = 'conceitual' | 'interpretacao' | 'distracao' | 'desconhecido';

export interface ErrorAnalysis {
  tipoErro: ErrorType;
  descricao: string;
  causaProvavel: string;
  recomendacao: string;
  nivelGravidade: 'leve' | 'medio' | 'alto';
}
