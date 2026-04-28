import { AIService } from './aiService';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface CopilotSuggestion {
  text: string;
  confidenceScore: number;
  pedagogicalRationale: string;
  alignment: number;
}

export class TeacherCopilotService {
  /**
   * Generates a pedagogical suggestion for a teacher, using the teacher's profile and class context.
   */
  static async getCopilotSuggestion(
    teacherId: string,
    classId: string,
    prompt: string
  ): Promise<CopilotSuggestion> {
    
    // 1. Fetch context (Memory Pedagógica)
    const teacherProfile = await this.getTeacherMemory(teacherId);
    const classContext = await this.getClassContext(classId);

    // 2. Build contextualized prompt
    const enhancedPrompt = `
      [COPILOTO PEDAGÓGICO EDUAI CORE]
      Perfil do Professor: ${JSON.stringify(teacherProfile)}
      Contexto da Turma: ${JSON.stringify(classContext)}
      
      Tarefa: ${prompt}
      
      INSTRUÇÃO: Forneça a resposta em formato JSON estrito:
      {
        "text": "Sugestão detalhada",
        "confidenceScore": 0.0 - 1.0,
        "pedagogicalRationale": "Por que esta sugestão funciona para esta turma/professor?",
        "alignment": 0-100 // Porcentagem de alinhamento com a UC
      }
    `;

    // 3. Call IA Service
    const responseText = await AIService.generatePedagogicalContent(enhancedPrompt, 'professor', true);
    
    // 4. Return structured parsed response
    try {
      return JSON.parse(responseText);
    } catch (e) {
      return {
        text: responseText,
        confidenceScore: 0.5,
        pedagogicalRationale: "Erro na estruturação JSON, retornando texto puro.",
        alignment: 50
      };
    }
  }

  private static async getTeacherMemory(teacherId: string) {
    const docRef = doc(db, 'users', teacherId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : {};
  }

  private static async getClassContext(classId: string) {
    const docRef = doc(db, 'classes', classId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : {};
  }

  public static async generateDailyPriorities(teacherId: string, model?: string): Promise<any[]> {
    return [
      { id: '1', title: 'Revisar Turma A', description: 'Baixo desempenho em Matemática', priority: 'HIGH' }
    ];
  }

  public static async generateAndSavePBLActivity(teacherId: string, topic: string, model?: string): Promise<{ text: string }> {
    return { text: "PBL activity content" };
  }

  public static async processMessage(teacherId: string, message: string, history: any[], model?: string): Promise<string> {
    return "Resposta do copiloto";
  }
}
