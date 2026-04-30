import { Intent } from '../../types/eduJarvisTypes';

export function detectIntent(command: string): Intent {
  const c = command.toLowerCase().trim();

  // 1. Comandos Diretos (Prioridade Máxima)
  if (c.startsWith('/criar-simulado') || c.startsWith('/gerar-simulado')) return "GERAR_SIMULADO";
  if (c.startsWith('/gerar-plano') || c.startsWith('/criar-plano')) return "GERAR_PLANO_AULA";
  if (c.startsWith('/analisar-turma') || c.startsWith('/diagnostic-turma')) return "ANALISAR_DESEMPENHO";
  if (c.startsWith('/criar-estudo-caso') || c.startsWith('/gerar-estudo-caso')) return "GERAR_ESTUDO_CASO";
  if (c.startsWith('/criar-aula-invertida') || c.startsWith('/gerar-aula-invertida')) return "GERAR_AULA_INVERTIDA";
  if (c.startsWith('/gerar-trilha') || c.startsWith('/criar-trilha')) return "GERAR_TRILHA_APRENDIZAGEM";
  if (c.startsWith('/sugerir-intervencao') || c.startsWith('/ajuda-pedagogica')) return "SUGERIR_INTERVENCAO";
  if (c.startsWith('/importar') || c.startsWith('/extrair')) return "IMPORTAR_QUESTOES";
  if (c.startsWith('/corrigir-prova') || c.startsWith('/vision') || c.startsWith('/corrigir-foto')) return "CORRECAO_VISAO";
  if (c.startsWith('/gerar-bi') || c.startsWith('/insights') || c.startsWith('/dashboard')) return "GERAR_BI_INSIGHTS";
  if (c.startsWith('/analisar-aluno')) return "ANALISAR_DESEMPENHO";
  if (c.startsWith('/analisar-risco')) return "ANALISAR_RISCO_ACADEMICO";

  // 2. Mapeamento por Padrões Contextuais (Granularidade Solicitada)

  // OTIMIZAR QUESTAO
  if (c.includes("otimizar questão") || c.includes("analise a questão") || c.includes("reformul") || c.includes("poder de discriminação")) {
    return "OTIMIZAR_QUESTAO" as Intent;
  }

  // GERAR_SIMULADO / QUESTÕES
  const isQuestionTarget = c.includes("questões") || c.includes("questoes") || c.includes("exercícios") || c.includes("exercicios") || c.includes("atividades");
  const isSimuladoTarget = c.includes("simulado") || c.includes("prova") || c.includes("teste") || c.includes("avaliação") || c.includes("avaliacao");
  const isSaepContext = c.includes("saep") || c.includes("padrão senai") || c.includes("senai");
  
  if ((isSimuladoTarget || isQuestionTarget) && (isSaepContext || c.includes("difícil") || c.includes("matemática") || c.includes("português") || c.includes("técnico"))) {
    return "GERAR_SIMULADO";
  }

  // Se mencionou "banco de itens" ou "gerar questões", vai para simulado/questões
  if (c.includes("banco de itens") || c.includes("gerar questões") || c.includes("criar questões")) {
    return "GERAR_SIMULADO";
  }

  // ANALISAR_RISCO_ACADEMICO (Padrões de Alerta)
  if (c.includes("risco") || c.includes("evasão") || c.includes("evasao") || c.includes("reprovação") || c.includes("desistir") || c.includes("alerta de nota") || c.includes("aluno em perigo")) {
    return "ANALISAR_RISCO_ACADEMICO";
  }

  // ANALISAR_DESEMPENHO (Padrões de Resultados)
  if (c.includes("como está o aluno") || c.includes("evolução") || c.includes("evolucao") || c.includes("progresso") || c.includes("desempenho") || c.includes("rendimento") || c.includes("notas da turma") || c.includes("analyze") || c.includes("performance") || c.includes("trends")) {
    return "ANALISAR_DESEMPENHO";
  }

  // GERAR_PLANO_AULA
  if (c.includes("plano de aula") || c.includes("planejamento") || c.includes("sequência didática") || c.includes("preparar aula")) {
    return "GERAR_PLANO_AULA";
  }

  // SUGERIR_INTERVENCAO
  if (c.includes("intervenção") || c.includes("intervencao") || c.includes("ajudar o aluno") || c.includes("estratégia para melhorar") || c.includes("recuperação")) {
    return "SUGERIR_INTERVENCAO";
  }

  // GERAR_ESTUDO_CASO
  if (c.includes("estudo de caso") || c.includes("situação problema") || c.includes("contexto real")) {
    return "GERAR_ESTUDO_CASO";
  }

  // GERAR_TRILHA_APRENDIZAGEM
  if (c.includes("trilha") || c.includes("cronograma") || c.includes("roteiro de estudo") || c.includes("plano de estudos")) {
    return "GERAR_TRILHA_APRENDIZAGEM";
  }

  // GERAR_BI_INSIGHTS (Analytics profundo)
  if (c.includes("insights") || c.includes("panorama") || c.includes("estatística") || c.includes("bi") || c.includes("análise preditiva") || c.includes("tendência")) {
    return "GERAR_BI_INSIGHTS";
  }

  // IMPORTAR_QUESTOES
  if (c.includes("importar") || c.includes("extrair questões") || c.includes("lê esse arquivo") || c.includes("processar pdf")) {
    return "IMPORTAR_QUESTOES";
  }

  // EXPLICAR_CONTEUDO (Tutor Pedagógico)
  if (c.includes("explique") || c.includes("o que é") || c.includes("como funciona") || c.includes("explicar") || c.includes("não entendi") || c.includes("me ajude com")) {
    return "EXPLICAR_CONTEUDO";
  }

  // CONSULTAR_MEMORIA
  if (c.includes("lembra") || c.includes("histórico") || c.includes("memória") || c.includes("o que conversamos") || c.includes("interações passadas")) {
    return "CONSULTAR_MEMORIA";
  }

  // COMANDO_VOZ
  if (c.includes("ouça") || c.includes("escute") || c.includes("fala") || c.includes("voz")) {
    return "COMANDO_VOZ";
  }

  return "COMANDO_GERAL";
}
