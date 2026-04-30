import { evaluateQuestionQuality } from "./questionQualityEvaluator";
import { QuestionToEvaluate } from "./questionQualityTypes";

export async function improveQuestionUntilApproved(question: QuestionToEvaluate) {
  let currentQuestion = question;
  let review = await evaluateQuestionQuality(currentQuestion);

  let attempts = 0;

  while (review.status !== "aprovada" && attempts < 2 && review.improvedQuestion) {
    currentQuestion = review.improvedQuestion;
    review = await evaluateQuestionQuality(currentQuestion);
    attempts++;
  }

  return {
    finalQuestion: currentQuestion,
    finalReview: review,
    attempts
  };
}
