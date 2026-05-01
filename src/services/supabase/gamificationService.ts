import { supabase } from "../../lib/supabaseClient";

export const gamificationSupabaseService = {
  /**
   * Adiciona pontos no Supabase
   */
  async addPoints(params: {
    firebaseUid: string,
    alunoId: string,
    pontos: number,
    motivo: string,
    tipo: 'acerto' | 'sequencia' | 'missao'
  }) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('gamificacao_pontos')
      .insert({
        firebase_uid: params.firebaseUid,
        aluno_id: params.alunoId,
        pontos: params.pontos,
        motivo: params.motivo,
        tipo: params.tipo
      })
      .select()
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Busca ranking de gamificação da turma
   */
  async getRanking(turmaId?: string) {
    if (!supabase) return [];

    // Esta consulta precisaria de Join se quisermos nomes
    const { data, error } = await supabase
      .from('gamificacao_pontos')
      .select(`
        aluno_id,
        pontos,
        profiles_supabase(display_name)
      `)
      .order('pontos', { ascending: false });

    if (error) return [];
    
    // Agrupa pontos por aluno se houver múltiplos registros
    const rankingMap: Record<string, any> = {};
    data.forEach((item: any) => {
      const id = item.aluno_id;
      if (!rankingMap[id]) {
        rankingMap[id] = { 
          nome: item.profiles_supabase?.display_name || 'Aluno', 
          total: 0 
        };
      }
      rankingMap[id].total += item.pontos;
    });

    return Object.values(rankingMap).sort((a, b) => b.total - a.total);
  }
};
