export interface QuestionToEvaluate {
  id?: string;
  statement: string;
  competency: string;
  capacity?: string;
  knowledge?: string;
  bloomLevel: string;
  difficulty: string;
  alternatives: Record<string, string>;
  correctAnswer: string;
  explanation?: string;
}

export interface QuestionQualityReview {
  qualityScore: number;
  status: "aprovada" | "revisar" | "rejeitada";
  clarityScore: number;
  competencyAlignmentScore: number;
  distractorQualityScore: number;
  bloomAlignmentScore: number;
  problems: string[];
  suggestions: string[];
  improvedQuestion?: QuestionToEvaluate;
}
