import { db } from "../firebaseAdmin";
import { adjustDifficulty } from "./difficultyAdjuster";
import { selectNextQuestion } from "./questionSelector";
import { StudentExamProfile, QuestionCandidate, DifficultyLevel } from "./adaptiveExamTypes";
import * as admin from 'firebase-admin';

export async function getStudentExamProfile(studentId: string, classId: string): Promise<StudentExamProfile> {
  const performanceSnap = await db
    .collection("studentPerformances")
    .where("studentId", "==", studentId)
    .where("classId", "==", classId)
    .get();

  const performances = performanceSnap.docs.map(doc => doc.data());

  const weakCompetencies = performances
    .filter(p => (p.mastery ?? 0) < 60)
    .map(p => p.competencyId);

  const strongCompetencies = performances
    .filter(p => (p.mastery ?? 0) >= 80)
    .map(p => p.competencyId);

  const averageScore =
    performances.length > 0
      ? performances.reduce((acc, p) => acc + (p.mastery ?? 0), 0) / performances.length
      : 0;

  return {
    studentId,
    classId,
    weakCompetencies,
    strongCompetencies,
    answeredQuestionIds: [],
    averageScore,
    averageResponseTime: 60
  };
}

export async function getQuestionCandidates(): Promise<QuestionCandidate[]> {
  const snap = await db.collection("questions").where("active", "==", true).get();

  return snap.docs.map(doc => ({
    id: doc.id,
    competencyId: doc.data().competencyId,
    difficulty: doc.data().difficulty ?? "medio",
    bloomLevel: doc.data().bloomLevel ?? "compreender",
    statement: doc.data().statement,
    alternatives: doc.data().alternatives,
    correctAnswer: doc.data().correctAnswer,
    qualityScore: doc.data().qualityScore ?? 70
  }));
}

export async function createAdaptiveExam(studentId: string, classId: string) {
  const examRef = db.collection("adaptiveExams").doc();

  await examRef.set({
    id: examRef.id,
    studentId,
    classId,
    status: "em_andamento",
    currentQuestionIndex: 0,
    totalQuestions: 40,
    difficultyLevel: "medio",
    answeredQuestions: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { examId: examRef.id };
}

export async function getNextAdaptiveQuestion(params: {
  examId: string;
  studentId: string;
  classId: string;
}) {
  const { examId, studentId, classId } = params;

  const examRef = db.collection("adaptiveExams").doc(examId);
  const examSnap = await examRef.get();

  if (!examSnap.exists) {
    throw new Error("Simulado adaptativo não encontrado.");
  }

  const exam = examSnap.data()!;
  const profile = await getStudentExamProfile(studentId, classId);
  const candidates = await getQuestionCandidates();

  profile.answeredQuestionIds = exam.answeredQuestions ?? [];

  const decision = selectNextQuestion({
    profile,
    candidates,
    targetDifficulty: exam.difficultyLevel as DifficultyLevel
  });

  const question = candidates.find(q => q.id === decision.questionId);

  return {
    decision,
    question
  };
}

export async function registerAdaptiveAnswer(params: {
  examId: string;
  studentId: string;
  classId: string;
  questionId: string;
  competencyId: string;
  selectedAnswer: string;
  correctAnswer: string;
  responseTime: number;
  currentDifficulty: DifficultyLevel;
}) {
  const isCorrect = params.selectedAnswer === params.correctAnswer;

  const nextDifficulty = adjustDifficulty({
    lastAnswerCorrect: isCorrect,
    currentDifficulty: params.currentDifficulty,
    responseTime: params.responseTime,
    averageResponseTime: 60
  });

  await db.collection("adaptiveExamAnswers").add({
    ...params,
    isCorrect,
    nextDifficulty,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const examRef = db.collection("adaptiveExams").doc(params.examId);
  const examSnap = await examRef.get();
  const exam = examSnap.data()!;

  const answeredQuestions = [...(exam.answeredQuestions ?? []), params.questionId];
  const currentQuestionIndex = (exam.currentQuestionIndex ?? 0) + 1;

  await examRef.update({
    answeredQuestions,
    currentQuestionIndex,
    difficultyLevel: nextDifficulty,
    status: currentQuestionIndex >= 40 ? "finalizado" : "em_andamento",
    finishedAt: currentQuestionIndex >= 40 ? admin.firestore.FieldValue.serverTimestamp() : null
  });

  return {
    isCorrect,
    nextDifficulty,
    finished: currentQuestionIndex >= 40
  };
}
