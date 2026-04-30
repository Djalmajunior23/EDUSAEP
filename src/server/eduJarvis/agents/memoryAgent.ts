import admin from 'firebase-admin';

/**
 * Memory Agent for EduJarvis.
 * Persists and retrieves pedagogical interactions to build continuous intelligence.
 * Uses collection 'jarvis_memoria_pedagogica' as requested.
 */
export const memoryAgent = {
  collectionName: 'jarvis_memoria_pedagogica',

  /**
   * Retrieves full recent memory context for a user.
   */
  async getMemory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const db = admin.firestore();
      const snapshot = await db.collection(this.collectionName)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("[MemoryAgent] Error retrieving memory:", error);
      return [];
    }
  },

  /**
   * Generates or retrieves a concise summary of user historical context.
   */
  async getMemorySummary(userId: string): Promise<string> {
    try {
      const memory = await this.getMemory(userId, 3);
      if (memory.length === 0) return "Nenhuma interação anterior registrada.";

      return memory.map(m => `- Usuário perguntou: "${m.command}". Resposta: "${m.response.substring(0, 100)}..."`).join('\n');
    } catch (error) {
      return "Erro ao processar resumo de memória.";
    }
  },

  /**
   * Records a complete interaction.
   */
  async recordInteraction(userId: string, intent: string, command: string, response: string): Promise<void> {
    try {
      const db = admin.firestore();
      await db.collection(this.collectionName).add({
        userId,
        intent,
        command,
        response,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'interaction'
      });
    } catch (error) {
      console.error("[MemoryAgent] Error recording interaction:", error);
    }
  },

  /**
   * Specific helper to save distilled insights from AI responses.
   */
  async saveInsightsFromResponse(userId: string, response: string): Promise<void> {
    // Here we could extract key concepts and save them as 'facts' or 'insights'
    // For now, we save it as metadata linked to memory
    try {
      const db = admin.firestore();
      await db.collection(this.collectionName).add({
        userId,
        insight: response.substring(0, 500), // Simple truncation for insight
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'insight'
      });
    } catch (error) {
      console.error("[MemoryAgent] Error saving insights:", error);
    }
  }
};
