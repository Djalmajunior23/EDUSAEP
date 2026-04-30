import { callAI } from "../eduJarvis/aiProvider";

export async function reExplainContent(
  originalAnswer: string,
  studentProfile: any,
  explanationFormat: 'resumo' | 'exemplo' | 'analogia' | 'passo-a-passo'
): Promise<string> {
  const systemInstruction = `Você é um tutor pedagógico adaptável (SENAI/SAEP). Explique o conteúdo novamente adaptando ao estilo: ${explanationFormat}. Seja didático.`;
  
  const prompt = `
  Explique novamente este conteúdo: ${originalAnswer}
  Perfil do aluno: ${JSON.stringify(studentProfile)}
  Formato desejado: ${explanationFormat}
  `;
  
  const result = await callAI({systemPrompt: systemInstruction, userPrompt: prompt});
  return result.text;
}
