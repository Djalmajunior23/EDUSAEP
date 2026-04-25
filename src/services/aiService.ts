import { auth } from "../firebase";

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'deepseek' | 'cohere' | 'together';

export interface AICompletionParams {
  prompt: string;
  systemInstruction?: string;
  responseFormat?: "json" | "text";
  task: string;
  model?: string;
}

/**
 * Real-time AI Multi-Provider Router with Fallback & Security.
 * This function calls our central backend router (/api/ai/completions).
 * Direct AI calls from the frontend are deprecated for security reasons.
 */
export async function generateAIContent(params: AICompletionParams): Promise<{ text: string, provider: string, model: string }> {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    // User role helps the backend decide on cost and priority
    const userRole = localStorage.getItem('user_role') || 'GUEST';

    const response = await fetch('/api/ai/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        userId,
        userRole
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `AI error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("[AI Service] Error generating content:", error);
    throw error;
  }
}

/**
 * Legacy wrapper for compatibility with older components
 */
export class AIService {
  static async generatePedagogicalContent(prompt: string, role: string, isJson: boolean = false): Promise<string> {
    const response = await generateAIContent({
      prompt,
      responseFormat: isJson ? "json" : "text",
      task: role === 'student' ? 'student_chat' : 'pedagogical_gen',
      systemInstruction: role === 'student' 
        ? "Atue como um tutor didático e paciente. Não dê a resposta diretamente." 
        : "Atue como um especialista em pedagogia e avaliação técnica SENAI/SAEP."
    });
    return response.text;
  }
}

export const generateSmartContent = generateAIContent;

