import { CompetencyEvaluation, CompetencyLevel } from '../types';

export class CompetencyEngine {
  evaluateCompetencies(studentScoresByCompetency: Record<string, number>): CompetencyEvaluation[] {
    return Object.entries(studentScoresByCompetency).map(([name, score]) => {
      let level: CompetencyLevel = 'MASTERED';
      if (score < 40) level = 'CRITICAL';
      else if (score < 70) level = 'DEVELOPING';

      return {
        id: name.toLowerCase().replace(/\s/g, '_'),
        name,
        score,
        level
      };
    });
  }
}
