
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { generateSmartContent } from "./geminiService";

export interface ExamCriteria {
  theme: string;
  competency: string;
  questionCount: number;
  difficulty: 'fácil' | 'médio' | 'difícil';
  type: 'objetiva' | 'discursiva' | 'mista' | 'simulado';
  bloomTaxonomy: string;
  idealResponseExample?: string;
}

export async function generateExam(criteria: ExamCriteria, modelName: string = "gemini-1.5-flash") {
  const isSimulado = criteria.type === "simulado";
  // Simulado SAEP usually requires 40 questions
  const finalQuestionCount = isSimulado ? 40 : (criteria.questionCount || 10);

  const prompt = `Você é um especialista em avaliação educacional e design instrucional, focado no padrão SAEP/SENAI. 
  Gere um ${isSimulado ? 'Simulado Estruturado' : 'Exame'} baseado nos critérios abaixo, seguindo rigorosamente a Taxonomia de Bloom:

  Critérios:
  - Tema: ${criteria.theme}
  - Competência: ${criteria.competency}
  - Quantidade: ${finalQuestionCount} questões.
  - Dificuldade: ${criteria.difficulty}
  - Tipo: ${criteria.type}
  - Nível Bloom Aplicado: ${criteria.bloomTaxonomy}
  ${criteria.idealResponseExample ? `- Exemplo de contexto: ${criteria.idealResponseExample}` : ''}

  REGRAS RÍGIDAS:
  1. Retorne EXATAMENTE ${finalQuestionCount} questões. Se for simulado, garanta equilíbrio entre as competências.
  2. Para questões objetivas, forneça 5 alternativas (A-E).
  3. Para cada questão, inclua feedback/justificativa para a resposta correta.
  4. O gabarito deve ser comentado detalhadamente.
  5. Você DEVE retornar um JSON válido.

  ESTRUTURA DO JSON:
  {
    "title": "Título da Prova",
    "description": "Objetivos desta avaliação",
    "questions": [
      {
        "type": "objetiva" | "discursiva",
        "enunciado": "Texto da questão",
        "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
        "answer": "A", // Identificador da correta
        "explanation": "Explicação técnica da IA",
        "comentarioGabarito": "Justificativa para o aluno"
      }
    ]
  }`;

  try {
    const result = await generateSmartContent({
      tipo: 'simulado',
      perfil: 'professor',
      disciplina: criteria.theme,
      nivel: criteria.difficulty,
      prompt: prompt
    }, modelName);

    if (!result || !result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      throw new Error("A IA gerou um exame sem questões úteis. Tente novamente.");
    }

    // Save to Firestore using the user requested collection 'avaliacoes'
    const docRef = await addDoc(collection(db, "avaliacoes"), {
      ...result,
      criteria,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || 'system',
      status: 'draft'
    });

    return { id: docRef.id, ...result };
  } catch (error) {
    console.error("Error generating exam:", error);
    throw error;
  }
}

export async function generateSingleQuestion(criteria: Omit<ExamCriteria, 'questionCount'>, modelName: string = "gemini-1.5-flash") {
  const prompt = `Gere uma única questão teórica de múltipla escolha sobre:
  - Tema: ${criteria.theme}
  - Competência: ${criteria.competency}
  - Dificuldade: ${criteria.difficulty}
  - Bloom: ${criteria.bloomTaxonomy}

  Regras:
  1. Forneça 5 alternativas (A, B, C, D, E).
  2. Inclua feedback detalhado.
  3. Retorne APENAS um JSON válido.

  FORMATO:
  {
      "enunciado": "...",
      "options": ["A: ...", "B: ...", "C: ...", "D: ...", "E: ..."],
      "answer": "...",
      "explanation": "...",
      "comentarioGabarito": "..."
  }`;

  const result = await generateSmartContent({
    tipo: 'questoes',
    perfil: 'professor',
    disciplina: criteria.theme,
    nivel: criteria.difficulty,
    prompt: prompt
  }, modelName);

  return result;
}
