
import { GoogleGenAI } from "@google/genai";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ExamCriteria {
  theme: string;
  competency: string;
  questionCount: number;
  difficulty: 'fácil' | 'médio' | 'difícil';
  type: 'objetiva' | 'discursiva' | 'mista';
  bloomTaxonomy: string;
  idealResponseExample?: string;
}

export async function generateExam(criteria: ExamCriteria) {
  const prompt = `Você é um especialista em avaliação educacional e design instrucional. 
  Gere uma prova baseada nos critérios abaixo, seguindo rigorosamente a Taxonomia de Bloom para nivelar a dificuldade das questões:

  Critérios:
  - Tema: ${criteria.theme}
  - Competência: ${criteria.competency}
  - Quantidade: ${criteria.questionCount}
  - Dificuldade: ${criteria.difficulty}
  - Tipo: ${criteria.type}
  - Nível Bloom Aplicado: ${criteria.bloomTaxonomy}
  ${criteria.idealResponseExample ? `- Exemplo de resposta desejada: ${criteria.idealResponseExample}` : ''}

  Regras rígidas para a geração:
  1. As questões devem avaliar a competência listada com clareza.
  2. Se tipo 'objetiva', forneça 5 alternativas (a-e) com distratores pedagogicamente coerentes.
  3. Se tipo 'discursiva', forneça os critérios de avaliação (rubrica) detalhados e um gabarito de referência baseado no exemplo enviado, se existir.
  4. O gabarito deve ser comentado.
  5. O estilo de linguagem deve ser profissional.

  Retorne APENAS um JSON estritamente no formato:
  {
    "title": "Título da Prova",
    "description": "Descrição detalhada dos objetivos desta avaliação",
    "questions": [
      {
        "type": "objetiva" | "discursiva",
        "enunciado": "...",
        "options": ["...", "...", "...", "...", "..."], // Apenas se objetiva
        "answer": "...", // Texto da resposta correta ou gabarito estruturado
        "commentary": "...", // Explicação pedagógica detalhada
        "explanation": "...",
        "comentarioGabarito": "Explicação detalhada para a resposta correta."
      }
    ],
    "rubric": "Critérios de correção para as questões discursivas" // Se aplicável
  }`;

  const result = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  const text = (result.text || "").replace(/```json|```/g, '').trim();
  const jsonResponse = JSON.parse(text);

  // Save to Firestore
  const docRef = await addDoc(collection(db, "assessments"), {
    ...jsonResponse,
    criteria,
    createdAt: serverTimestamp(),
    status: 'draft'
  });

  return { id: docRef.id, ...jsonResponse };
}

export async function generateSingleQuestion(criteria: Omit<ExamCriteria, 'questionCount'>) {
  const prompt = `Gere uma única questão teórica de múltipla escolha sobre:
  - Tema: ${criteria.theme}
  - Competência: ${criteria.competency}
  - Dificuldade: ${criteria.difficulty}
  - Bloom: ${criteria.bloomTaxonomy}

  Regras:
  1. Forneça 5 alternativas (A, B, C, D, E).
  2. Inclua feedback para todas as alternativas (explique o erro se for distrator, ou o acerto).
  3. Indique a alternativa correta.
  4. Inclua comentário gabarito.                
  5. Inclua explicação da IA sobre o raciocínio da dificuldade/abordagem (campo 'explanation').

  Retorne APENAS JSON:
  {
      "enunciado": "...",
      "options": ["A: ...", "B: ...", "C: ...", "D: ...", "E: ..."],
      "feedback": ["...", "...", "...", "...", "..."],
      "answer": "...",
      "commentary": "...",
      "explanation": "...",
      "comentarioGabarito": "..."
  }`;

  const result = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
  });
  
  const text = (result.text || "").replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}
