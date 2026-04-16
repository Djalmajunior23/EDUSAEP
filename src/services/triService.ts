/**
 * Item Response Theory (TRI) Utility Service
 * Provides basic simulations of TRI parameters for pedagogical analysis.
 */

export interface TRIParameters {
  a: number; // Discrimination (0.5 - 2.5)
  b: number; // Difficulty (-3.0 to 3.0)
  c: number; // Guessing (0.0 to 0.5)
}

export interface StudentProficiency {
  theta: number; // Proficiency (-3.0 to 3.0)
  stdError: number;
}

/**
 * Probability of a student with proficiency theta answering a question correctly 
 * using the 3-parameter Logistic Model (3PL).
 */
export function calculateProbability(theta: number, params: TRIParameters): number {
  const { a, b, c } = params;
  const exponent = -a * (theta - b);
  const logistic = 1 / (1 + Math.exp(exponent));
  return c + (1 - c) * logistic;
}

/**
 * Estimates student proficiency (theta) using Maximum Likelihood Estimation (MLE)
 * simplified for demonstration. In a production environment, this would involve 
 * iterative optimization (e.g., Newton-Raphson).
 */
export function estimateProficiency(
  answers: { questionId: string; correct: boolean; params: TRIParameters }[]
): StudentProficiency {
  // Simple approximation for theta
  // High accuracy = high theta
  const correctCount = answers.filter(a => a.correct).length;
  const totalCount = answers.length;
  const rawRatio = totalCount > 0 ? correctCount / totalCount : 0.5;
  
  // Map 0-1 to -3 to 3
  let theta = (rawRatio - 0.5) * 6;
  
  // Weight by average difficulty (b)
  const avgDifficulty = answers.reduce((acc, a) => acc + a.params.b, 0) / (totalCount || 1);
  theta = (theta + avgDifficulty) / 2;

  return {
    theta: Math.min(3, Math.max(-3, theta)),
    stdError: 1 / Math.sqrt(totalCount || 1)
  };
}

/**
 * Suggests improvements for items based on their TRI performance.
 */
export function suggestItemCalibration(params: TRIParameters, performance: { correct: number, total: number }): string[] {
  const suggestions: string[] = [];
  const successRate = performance.total > 0 ? performance.correct / performance.total : 0.5;

  if (params.a < 0.7) {
    suggestions.push("Baixa discriminação: A questão não diferencia bem alunos de diferentes níveis. Revise se há ambiguidades.");
  }
  
  if (successRate > 0.9 && params.b > 0) {
    suggestions.push("Muito fácil: A dificuldade estimada (b) está alta, mas a taxa de acerto é muito elevada. Verifique se há 'pegadinhas' óbvias ou resposta evidente.");
  }

  if (successRate < 0.1 && params.b < 1) {
    suggestions.push("Muito difícil: Taxa de acerto baixíssima. Considere simplificar o enunciado ou revisar a complexidade dos distratores.");
  }

  return suggestions;
}
