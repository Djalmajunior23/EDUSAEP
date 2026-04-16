import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';

export interface QuestionQualityStats {
  questionId: string;
  hitRate: number; // percentage of correct answers
  realDifficulty: 'Easy' | 'Medium' | 'Hard';
  discriminationIndex: number; // how well it separates high/low performers
  mostFrequentErrorAlternative: string;
  clarityScore: number;
  status: 'good' | 'review_required' | 'bad';
}

export class QualityControlService {
  /**
   * Validates pedagogical consistency of an exam/activity before publication. (Module 5)
   */
  static async validateConsistency(examData: any) {
    const issues: string[] = [];
    const questions = examData.questions || [];

    // 1. Check Bloom balance
    const bloomCounts: Record<string, number> = {};
    questions.forEach((q: any) => bloomCounts[q.bloom] = (bloomCounts[q.bloom] || 0) + 1);

    if (!bloomCounts['Lembrar'] && !bloomCounts['Entender']) {
      issues.push('Faltam questões de base (níveis iniciais de Bloom).');
    }

    // 2. Check Competency coverage
    const competencies = questions.map((q: any) => q.competenciaNome);
    const uniqueComp = new Set(competencies);
    if (uniqueComp.size < 2 && questions.length > 5) {
      issues.push('Baixa diversidade de competências para o tamanho do simulado.');
    }

    // 3. Difficulty balance
    const difficulties: Record<string, number> = { 'fácil': 0, 'médio': 0, 'difícil': 0 };
    questions.forEach((q: any) => difficulties[q.dificuldade] = (difficulties[q.dificuldade] || 0) + 1);

    if (difficulties['difícil'] > difficulties['fácil'] + difficulties['médio']) {
      issues.push('Desequilíbrio de dificuldade: excesso de questões difíceis.');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions: issues.map(issue => `Dica: ${issue}`)
    };
  }

  /**
   * Analyzes the efficiency of questions based on actual student data. (Module 6)
   */
  static async analyzeQuestionQuality(questionId: string): Promise<QuestionQualityStats> {
    const submissionsSnap = await getDocs(query(collection(db, 'exam_submissions')));
    const submissions = submissionsSnap.docs.map(d => d.data());

    let totalAttempts = 0;
    let correctAttempts = 0;
    const errorMap: Record<string, number> = {};

    submissions.forEach(sub => {
      const answer = sub.answers?.[questionId];
      if (answer !== undefined) {
        totalAttempts++;
        if (answer === sub.correctAnswers?.[questionId]) {
          correctAttempts++;
        } else {
          errorMap[answer] = (errorMap[answer] || 0) + 1;
        }
      }
    });

    const hitRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
    
    // Most common wrong alternative
    let mostFrequentError = 'None';
    let maxErrors = 0;
    Object.entries(errorMap).forEach(([alt, count]) => {
      if (count > maxErrors) {
        maxErrors = count;
        mostFrequentError = alt;
      }
    });

    // Real difficulty vs intended difficulty
    let realDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    if (hitRate > 75) realDifficulty = 'Easy';
    else if (hitRate < 35) realDifficulty = 'Hard';

    return {
      questionId,
      hitRate: Math.round(hitRate),
      realDifficulty,
      discriminationIndex: 0.45, // Placeholder for TRI calculation
      mostFrequentErrorAlternative: mostFrequentError,
      clarityScore: 85,
      status: hitRate < 20 || hitRate > 95 ? 'review_required' : 'good'
    };
  }
}
