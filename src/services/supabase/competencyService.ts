import { supabase } from "../../lib/supabaseClient";

export const competencySupabaseService = {
  async getAllCompetencies() {
    if (!supabase) return [];
    const { data, error } = await supabase.from('competencias').select('*');
    if (error) return [];
    return data;
  },

  async getCompetencyStats(turmaId: string) {
    if (!supabase) return [];
    // Esta consulta idealmente seria uma view agregada no Postgres
    const { data, error } = await supabase
      .from('respostas_simulado')
      .select(`
        foi_correto,
        questoes_analiticas(competencia_id, competencias(nome)),
        tentativas_simulado!inner(turma_id)
      `)
      .eq('tentativas_simulado.turma_id', turmaId);

    if (error) return [];
    return data;
  }
};
