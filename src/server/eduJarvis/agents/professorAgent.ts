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
              Exigências Obrigatórias no JSON (campo 'data'):
              - titulo (string).
              - objetivos (string[]).
              - topicos_principais (lista: { titulo: string, descricao: string }).
              - dinamica_engajamento (string: proposta de interação).
              - ferramenta_apoio (string: sugestão de IA ou software).`,
            "GERAR_ATIVIDADE_PRATICA": `Gere um Roteiro de Atividade Prática técnica/industrial. 
              Exigências Obrigatórias no JSON (campo 'data'):
              - titulo_pratica (string).
              - materiais_necessarios (string[]).
              - segurança (objeto: { epis: string[], riscos: string[] }).
              - passos (lista: { ordem: number, descricao: string }).
              - criterios_sucesso (string[]).`,
            "GERAR_PLANO_AULA": `Gere um Plano de Aula Pedagógico de Alta Performance (Padrão Ultra). 
              Exigências Obrigatórias no JSON (campo 'data'):
              - titulo (string: Título atrativo).
              - cronograma (lista de objetos: { tempo: string, atividade: string, acao_professor: string, acao_aluno: string }).
              - recursos (objeto: { materiais_fisicos: string[], ferramentas_digitais: string[], softwares: string[] }).
              - avaliacao (objeto: { diagnostica: string, formativa: string, somativa: string }).
              - objetivos_aprendizagem (lista: string[] baseados na Taxonomia de Bloom).
              - metodologia (string: ex: PBL, Metodologias Ativas).`,
            "GERAR_AULA_INVERTIDA": `Planeje uma estratégia de Aula Invertida (Flipped Classroom) completa e engajadora. 
              Exigências Obrigatórias no JSON (campo 'data'):
              - tema_central (string).
              - pre_aula (objeto: { curadoria: { tipo: "video" | "leitura" | "podcast", descricao: string, link: string }[], atividade_verificacao: string }).
              - em_sala (objeto: { desafio_pbl: string, dinámica_grupo: string, recursos_necessarios: string[] }).
              - consolidacao (string: atividade de fechamento).`,
            "GERAR_ESTUDO_CASO": `Crie um Estudo de Caso Profissional baseado em cenários REAIS e complexos de mercado (Dilemas Éticos/Técnicos). 
              Exigências Obrigatórias no JSON (campo 'data'):
              - titulo_caso (string).
              - contexto_industrial (descrição rica do cenário e empresa).
              - problema_central (detalhe da falha, conflito ou dilema técnico).
              - dados_e_kpis (objeto: KPIs impactados ou logs de erro mockados).
              - perguntas_norteadoras (lista: 3 questões nível Bloom superior: Analisar/Criar).
              - guia_facilitador (string: dicas para o professor conduzzir a discussão).`,
            "GERAR_RUBRICA": `Gere uma Rubrica de Avaliação por Competências de alto nível. 
              Exigências Obrigatórias no JSON (campo 'data'):
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
