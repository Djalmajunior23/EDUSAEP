import { Intent } from '../../types/eduJarvisTypes';

export function detectIntent(command: string): Intent {
  const c = command.toLowerCase();

  // Comandos Estruturados
  if (c.startsWith('/criar-simulado')) return "GERAR_SIMULADO";
  if (c.startsWith('/gerar-plano')) return "GERAR_PLANO_AULA";
  if (c.startsWith('/analisar-turma')) return "ANALISAR_DESEMPENHO";
  if (c.startsWith('/criar-estudo-caso')) return "GERAR_ESTUDO_CASO";
  if (c.startsWith('/criar-aula-invertida')) return "GERAR_AULA_INVERTIDA";
  if (c.startsWith('/gerar-trilha')) return "GERAR_TRILHA_APRENDIZAGEM";
  if (c.startsWith('/sugerir-intervencao')) return "SUGERIR_INTERVENCAO";
  if (c.startsWith('/corrigir-prova') || c.startsWith('/vision')) return "CORRECAO_VISAO";
  if (c.startsWith('/gerar-bi') || c.startsWith('/insights')) return "GERAR_BI_INSIGHTS";

  // Detecção por palavras-chave
  if (c.includes("simulado") || c.includes("questões") || c.includes("questoes") || c.includes("lista de exercicios") || c.includes("banco de itens")) {
    return "GERAR_SIMULADO";
  }
  if (c.includes("estudo de caso")) {
    return "GERAR_ESTUDO_CASO";
  }
  if (c.includes("aula invertida") || c.includes("flipped classroom")) {
    return "GERAR_AULA_INVERTIDA";
  }
  if (c.includes("trilha") || c.includes("cronograma de estudos") || c.includes("plano de estudos") || c.includes("roteiro")) {
    return "GERAR_TRILHA_APRENDIZAGEM";
  }
  if (c.includes("intervenção") || c.includes("intervencao") || c.includes("ajuda na aula") || c.includes("ajudar aluno")) {
    return "SUGERIR_INTERVENCAO";
  }
  if (c.includes("risco") || c.includes("previsão") || c.includes("reprovação") || c.includes("evasão") || c.includes("alerta") || c.includes("dificuldade grave") || c.includes("atraso")) {
    return "ANALISAR_RISCO_ACADEMICO";
  }
  if (c.includes("relatório semanal") || c.includes("resumo da semana") || c.includes("balanço")) {
    return "GERAR_RELATORIO_SEMANAL";
  }
  if (c.includes("bi") || c.includes("insights") || c.includes("dashboard") || c.includes("relatório") || c.includes("relatorio") || c.includes("panorama") || c.includes("estatística") || c.includes("gráficos") || c.includes("análise de dados")) {
    return "GERAR_BI_INSIGHTS";
  }
  if (c.includes("desempenho") || c.includes("resultado") || c.includes("média") || c.includes("nota") || c.includes("ranking") || c.includes("evolução") || c.includes("progresso") || c.includes("como está a turma")) {
    return "ANALISAR_DESEMPENHO";
  }
  if (c.includes("plano de aula") || c.includes("planejamento")) {
    return "GERAR_PLANO_AULA";
  }
  if (c.includes("explique") || c.includes("o que é") || c.includes("como funciona") || c.includes("explicar") || c.includes("defina")) {
    return "EXPLICAR_CONTEUDO";
  }
  if (c.includes("lembra") || c.includes("histórico") || c.includes("memória") || c.includes("o que conversamos")) {
    return "CONSULTAR_MEMORIA";
  }
  if (c.includes("ouça") || c.includes("escute") || c.includes("fala")) {
    return "COMANDO_VOZ";
  }

  return "COMANDO_GERAL";
}
