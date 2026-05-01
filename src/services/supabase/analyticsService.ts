import { supabase } from "../../lib/supabaseClient";

export const analyticsSupabaseService = {
  /**
   * Média da turma por competência
   */
  async getClassAverageByCompetency(turmaId: string) {
    if (!supabase) return [];
    
    try {
      // Exemplo de consulta agregada via RPC ou view se disponível, 
      // ou calculada aqui se o volume for baixo
      const { data, error } = await supabase
        .from('tentativas_simulado')
        .select(`
          nota_final,
          respostas_simulado(foi_correto, questao_id, questoes_analiticas(competencia_id, competencias(nome)))
        `)
        .eq('turma_id', turmaId);

      if (error) throw error;
      
      // Lógica de agregação (em produção prefira uma View no Postgres)
      const competencyMap: Record<string, { total: number, count: number }> = {};
      
      data?.forEach(tentativa => {
        tentativa.respostas_simulado?.forEach((resp: any) => {
          const compName = resp.questoes_analiticas?.competencias?.nome || 'Geral';
          if (!competencyMap[compName]) competencyMap[compName] = { total: 0, count: 0 };
          if (resp.foi_correto) competencyMap[compName].total++;
          competencyMap[compName].count++;
        });
      });

      return Object.entries(competencyMap).map(([name, stats]) => ({
        competencia: name,
        media: Math.round((stats.total / stats.count) * 100)
      }));
    } catch (err) {
      console.error("Erro analytics Supabase:", err);
      return [];
    }
  },

  /**
   * Evolução do Aluno
   */
  async getStudentEvolution(alunoId: string) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('tentativas_simulado')
      .select('data_tentativa, nota_final, percentual_acerto')
      .eq('aluno_id', alunoId)
      .order('data_tentativa', { ascending: true });

    if (error || !data) return [];

    return data.map(d => ({
      date: new Date(d.data_tentativa).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      score: d.nota_final || d.percentual_acerto
    }));
  }
};
