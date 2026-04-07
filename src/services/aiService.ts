import { generateContentWrapper } from './geminiService';

export class AIService {
  /**
   * Generates content using AI, with automatic fallback from OpenAI to Gemini on 429 errors.
   * Differentiates behavior based on user role (professors get more robust/detailed prompts).
   */
  static async generatePedagogicalContent(prompt: string, role: string, isJson: boolean = false): Promise<string> {
    try {
      // Enhance prompt based on role
      let enhancedPrompt = prompt;
      if (role === 'professor' || role === 'admin') {
        enhancedPrompt = `[MODO ESPECIALISTA PEDAGÓGICO]\nAtue como um especialista em elaboração de itens (padrão SAEP/SENAI).\n${prompt}\nForneça uma resposta técnica, detalhada e com alto rigor acadêmico.`;
      } else {
        enhancedPrompt = `[MODO TUTOR]\nAtue como um tutor paciente e encorajador.\n${prompt}\nExplique de forma simples e didática, sem dar a resposta direta se for um exercício.`;
      }

      // generateContentWrapper already handles the fallback logic from OpenAI to Gemini internally
      // when a 429 error occurs.
      const response = await generateContentWrapper(enhancedPrompt, isJson);
      return response;
    } catch (error: any) {
      console.error("AIService Error:", error);
      
      // Differentiate errors
      if (error.message?.includes('429') || error.status === 429) {
        throw new Error("Limite de requisições excedido nas APIs de IA. Por favor, tente novamente em alguns minutos.");
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        throw new Error("Erro de rede ao conectar com a IA. Verifique sua conexão.");
      } else if (error.message?.includes('key') || error.message?.includes('auth')) {
        throw new Error("Erro de autenticação com o provedor de IA. Contate o administrador.");
      }
      
      throw new Error("Falha inesperada ao gerar conteúdo com IA. Tente novamente.");
    }
  }
}
