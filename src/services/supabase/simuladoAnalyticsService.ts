import { supabase } from "../../lib/supabaseClient";

export const simuladoAnalyticsService = {
  /**
   * Salva tentativa de simulado no Supabase
   */
  async saveAttempt(params: {
    firebaseUid: string,
    alunoId: string,
    turmaId: string,
    simuladoId: string,
    notaFinal: number,
    percentualAcerto: number,
    tempoSegundos: number,
    respostas: Array<{
      questaoId: string,
      alternativa: string,
      foiCorreto: boolean,
      tempoMs: number
    }>
  }) {
    if (!supabase) return null;

    try {
      // 1. Salva a tentativa principal
      const { data: tentativa, error: tError } = await supabase
        .from('tentativas_simulado')
        .insert({
          firebase_uid: params.firebaseUid,
          aluno_id: params.alunoId,
          turma_id: params.turmaId,
          simulado_id: params.simuladoId,
          nota_final: params.notaFinal,
          percentual_acerto: params.percentualAcerto,
          tempo_segundos: params.tempoSegundos
        })
        .select()
        .single();

      if (tError) throw tError;

      // 2. Salva as respostas detalhadas
      if (params.respostas && params.respostas.length > 0) {
        const respostasData = params.respostas.map(r => ({
          tentativa_id: tentativa.id,
          questao_id: r.questaoId,
          alternativa_marcada: r.alternativa,
          foi_correto: r.foiCorreto,
          tempo_resposta_ms: r.tempoMs
        }));

        const { error: rError } = await supabase
          .from('respostas_simulado')
          .insert(respostasData);

        if (rError) console.error("Erro ao salvar respostas detalhadas:", rError);
      }

      return tentativa;
    } catch (err) {
      console.error("Erro saving simulado attempt to Supabase:", err);
      return null;
    }
  },

  /**
   * Histórico por aluno
   */
  async getStudentHistory(alunoId: string) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('tentativas_simulado')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('data_tentativa', { ascending: false });
    
    if (error) return [];
    return data;
  }
};
