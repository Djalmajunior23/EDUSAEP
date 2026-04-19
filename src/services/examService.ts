
import { GoogleGenAI } from "@google/genai";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const model = ai.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

export interface ExamCriteria {
  theme: string;
  competency: string;
  questionCount: number;
  difficulty: 'fácil' | 'médio' | 'difícil';
  type: 'objetiva' | 'discursiva' | 'mista';
  bloomTaxonomy: string;
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

  Regras rígidas para a geração:
  1. As questões devem avaliar a competência listada com clareza.
  2. Se tipo 'objetiva', forneça 5 alternativas (a-e) com distratores pedagogicamente coerentes (que refletem erros conceituais comuns).
  3. Se tipo 'discursiva', forneça os critérios de avaliação (rubrica) e o gabarito de referência.
  4. O gabarito deve ser comentado, explicando o porquê de cada alternativa estar correta ou incorreta.
  5. O estilo de linguagem deve ser profissional, direto e adequado ao público-alvo.

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
        "commentary": "..." // Explicação pedagógica detalhada
      }
    ],
    "rubric": "Critérios de correção para as questões discursivas" // Se aplicável
  }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  // Limpar a resposta caso a IA retorne markdown block
  const jsonString = text.replace(/```json|```/g, '').trim();
  const jsonResponse = JSON.parse(jsonString);

  // Save to Firestore
  const docRef = await addDoc(collection(db, "assessments"), {
    ...jsonResponse,
    criteria,
    createdAt: serverTimestamp(),
    status: 'draft'
  });

  return { id: docRef.id, ...jsonResponse };
}
