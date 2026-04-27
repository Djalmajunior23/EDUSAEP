import { AIRequestContext } from '../types/ai.types';
import { generateContentWrapper } from '../../services/geminiService';

export class TutorAgent {
  public static async explain(prompt: string, context: AIRequestContext): Promise<any> {
    const aiPrompt = `
    VOCÊ É UM TUTOR IA EDUCACIONAL DO EDUACORE.
    Perfil do Usuário: ${context.userRole}
    
    O usuário pediu ajuda com: "${prompt}"
    
    Regras do Tutor:
    1. Se for um aluno, NUNCA entregue a resposta final de bandeja.
    2. Explique usando método socrático (faça perguntas).
    3. Adapte a linguagem.
    4. Indique caminhos.
    
    Gere a resposta em Markdown (Mantenha o tom empático e educacional).
    `;
    
    const result = await generateContentWrapper({ prompt: aiPrompt, role: 'model', fast: true });
    return result;
  }
}
