export class LearningEngine {
  detectDifficulties(history: any[]) {
    // Analisa progresso e sugere trilhas
    return ["Revisão de algorítimos", "Prática em React"];
  }
}
export const learningEngine = new LearningEngine();
