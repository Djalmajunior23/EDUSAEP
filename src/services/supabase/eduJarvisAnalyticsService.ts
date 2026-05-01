import { supabase } from "../../lib/supabaseClient";

export const eduJarvisAnalyticsService = {
  /**
   * Salva uma análise do EduJarvis no Supabase
   */
  async saveAnalysis(params: {
    firebaseUid: string,
    alunoId?: string,
    turmaId?: string,
    tipo: string,
    resultado: any,
    promptVersion?: string
  }) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('analises_edu_jarvis')
      .insert({
        firebase_uid: params.firebaseUid,
        aluno_id: params.alunoId,
        turma_id: params.turmaId,
        tipo_analise: params.tipo,
        conteudo_analise: params.resultado,
        recomendacoes: params.resultado.recommendations || params.resultado.feedback,
        prompt_version: params.promptVersion || '2.0-ultra',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar análise EduJarvis no Supabase:", error);
      return null;
    }
    return data;
  },

  /**
   * Busca histórico de análises
   */
  async getAnalysisHistory(turmaId?: string, alunoId?: string) {
    if (!supabase) return [];
    
    let query = supabase.from('analises_edu_jarvis').select('*');
    
    if (turmaId) query = query.eq('turma_id', turmaId);
    if (alunoId) query = query.eq('aluno_id', alunoId);

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) return [];
    return data;
  }
};
