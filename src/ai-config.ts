// src/ai-config.ts

/**
 * Centralized AI Configuration for EDUAI CORE ULTRA
 * This configuration helps prevent hardcoding model names and providers throughout the application.
 */

export const AI_CONFIG = {
  // Flag to completely bypass AI features if needed
  enableAI: true, 
  
  // Default status for UI feedback
  status: {
    PENDING: 'pendente_ia',
    FAILED: 'erro_ia_fallback',
    SUCCESS: 'processado_ia'
  }
};
