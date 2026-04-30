export type DifficultyLevel = "facil" | "medio" | "dificil";

export interface StudentExamProfile {
  studentId: string;
  classId: string;
  weakCompetencies: string[];
  strongCompetencies: string[];
  answeredQuestionIds: string[];
  averageScore: number;
  averageResponseTime: number;
}

export interface QuestionCandidate {
  id: string;
  competencyId: string;
  difficulty: DifficultyLevel;
  bloomLevel: string;
  statement: string;
  alternatives: Record<string, string>;
  correctAnswer: string;
  qualityScore?: number;
}

export interface AdaptiveQuestionDecision {
  questionId: string;
  reason: string;
  expectedDifficulty: DifficultyLevel;
  targetCompetency: string;
}
