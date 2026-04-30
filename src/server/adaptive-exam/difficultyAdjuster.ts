import { DifficultyLevel } from "./adaptiveExamTypes";

export function adjustDifficulty(params: {
  lastAnswerCorrect: boolean;
  currentDifficulty: DifficultyLevel;
  responseTime: number;
  averageResponseTime: number;
}): DifficultyLevel {
  const { lastAnswerCorrect, currentDifficulty, responseTime, averageResponseTime } = params;

  const fastAnswer = responseTime < averageResponseTime * 0.7;
  const slowAnswer = responseTime > averageResponseTime * 1.4;

  if (lastAnswerCorrect && fastAnswer) {
    if (currentDifficulty === "facil") return "medio";
    if (currentDifficulty === "medio") return "dificil";
    return "dificil";
  }

  if (!lastAnswerCorrect && slowAnswer) {
    if (currentDifficulty === "dificil") return "medio";
    if (currentDifficulty === "medio") return "facil";
    return "facil";
  }

  return currentDifficulty;
}
