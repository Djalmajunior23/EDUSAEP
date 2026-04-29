import admin from 'firebase-admin';

/**
 * Agente de Memória Pedagógica do EduJarvis.
 * Gerencia o contexto histórico, preferências e insights acumulados de cada usuário.
 */
export const memoryAgent = {
  /**
   * Recupera a memória pedagógica do usuário ou cria uma inicial se não existir.
   */
  async getMemory(userId: string) {
    const db = admin.firestore();
    const memoryRef = db.collection('jarvis_memoria_pedagogica').doc(userId);
    const doc = await memoryRef.get();
    
    if (!doc.exists) {
      const initialMemory = {
        userId,
        preferencias: {
          tom: 'didático', // didático, direto, socrático, encorajador
          detalhamento: 'médio',
          nivelComplexidade: 'intermediário'
        },
        competenciasDestaque: [],
        gapsIdentificados: [],
        objetivosEstudo: [],
        insights: [],
        historicoInteracoes: [],
        ultimaInteracao: admin.firestore.FieldValue.serverTimestamp(),
        usoTotal: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await memoryRef.set(initialMemory);
      return initialMemory;
    }
    
    return doc.data();
  },

  /**
   * Adiciona um novo insight à memória do usuário com categoria.
   */
  async addInsight(userId: string, insight: string, categoria: 'aprendizado' | 'comportamento' | 'preferencia' = 'aprendizado') {
    const db = admin.firestore();
    const memoryRef = db.collection('jarvis_memoria_pedagogica').doc(userId);
    
    await memoryRef.update({
      insights: admin.firestore.FieldValue.arrayUnion({
        texto: insight,
        categoria,
        data: new Date().toISOString()
      }),
      ultimaInteracao: admin.firestore.FieldValue.serverTimestamp()
    });
  },

  /**
   * Gera um resumo contextual da memória para ser injetado nos prompts da IA.
   */
  async getMemorySummary(userId: string): Promise<string> {
    const memory: any = await this.getMemory(userId);
    if (!memory) return "Nenhum histórico disponível.";

    const insightsStr = (memory.insights || [])
      .slice(-5)
      .map((i: any) => `- [${i.categoria}] ${i.texto}`)
      .join('\n');

    const recentInteractions = (memory.historicoInteracoes || [])
      .slice(-3)
      .map((h: any) => `- ${h.intent} (${new Date(h.timestamp).toLocaleDateString()})`)
      .join('\n');

    return `
---
CONTEXTO DE MEMÓRIA PEDAGÓGICA (EDU_JARVIS):
- Usuário: ${userId}
- Perfil Cognitivo: Tom ${memory.preferencias?.tom || 'Neutro'}, Detalhamento ${memory.preferencias?.detalhamento || 'Normal'}
- Insights Estratégicos: 
${insightsStr || 'Sem insights recentes.'}
- Interações Recentes:
${recentInteractions || 'Primeiras interações.'}
---
`;
  },

  /**
   * Analisa a resposta da IA e extrai insights pedagógicos automaticamente.
   */
  async saveInsightsFromResponse(userId: string, aiResponse: string) {
    const db = admin.firestore();
    
    // 1. Extração por TAG explícita
    const insightMatch = aiResponse.match(/\[INSIGHT\]:(.*?)(?=\n|$)/i);
    if (insightMatch && insightMatch[1]) {
      await this.addInsight(userId, insightMatch[1].trim(), 'aprendizado');
    }

    // 2. Heurística de mudança de tom (Exemplo simples)
    if (aiResponse.toLowerCase().includes("entendido, serei mais detalhado") || aiResponse.toLowerCase().includes("explicarei com mais detalhes")) {
      await db.collection('jarvis_memoria_pedagogica').doc(userId).update({
        'preferencias.detalhamento': 'alto'
      });
    }
  },

  /**
   * Atualização genérica com merge.
   */
  async updateGeneric(userId: string, data: any) {
    const db = admin.firestore();
    await db.collection('jarvis_memoria_pedagogica').doc(userId).set({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
};
