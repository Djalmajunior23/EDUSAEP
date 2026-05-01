import { generateAIContent } from '../../../services/aiService';
import { AI_CONFIG } from '../../../ai-config';

export async function importAgent(text: string, context: any) {
  const prompt = `
Aja como o EduJarvis Importador, o Gêmeo Pedagógico especialista em estruturação de dados educacionais.
Sua missão é converter o texto bruto abaixo em um array de objetos JSON de questões altamente estruturadas.

TEXTO BRUTO:
"""
${text}
"""

REGRAS DE ESTRUTURAÇÃO (PADRÃO SAEP/SENAI):
1. Identifique o enunciado de cada questão.
2. Identifique as alternativas (geralmente A a D ou A a E).
3. Identifique a resposta correta (Gabarito). Se não houver, tente inferir a mais provável baseado no conteúdo.
4. Classifique cada questão em:
   - Dificuldade: 'fácil', 'médio' ou 'difícil'.
   - Nível de Bloom: 'lembrar', 'compreender', 'aplicar', 'analisar', 'avaliar' ou 'criar'.
   - Competência: Identifique a disciplina ou competência principal.
5. Adicione um campo 'justificativaIA' explicando por que a resposta X é a correta.
6. Campos de Saída (JSON):
   - enunciado (string)
   - alternativas (array de {id: string, texto: string})
   - respostaCorreta (string, apenas a letra)
   - dificuldade (string)
   - bloom (string)
   - competenciaNome (string)
   - justificativaIA (string)

Responda APENAS o JSON puro, sem markdown, começando com [ e terminando com ].
`;

  try {
    const result = await generateAIContent({
      prompt,
      tier: 'fast',
      task: 'question-import'
    });

    if (result.success && result.text) {
      // Limpa possíveis markdowns se a IA teimar em colocar
      const cleanJson = result.text.replace(/```json|```/g, '').trim();
      try {
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error("[EduJarvis ImportAgent] JSON Parse Error:", e);
        throw new Error("A IA retornou um formato de dados inválido na importação.");
      }
    }
    throw new Error(result.error || "IA falhou em estruturar as questões");
  } catch (error: any) {
    console.error("[EduJarvis ImportAgent] Error:", error);
    throw error;
  }
}
