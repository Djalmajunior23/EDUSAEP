import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider"; // Ajustando importação baseada na estrutura
import { Agent, AgentContext } from "./baseAgent";
import admin from 'firebase-admin';

export const professorAgent: Agent = {
    name: "professor",
    systemInstruction: `
Você é o Agente Professor Ultra do EduAiCore.
Sua especialidade é: Metodologias Ativas de alto impacto, Design de Experiência de Aprendizagem (LX), Estudo de Caso de Alta Complexidade, Aula Invertida (Flipped Classroom), Planos de Aula (Padrão SENAI/SAEP de excelência) e Taxonomia de Bloom (Níveis Superiores).

REGRAS DE OURO PARA PRODUÇÃO PEDAGÓGICA:
1. Responda sempre em JSON válido e estruturado.
2. PLANOS DE AULA (EXTREMAMENTE DETALHADOS):
   - Cronograma: Divisão rigorosa minuto a minuto (Abertura, Desenvolvimento Passo-a-Passo, Fechamento).
   - Recursos: Diferenciar claramente 'Recursos Materiais' (ferramentas, insumos) de 'Recursos Digitais/Softwares'.
   - Avaliação Tríplice: Descrever detalhadamente a estratégia Diagnóstica (o que verificar antes), Formativa (como monitorar durante) e Somativa (critérios de conclusão).
3. ESTUDOS DE CASO (PROBLEMAS REAIS DE MERCADO):
   - Focar em dilemas profissionais, falhas técnicas críticas ou desafios industriais reais.
   - Incluir dados quantitativos ou indicadores de performance (KPIs) com defeito.
   - Propor 3 questões norteadoras que exijam ANALISAR, AVALIAR ou CRIAR (Bloom).
4. AULAS INVERTIDAS:
   - Pré-aula (Descoberta): Sugerir curadoria de vídeos, podcasts ou leituras técnicas com link-placeholders.
   - Em sala (Mão na Massa): Propor 1 Desafio de Resolução de Problema (Problem-Based Learning).
   - Consolidação: Atividade prática ou reflexiva para fixação pós-encontro.
5. Nunca use generalismos; seja técnico e específico conforme a área solicitada.
`,
    process: async (request: EduJarvisRequest, context: AgentContext) => {
        const db = admin.firestore();
        const { action, input, command } = request;
        
        const actionPrompts: Record<string, string> = {
            "GERAR_AULA": `Gere uma Estrutura de Aula Completa e Dinâmica. 
              Exigências Obrigatórias no JSON:
              - titulo (string).
              - objetivos (string[]).
              - topicos_principais (lista: { titulo: string, descricao: string }).
              - dinamica_engajamento (string: proposta de interação).
              - ferramenta_apoio (string: sugestão de IA ou software).`,
            "GERAR_ATIVIDADE_PRATICA": `Gere um Roteiro de Atividade Prática técnica/industrial. 
              Exigências Obrigatórias no JSON:
              - titulo_pratica (string).
              - materiais_necessarios (string[]).
              - segurança (objeto: { epis: string[], riscos: string[] }).
              - passos (lista: { ordem: number, descricao: string }).
              - criterios_sucesso (string[]).`,
            "GERAR_PLANO_AULA": `Gere um Plano de Aula Pedagógico SUPER DETALHADO E COMPLETO. 
              Exigências Obrigatórias no JSON:
              - titulo (string: Título atrativo).
              - cronograma_detalhado (lista de objetos: { tempo_minutos: number, fase: string, atividade: string, acao_professor: string, acao_aluno: string }).
              - recursos_educacionais (objeto: { materiais_fisicos: string[], ferramentas_digitais: string[], softwares_recomendados: string[], leituras: string[] }).
              - metodos_avaliacao (objeto: { diagnostica: { metodo: string, o_que_verificar: string }, formativa: { metodo: string, monitoramento: string }, somativa: { metodo: string, criterios_sucesso: string[] } }).
              - objetivos_aprendizagem (lista de strings baseados na Taxonomia de Bloom).
              - metodologia (string: ex: Metodologias Ativas, PBL).`,
            "GERAR_AULA_INVERTIDA": `Planeje uma estratégia de Aula Invertida (Flipped Classroom) completa e engajadora. 
              Exigências Obrigatórias no JSON:
              - tema_central (string).
              - pre_aula (objeto: { materiais_estudo: { tipo: "video" | "leitura" | "podcast", descricao: string, link_exemplo: string }[], desafio_verificacao: string }).
              - em_sala (objeto: { desafio_pratico: string, dinâmica_colaborativa: string, recursos_necessarios: string[] }).
              - consolidacao (string: atividade de fechamento e reflexão).`,
            "GERAR_ESTUDO_CASO": `Crie um Estudo de Caso Profissional baseado em cenários REAIS e complexos (Dilemas Éticos/Técnicos). 
              Exigências Obrigatórias no JSON:
              - titulo_caso (string).
              - contexto_real (descrição rica do cenário, empresa e mercado).
              - problema_central (detalhe a fundo da falha, conflito ou dilema técnico real).
              - dados_kpis (objeto detalhando indicadores impactados ou logs de erro).
              - perguntas_norteadoras (lista: 3 a 5 questões para Analisar, Avaliar ou Criar).
              - guia_professor (string: dicas para o professor orientar a discussão e resolução).`,
            "GERAR_RUBRICA": `Gere uma Rubrica de Avaliação por Competências de alto nível. 
              Exigências Obrigatórias no JSON:
              - criterios (lista: { nome: string, peso: number, niveis: { insuficiente: string, basico: string, pleno: string, avancado: string } }).`,
            "SUGERIR_INTERVENCAO": "Analise as lacunas e gere um roteiro de intervenção pedagógica personalizada."
        };

        const actionText = actionPrompts[action || ""] || "Auxilie na criação de conteúdos e planos pedagógicos.";

        const prompt = `
AÇÃO ESPECÍFICA: ${action}
ORIENTAÇÃO TÉCNICA: ${actionText}
OBJETIVO/TEMA SOLICITADO: "${command || "Geral"}"

DADOS DE ENTRADA:
${JSON.stringify(input, null, 2)}

CONTEXTO PEDAGÓGICO:
${JSON.stringify(context, null, 2)}

IMPORTANTE: 
1. Gere o conteúdo técnico detalhado conforme as REGRAS DE OURO e as Exigências de JSON fornecidas.
2. Formate a resposta OBRIGATORIAMENTE em JSON válido. O JSON principal deve conter os dados estruturados solicitados E um campo "response" com o texto formatado em Markdown para exibição.
Exemplo de Estrutura Esperada:
{
  "response": "# Plano de Aula... (markdown gerado formatado)",
  "data": { ... conteúdo estruturado aqui dentro conforme as exigências da AÇÃO ... }
}
`;

        const aiResponse = await callAI({ 
            systemPrompt: professorAgent.systemInstruction, 
            userPrompt: prompt,
            costMode: request.costMode || "normal",
            responseFormat: 'json'
        });
        
        let result: any = {};
        try {
            result = JSON.parse(aiResponse.text || '{}');
        } catch (e) {
            console.error("[ProfessorAgent] Failed to parse AI JSON:", e);
            result = { 
                response: aiResponse.text || "Desculpe, tive um problema ao formatar a resposta.",
                error: "Invalid JSON response"
            };
        }

        // Persistência das produções pedagógicas
        await db.collection('materiais_pedagogicos').add({
            ...result,
            criadoPor: context.userId,
            tipo: action,
            status: 'rascunho',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return result;
    }
};
