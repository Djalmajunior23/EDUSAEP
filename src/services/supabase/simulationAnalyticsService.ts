import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

export const simulationAnalyticsService = {
  async getSimulationHistory(alunoId: string) {
    if (!isSupabaseConfigured || !supabase) {
      console.warn("Supabase não configurado. Retornando histórico vazio.");
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('simulation_attempts')
        .select('*')
        .eq('aluno_id', alunoId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar histórico de simulados:", error);
      return [];
    }
  },
};
