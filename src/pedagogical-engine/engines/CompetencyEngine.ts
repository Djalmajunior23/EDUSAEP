import { CompetencyAnalysis, CompetencyLevel } from '../types';

export class CompetencyEngine {
  public static evaluateCompetencies(competencyScores: Record<string, number>): Record<string, CompetencyAnalysis> {
    const analysis: Record<string, CompetencyAnalysis> = {};

    for (const [competency, score] of Object.entries(competencyScores)) {
      let level: CompetencyLevel = 'DEVELOPING';
      const suggestedActions: string[] = [];

      if (score >= 8) {
        level = 'MASTERED';
        suggestedActions.push(`Aplicar conhecimentos de ${competency} em projetos práticos mais complexos.`);
        suggestedActions.push(`Incentivar mentoria entre pares na competência de ${competency}.`);
      } else if (score >= 5) {
        level = 'DEVELOPING';
        suggestedActions.push(`Revisar conceitos fundamentais vinculados a ${competency}.`);
        suggestedActions.push(`Realizar exercícios adicionais com foco intermédio em ${competency}.`);
      } else {
        level = 'CRITICAL';
        suggestedActions.push(`Intervenção imediata: retomar a teoria básica de ${competency}.`);
        suggestedActions.push(`Alocar plantão de dúvidas específico para esta lacuna.`);
      }

      analysis[competency] = {
        level,
        score,
        suggestedActions
      };
    }

    return analysis;
  }
}
