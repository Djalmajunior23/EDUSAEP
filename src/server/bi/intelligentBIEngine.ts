import { db } from "../firebaseAdmin";
import { callAI } from "../eduJarvis/aiProvider";
import { ClassPerformanceRecord } from "./biTypes";
import * as admin from 'firebase-admin';

export async function getClassPerformanceData(classId: string): Promise<ClassPerformanceRecord[]> {
  const snap = await db
    .collection("studentPerformances")
    .where("classId", "==", classId)
    .get();

  return snap.docs.map(doc => ({
    studentId: doc.data().studentId,
    studentName: doc.data().studentName,
    competencyId: doc.data().competencyId,
    competencyName: doc.data().competencyName,
    mastery: doc.data().mastery ?? 0,
    score: doc.data().score ?? 0,
    attempts: doc.data().attempts ?? 0,
    averageTime: doc.data().averageTime ?? 0
  }));
}

export function calculateClassIndicators(records: ClassPerformanceRecord[]) {
  const generalAverage =
    records.length > 0
      ? records.reduce((acc, r) => acc + r.mastery, 0) / records.length
      : 0;

  const criticalCompetencies = records
    .filter(r => r.mastery < 60)
    .map(r => r.competencyName ?? r.competencyId);

  const studentsAtRisk = records
    .filter(r => r.mastery < 50)
    .map(r => r.studentName ?? r.studentId);

  const strengths = records
    .filter(r => r.mastery >= 80)
    .map(r => r.competencyName ?? r.competencyId);

  return {
    generalAverage: Number(generalAverage.toFixed(2)),
    criticalCompetencies: [...new Set(criticalCompetencies)],
    studentsAtRisk: [...new Set(studentsAtRisk)],
    strengths: [...new Set(strengths)]
  };
}

export async function generateIntelligentClassSummary(classId: string) {
  const records = await getClassPerformanceData(classId);
  const indicators = calculateClassIndicators(records);

  const systemInstruction = `
Você é um analista pedagógico especialista em educação profissional, SAEP, SENAI e análise de desempenho por competências.
Gere um relatório claro, objetivo e útil para o professor.
Não invente dados. Use apenas os dados fornecidos.
`;

  const prompt = `
Analise os dados da turma e gere um relatório pedagógico inteligente.

Indicadores calculados:
${JSON.stringify(indicators, null, 2)}

Dados detalhados:
${JSON.stringify(records, null, 2)}

Responda em JSON válido no formato:
{
  "executiveSummary": "",
  "diagnosis": "",
  "criticalCompetenciesAnalysis": [],
  "studentsAtRiskAnalysis": [],
  "recommendedInterventions": [],
  "nextClassSuggestion": "",
  "teacherActionPlan": []
}
`;

  const aiResult = await callAI({systemPrompt: systemInstruction, userPrompt: prompt});
  const parsed = JSON.parse(aiResult.text);

  await db.collection("biReports").add({
    classId,
    indicators,
    report: parsed,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    classId,
    indicators,
    report: parsed
  };
}
