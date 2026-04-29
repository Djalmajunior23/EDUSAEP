import { auth } from '../firebase';
import { EduJarvisRequest, EduJarvisResponse, UserRole, Intent } from '../types/eduJarvisTypes';

/**
 * EduJarvisService: Central de Inteligência Pedagógica (Frontend)
 * 
 * Este serviço é o PONTO ÚNICO de entrada para todas as funcionalidades de IA
 * relacionadas ao ecossistema EduJarvis. 
 * 
 * DIRETRIZES DE SEGURANÇA E GOVERNANÇA:
 * 1. Nenhuma chave de API (Gemini, OpenAI, etc.) deve existir aqui.
 * 2. Nenhuma lógica de processamento de IA (prompt engineering pesado) deve existir aqui.
 * 3. Todas as chamadas são delegadas para o Backend (Cloud Functions/Server) via /api/edu-jarvis/process.
 * 4. O backend é responsável pela orquestração, segurança de camada de IA e auditoria.
 */
export const eduJarvisService = {
  /**
   * Envia um comando genérico ou orquestrado para o EduJarvis.
   */
  async sendEduJarvisCommand(
    request: Partial<EduJarvisRequest>
  ): Promise<EduJarvisResponse> {
    try {
      const userId = request.userId || auth.currentUser?.uid;
      
      if (!userId && !request.userId) {
        throw new Error('Usuário não autenticado para utilizar o EduJarvis');
      }

      const userRole = request.userRole || (localStorage.getItem('user_role') as UserRole) || 'STUDENT';

      const fullRequest: EduJarvisRequest = {
        userId: userId || 'anonymous',
        userRole,
        command: request.command || '',
        context: {
          ...request.context,
          lastAccessedAt: new Date().toISOString(),
          clientVersion: '1.2.0-ULTRA'
        },
        image: request.image
      };

      const response = await fetch('/api/edu-jarvis/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken() || ''}`
        },
        body: JSON.stringify(fullRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha na comunicação com o Cérebro EduJarvis');
      }

      const result: EduJarvisResponse = await response.json();
      return result;
      
    } catch (e: any) {
      console.error('[EduJarvisService] Error:', e);
      return {
        response: `[Falha Técnica] O EduJarvis não conseguiu processar sua solicitação agora. Motivo: ${e.message}. Verifique sua conexão e tente novamente.`
      };
    }
  },

  /**
   * Método especializado para análise de imagem (OCR + Pedagogia)
   */
  async analyzeVision(image: string, comment?: string): Promise<EduJarvisResponse> {
    return this.sendEduJarvisCommand({
      command: comment || 'Analise esta imagem sob uma ótica pedagógica.',
      image
    });
  },

  /**
   * Atalho para gerar diagnósticos rápidos
   */
  async generateDiagnostic(context: any): Promise<EduJarvisResponse> {
    return this.sendEduJarvisCommand({
      command: '/gerar-diagnostico',
      context: { ...context, forceIntent: 'ANALISAR_DESEMPENHO' as Intent }
    });
  }
};
