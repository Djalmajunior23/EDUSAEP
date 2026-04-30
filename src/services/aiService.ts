import { auth } from "../firebase";

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'deepseek' | 'cohere' | 'together';

export interface AICompletionParams {
  prompt: string;
  systemInstruction?: string;
  responseFormat?: "json" | "text";
  responseSchema?: any;
  task: string;
  // Model is optional and discouraged in frontend; backend should decide based on task
  tier?: 'fast' | 'advanced' | 'experimental';
}

export function normalizeAIError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error);

  if (message.includes("5 NOT_FOUND") || message.includes("404")) {
    return "Recurso de IA não encontrado no servidor.";
  }

  if (message.toLowerCase().includes("api key")) {
    return "Erro de configuração na chave de API do servidor.";
  }

  if (message.toLowerCase().includes("quota")) {
    return "Limite de uso da IA atingido temporariamente.";
  }

  return "Falha ao processar comando inteligente.";
}

/**
 * Real-time AI Proxy through Backend.
 * Ensures no API keys or integration details are leaked to the client.
 */
export async function generateAIContent(params: AICompletionParams): Promise<{ text: string, provider: string, model: string, success: boolean, error?: string }> {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    const userRole = localStorage.getItem('user_role') || 'GUEST';

    // Map tier to a hint for backend if needed, but primarily task is used.
    const requestBody = {
      ...params,
      model: params.tier, // Backend server.ts handles mapping
      userId,
      userRole
    };

    const response = await fetch('/api/ai/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        text: "", 
        provider: "none", 
        model: "backend-managed", 
        success: false, 
        error: normalizeAIError(errorData.error || `AI status: ${response.status}`) 
      };
    }

    const result = await response.json();
    return { ...result, success: true };
  } catch (error: any) {
    const normalizedMsg = normalizeAIError(error);
    console.error("[AI Proxy Service] Error:", normalizedMsg);
    return { 
      text: "", 
      provider: "none", 
      model: "unknown", 
      success: false, 
      error: normalizedMsg 
    };
  }
}

/**
 * Safe wrapper used throughout the application.
 */
export async function safeGenerateContent(params: AICompletionParams) {
  const result = await generateAIContent(params);
  
  if (!result.success) {
    console.warn("[AI Wrapper] Fallback mode active.", { error: result.error });
    return {
      success: false,
      content: null,
      error: result.error
    };
  }

  return {
    success: true,
    content: result.text,
    model: result.model
  };
}

/**
 * AI Service Facade for pedagogical operations.
 */
export class AIService {
  static async generatePedagogicalContent(prompt: string, role: string, isJson: boolean = false): Promise<string> {
    const response = await generateAIContent({
      prompt,
      responseFormat: isJson ? "json" : "text",
      task: role === 'student' ? 'student_chat' : 'pedagogical_gen',
    });
    return response.text || "";
  }
}

