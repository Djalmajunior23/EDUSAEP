import { auth } from '../firebase';
import { EduJarvisRequest, EduJarvisResponse, Intent, UserRole } from '../types/eduJarvisTypes';

/**
 * EduJarvis Service - Frontend Proxy for AI Operations.
 * Ensures the backend is the only point of contact with AI providers.
 */
export class EduJarvis {
  /**
   * Sends a structured command to the EduJarvis backend.
   */
  public static async execute(command: string, options: {
    context?: any;
    image?: string;
    role?: UserRole;
  } = {}): Promise<EduJarvisResponse> {
    const user = (auth as any).currentUser;
    if (!user) throw new Error("Ação não permitida: Usuário não autenticado");

    const payload: EduJarvisRequest = {
      command,
      userId: user.uid,
      userRole: options.role || (localStorage.getItem('user_role') as UserRole) || 'TEACHER',
      context: options.context,
      image: options.image
    };

    try {
      const response = await fetch('/api/edu-jarvis/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro de comunicação backend' }));
        throw new Error(err.error || `Erro ${response.status} ao processar comando EduJarvis`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("[EduJarvis Service] Execution Error:", error);
      throw error;
    }
  }

  /**
   * Helper for pedagogical content generation.
   */
  public static async pedagogicalCommand(prompt: string, context?: any): Promise<string> {
    const res = await this.execute(prompt, { context });
    return res.response || "";
  }

  /**
   * Specialist for question import enrichment.
   */
  public static async importQuestions(rawText: string, context?: any): Promise<any[]> {
    const res = await this.execute(`/importar ${rawText}`, { context });
    if (res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  /**
   * Analyze student or class performance.
   */
  public static async analyzePerformance(id: string, type: 'STUDENT' | 'CLASS', data: any): Promise<EduJarvisResponse> {
    const command = type === 'STUDENT' ? `/analisar-aluno ${id}` : `/analisar-turma ${id}`;
    return await this.execute(command, { context: data });
  }
}

// Backward compatibility or easier access
export const sendJarvisCommand = (req: any) => EduJarvis.execute(req.command, { 
  context: req.context, 
  image: req.image,
  role: req.userRole
});
