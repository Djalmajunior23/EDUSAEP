import { QuestionContent } from './education.types';

export interface SaepSimulado {
  titulo: string;
  disciplina: string;
  turmaId: string;
  questoes: QuestionContent[];
  distribuicaoCompetencias: Record<string, number>;
  niveisDificuldade: {
    facil: number;
    medio: number;
    dificil: number;
  };
  gabaritoComentado: string;
}
