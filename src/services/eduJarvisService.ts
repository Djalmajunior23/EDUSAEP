import { EduJarvisRequest, EduJarvisResponse } from '../types/eduJarvisTypes';
import { logger } from '../utils/logger';

const API_ENDPOINT = '/api/edu-jarvis/process';
const MODULE = 'JARVIS_SERVICE';

/**
 * Service to communicate with EduJarvis Backend
 * Includes robust error handling and fallback patterns for production.
 */
export async function sendJarvisCommand(request: EduJarvisRequest): Promise<EduJarvisResponse> {
  try {
    logger.debug(MODULE, `Sending command: ${request.action || 'AUTO'}`, request.command);
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      if (response.status === 405) {
        throw new Error("Servidor não aceitou a requisição (405). Verifique a rota da API.");
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Erro no servidor: ${response.status}`);
    }

    const data = await response.json();
    logger.debug(MODULE, 'Response received successfully');
    return data;
  } catch (error) {
    logger.error(MODULE, "EduJarvis Service Failure", error);
    
    // Fallback Production Pattern
    return {
      success: false,
      response: "Desculpe, o EduJarvis está passando por uma manutenção rápida. Por favor, tente novamente em instantes.",
      action: 'FALLBACK_TRIGGERED',
      metadata: { createdAt: new Date().toISOString(), error_fallback: error instanceof Error ? error.message : 'Network Error' }
    };
  }
}

/**
 * Backward compatibility object for legacy code
 */
export const EduJarvis = {
  execute: async (command: string, options: any) => {
    return sendJarvisCommand({
      command,
      action: options.action,
      context: options.context,
      userId: options.userId || 'legacy_user'
    });
  }
};
