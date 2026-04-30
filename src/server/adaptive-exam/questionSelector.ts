import { QuestionCandidate, StudentExamProfile, AdaptiveQuestionDecision, DifficultyLevel } from "./adaptiveExamTypes";

export function selectNextQuestion(params: {
  profile: StudentExamProfile;
  candidates: QuestionCandidate[];
  targetDifficulty: DifficultyLevel;
}): AdaptiveQuestionDecision {
  const { profile, candidates, targetDifficulty } = params;

  const filtered = candidates
    .filter(q => !profile.answeredQuestionIds.includes(q.id))
    .filter(q => q.difficulty === targetDifficulty)
    .sort((a, b) => {
      const aWeak = profile.weakCompetencies.includes(a.competencyId) ? 1 : 0;
      const bWeak = profile.weakCompetencies.includes(b.competencyId) ? 1 : 0;
      const aQuality = a.qualityScore ?? 70;
      const bQuality = b.qualityScore ?? 70;

      return (bWeak * 30 + bQuality) - (aWeak * 30 + aQuality);
    });

  const selected = filtered[0] ?? candidates.find(q => !profile.answeredQuestionIds.includes(q.id));

  if (!selected) {
    throw new Error("Nenhuma questão disponível para o simulado adaptativo.");
  }

  return {
    questionId: selected.id,
    reason: profile.weakCompetencies.includes(selected.competencyId)
      ? "Questão selecionada para reforçar competência com baixo desempenho."
      : "Questão selecionada para manter equilíbrio do simulado.",
    expectedDifficulty: selected.difficulty,
    targetCompetency: selected.competencyId
  };
}
