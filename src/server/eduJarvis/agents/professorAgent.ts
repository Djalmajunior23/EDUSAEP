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
        const { action, input } = request;
        
        const actionPrompts: Record<string, string> = {
            "GERAR_AULA": "Gere uma estrutura de aula completa com objetivos de aprendizagem claros, conteúdo técnico robusto e dinâmica de participação.",
            "GERAR_ATIVIDADE_PRATICA": "Gere uma atividade prática técnica industrial. Inclua roteiro detalhado, normas de segurança (EPIs/EPCs) e checklist de conformidade.",
            "GERAR_PLANO_AULA": `Gere um Plano de Aula Pedagógico de Alta Performance (Padrão SENAI/SAEP). 
              Exigências Obrigatórias no JSON:
              - cronograma_detalhado (minuto a minuto com descrição da ação do professor e do aluno).
              - recursos_necessarios (lista exaustiva de equipamentos, insumos e softwares).
              - metodologia_aplicada (ex: PBL, Sala Invertida, Gamificação).
              - plano_avaliacao (detalhar os 3 tipos: Diagnóstica, Formativa e Somativa com critérios de êxito).`,
            "GERAR_AULA_INVERTIDA": `Planeje uma estratégia de Aula Invertida completa e engajadora. 
              Exigências Obrigatórias no JSON:
              - materiais_pre_aula (curadoria técnica: vídeos, artigos, simuladores).
              - guia_estudo_autonomo (perguntas para o aluno responder antes da aula).
              - desafio_em_sala (situação-problema complexa para trabalho em grupo).
              - recursos_sala (o que o professor precisa preparar para o desafio).`,
            "GERAR_ESTUDO_CASO": `Crie um Estudo de Caso Profissional baseado em cenários reais de mercado. 
              Exigências Obrigatórias no JSON:
              - titulo_caso (atrativo e técnico).
              - contexto_industrial (descrição do setor, empresa fictícia e cenário de crise/problema).
              - dados_tecnicos (KPIs, logs de erro, variações financeiras ou falhas de segurança).
              - problema_central (o dilema que deve ser resolvido).
              - perguntas_desafio (3 questões complexas nível Bloom superior).`,
            "GERAR_RUBRICA": "Gere uma Rubrica de Avaliação por Competências. Níveis: Insuficiente, Básico, Pleno, Avançado. Detalhe indicadores de desempenho.",
            "SUGERIR_INTERVENCAO": "Analise as lacunas e gere um roteiro de intervenção pedagógica personalizada, focando em reforço de conceitos e novas dinâmicas."
        };

        const actionText = actionPrompts[action || ""] || "Auxilie na criação de conteúdos e planos pedagógicos.";

        const prompt = `
AÇÃO ESPECÍFICA: ${action}
ORIENTAÇÃO TÉCNICA: ${actionText}

DADOS DE ENTRADA:
${JSON.stringify(input, null, 2)}

CONTEXTO PEDAGÓGICO:
${JSON.stringify(context, null, 2)}

IMPORTANTE: 
1. Gere o conteúdo técnico detalhado conforme as REGRAS DE OURO.
2. No JSON de retorno, inclua obrigatoriamente um campo "response" contendo a versão formatada em Markdown elegante de todo o material gerado (para exibição direta ao usuário).
3. Inclua também os campos estruturados (ex: cronograma_detalhado, recursos, etc) para processamento via sistema.

RETORNE APENAS O JSON ESTRUTURADO.
`;

        const aiResponse = await callAI({ 
            systemPrompt: professorAgent.systemInstruction, 
            userPrompt: prompt,
            costMode: request.costMode || "normal",
            responseFormat: 'json'
        });
        const result = JSON.parse(aiResponse.text);

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
