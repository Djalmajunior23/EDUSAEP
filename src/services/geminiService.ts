import { EduJarvis } from "./eduJarvisService";
import { AI_CONFIG } from "../ai-config";
import { toast } from "sonner";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { UserRole } from "../types";
import { normalizeImportError } from "../utils/normalizeImportError";
import { simpleRegexParser } from "../utils/simpleRegexParser";
import { safeArray, safeJoin } from "../utils/safeData";
import { z } from 'zod';


/**
 * Local Schema Types for documentation and compatibility without heavy SDK.
 */
export const SchemaType = {
  STRING: "string",
  NUMBER: "number",
  INTEGER: "integer",
  BOOLEAN: "boolean",
  ARRAY: "array",
  OBJECT: "object",
};
const Type = SchemaType;

/**
 * Converte o formato de contents da API do Gemini para uma string simples.
 */
function buildPromptString(params: any): string {
  if (typeof params === 'string') return params;
  
  let prompt = "";
  const systemInstruction = params.config?.systemInstruction;
  if (systemInstruction) {
    prompt += `[INSTRUÇÃO DO SISTEMA]\n${systemInstruction}\n\n`;
  }

  const contents = params.contents || params.prompt || params;
  
  if (typeof contents === 'string') {
    prompt += contents;
  } else if (Array.isArray(contents)) {
    prompt += contents.map((c: any) => {
      if (c.parts && Array.isArray(c.parts)) {
        return c.parts.map((p: any) => p.text).join('\n');
      }
      return c.text || JSON.stringify(c);
    }).join('\n');
  }

  return prompt;
}

/**
 * Retorna as instruções de sistema para cada módulo.
 */
export function getSystemInstruction(profile: UserRole | 'professor' | 'aluno', module: string): string {
  const isProfessor = profile === 'TEACHER' || profile === 'ADMIN' || profile === 'COORDINATOR' || profile === 'professor';
  return `Atue como um especialista em pedagogia e inteligência educacional. Perfil: ${profile}. Módulo: ${module}.`;
}

export async function generateContentWrapper(params: any): Promise<any> {
    const prompt = buildPromptString(params);
    const systemInstruction = params.config?.systemInstruction;
    const responseFormat = params.config?.responseMimeType === 'application/json' ? 'json' : 'text';
    const model = params.model;
    
    try {
      const response = await fetch('/api/ai/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction,
          responseFormat,
          model,
          task: 'generate_content',
          userId: auth.currentUser?.uid || 'anonymous',
          userRole: localStorage.getItem('user_role') || 'TEACHER'
        })
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status} da IA`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("[AI Generation proxy error]:", error);
      throw error;
    }
  }


export const DEFAULT_CONFIG = {
  temperature: 1.2,
  topK: 50,
  topP: 0.9,
};

/**
 * Helper para desembrulhar JSON quando a IA retorna um objeto contendo a resposta.
 */
function unwrapParsedJson(parsed: any): any {
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const keys = Object.keys(parsed);
    // Only unwrap if it's the only key and it's a known wrapper key
    if (keys.length === 1) {
      if (Array.isArray(parsed.questoes)) return parsed.questoes;
      if (Array.isArray(parsed.questions)) return parsed.questions;
      if (parsed.questao && typeof parsed.questao === 'object') return parsed.questao;
      if (parsed.question && typeof parsed.question === 'object') return parsed.question;
    }
  }
  return parsed;
}

/**
 * Utilitário para limpar e parsear JSON retornado pela IA.
 * Remove blocos de código markdown e tenta recuperar strings truncadas.
 */
export function safeParseJson(text: string | undefined, fallback: any = {}): any {
  if (!text) return fallback;
  
  let cleanJson = text.trim();
  
  // 1. Remove markdown code blocks if present
  cleanJson = cleanJson.replace(/^```[\w-]*\s*/i, '').replace(/```\s*$/, '').trim();
  
  try {
    return unwrapParsedJson(JSON.parse(cleanJson));
  } catch (initialError: any) {
    console.warn("[Gemini] First parse attempt failed, attempting to recover JSON...", initialError.message);
    
    // 2. Tenta extrair qualquer coisa que pareça um objeto ou array JSON
    let extractedJson = cleanJson;
    const jsonMatch = cleanJson.match(/(\[|\{)[\s\S]*(\]|\})/);
    if (jsonMatch) {
      extractedJson = jsonMatch[0];
      try {
        return unwrapParsedJson(JSON.parse(extractedJson));
      } catch (e) {
        // Se falhar, prossegue com o texto extraído para a tentativa de cura de truncamento
      }
    }

    // 3. Cura básica para respostas truncadas ou malformadas
    try {
      let healed = extractedJson;
      
      // Se parece truncado no meio de uma string
      if ((healed.match(/"/g) || []).length % 2 !== 0) {
        healed += '"';
      }
      
      // Balanceia chaves e colchetes
      const openBraces = (healed.match(/{/g) || []).length;
      const closeBraces = (healed.match(/}/g) || []).length;
      const openBrackets = (healed.match(/\[/g) || []).length;
      const closeBrackets = (healed.match(/\]/g) || []).length;
      
      healed += '}'.repeat(Math.max(0, openBraces - closeBraces));
      healed += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
      
      const parsed = JSON.parse(healed);
      return unwrapParsedJson(parsed);
      
    } catch (healError) {
      console.error("[Gemini] Erro crítico ao parsear JSON:", healError, "Texto original:", text);
      return fallback;
    }
  }
}

export async function generateQuestionVariation(originalQuestion: any, modelName: string = 'fast', userRole: UserRole | 'professor' | 'aluno' = 'TEACHER'): Promise<any> {
  const prompt = `
Aja como um especialista em avaliação educacional de alto nível.
Sua tarefa é criar uma VARIAÇÃO da questão fornecida.

REGRAS ESTABELECIDAS:
1. Mantenha o MESMO CONCEITO avaliado, a mesma habilidade cognitiva (Taxonomia de Bloom) e o mesmo nível de dificuldade.
2. Mude o CONTEXTO do problema (a história, o cenário ou o estudo de caso).
3. Se a questão for de exatas/cálculo, mude OBRIGATORIAMENTE os dados numéricos e a resposta matemática final de acordo com a nova história. Se não for cálculo, mude completamente os exemplos mencionados.
4. Mantenha a mesma quantidade de alternativas e preserve o mesmo formato.
5. Retorne os dados estritamente em um JSON estruturado.

QUESTÃO ORIGINAL:
Enunciado: ${originalQuestion.enunciado}
Competência Opcional: ${originalQuestion.competenciaNome || ''}
Alternativas: ${safeJoin(safeArray(originalQuestion.alternativas).map((a: any) => `${a.id}) ${a.texto}`), ' | ')}
Resposta Correta: ${originalQuestion.respostaCorreta}
Dificuldade: ${originalQuestion.dificuldade}

Seja criativo no contexto, garantindo que o candidato precise entender o conceito original para resolver e não apenas decorar.
  `;

  const response = await generateContentWrapper({
    model: modelName,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'banco_questoes'),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questionUid: { type: Type.STRING, description: "Um identificador unico e randomico" },
          competenciaNome: { type: Type.STRING },
          temaNome: { type: Type.STRING },
          dificuldade: { type: Type.STRING, enum: ["fácil", "médio", "difícil"] },
          bloom: { type: Type.STRING },
          enunciado: { type: Type.STRING, description: "O novo enunciado com contexto diferente." },
          alternativas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, enum: ["A", "B", "C", "D", "E"] },
                texto: { type: Type.STRING }
              },
              required: ["id", "texto"]
            }
          },
          respostaCorreta: { type: Type.STRING, enum: ["A", "B", "C", "D", "E"] },
          comentarioGabarito: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["enunciado", "alternativas", "respostaCorreta", "dificuldade", "competenciaNome"]
      }
    }
  });

  const parsed = safeParseJson(response.text, null);
  if (!parsed || !parsed.enunciado) {
    throw new Error("A IA retornou um formato inválido ao gerar a variação.");
  }
  return parsed;
}

export async function generateMultipleQuestionVariations(originalQuestion: any, count: number = 5, modelName: string = 'fast', userRole: UserRole | 'professor' | 'aluno' = 'TEACHER'): Promise<any[]> {
  const prompt = `
Aja como um especialista em avaliação educacional de alto nível.
Sua tarefa é criar ${count} VARIAÇÕES diferentes da questão fornecida.

REGRAS ESTABELECIDAS:
1. Mantenha o MESMO CONCEITO avaliado, a mesma habilidade cognitiva (Taxonomia de Bloom) e o mesmo nível de dificuldade.
2. Mude o CONTEXTO do problema (a história, o cenário ou o estudo de caso) em cada variação para que todas as ${count} sejam distintas entre si e distintas da original.
3. Se a questão for de exatas/cálculo, mude OBRIGATORIAMENTE os dados numéricos e a resposta matemática final em cada variação.
4. Mantenha a mesma quantidade de alternativas e preserve o mesmo formato para cada questão gerada.
5. Retorne os dados estritamente como um ARRAY JSON contendo as ${count} questões estruturadas.

QUESTÃO ORIGINAL:
Enunciado: ${originalQuestion.enunciado}
Competência Opcional: ${originalQuestion.competenciaNome || ''}
Alternativas: ${safeJoin(safeArray(originalQuestion.alternativas).map((a: any) => `${a.id}) ${a.texto}`), ' | ')}
Resposta Correta: ${originalQuestion.respostaCorreta}
Dificuldade: ${originalQuestion.dificuldade}

Seja criativo nos contextos, garantindo que o candidato precise entender o conceito original para resolver e não apenas decorar.
  `;

  const response = await generateContentWrapper({
    model: modelName,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'banco_questoes'),
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionUid: { type: Type.STRING, description: "Um identificador unico e randomico" },
            competenciaNome: { type: Type.STRING },
            temaNome: { type: Type.STRING },
            dificuldade: { type: Type.STRING, enum: ["fácil", "médio", "difícil"] },
            bloom: { type: Type.STRING },
            enunciado: { type: Type.STRING, description: "O novo enunciado com contexto diferente." },
            alternativas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, enum: ["A", "B", "C", "D", "E"] },
                  texto: { type: Type.STRING }
                },
                required: ["id", "texto"]
              }
            },
            respostaCorreta: { type: Type.STRING, enum: ["A", "B", "C", "D", "E"] },
            comentarioGabarito: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["enunciado", "alternativas", "respostaCorreta", "dificuldade", "competenciaNome"]
        }
      }
    }
  });

  const parsed = safeParseJson(response.text, []);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("A IA retornou um formato inválido ao gerar as variações.");
  }
  return parsed;
}

export async function parseQuestionsFromText(text: string, modelName: string = 'fast', userRole: UserRole | 'professor' | 'aluno' = 'TEACHER'): Promise<any[]> {
  // Split text into chunks of ~15,000 characters to avoid output token limits
  const chunkSize = 15000;
  const chunks: string[] = [];
  
  // Try to split by '---' if it exists (for CSV/Excel imports)
  if (text.includes('\n\n---\n\n')) {
    const items = text.split('\n\n---\n\n');
    let currentChunk = '';
    for (const item of items) {
      if ((currentChunk.length + item.length) > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = item;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n---\n\n${item}` : item;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
  } else {
    // Normal text chunking (try to split by lines/paragraphs)
    const paragraphs = text.split('\n\n');
    let currentChunk = '';
    for (const paragraph of paragraphs) {
      if ((currentChunk.length + paragraph.length) > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    
    // Fallback if still too large chunks (extremely rare with split)
    if (chunks.length === 0 && text.length > 0) {
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
      }
    }
  }

  const allQuestions: any[] = [];
  
  for (const chunk of chunks) {
    try {
      const response = await generateContentWrapper({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analise o texto abaixo e extraia todas as questões de múltipla escolha.
                O texto pode vir de um documento (PDF, DOCX, CSV ou Excel) e pode conter ruídos ou formatação irregular.
                2. Entre 4 a 5 alternativas (opções).
                3. O índice da alternativa correta (letra correspondente).
                4. A competência ou assunto da questão (se não houver, use 'Geral').
                5. O nível de dificuldade ('fácil', 'médio' ou 'difícil').
                6. Uma explicação detalhada da resposta correta (comentarioGabarito).
                7. Justificativas para cada alternativa (explicando por que estão certas ou erradas).
  
                Retorne APENAS um array JSON de objetos com a seguinte estrutura:
                [
                  {
                    "questionUid": "ID",
                    "competenciaNome": "Nome",
                    "dificuldade": "fácil" | "médio" | "difícil",
                    "bloom": "lembrar" | "compreender" | "aplicar" | "analisar" | "avaliar" | "criar",
                    "perfilGeracao": "${userRole}",
                    "tipoQuestao": "multipla_escolha",
                    "enunciado": "Enunciado...",
                    "alternativas": [
                      { "id": "A", "texto": "..." },
                      { "id": "B", "texto": "..." },
                      { "id": "C", "texto": "..." },
                      { "id": "D", "texto": "..." }
                    ],
                    "respostaCorreta": "A" | "B" | "C" | "D" | "E",
                    "comentarioGabarito": "Explicação...",
                    "justificativasAlternativas": { "A": "...", "B": "...", "C": "...", "D": "..." },
                    "tags": ["tag1", "tag2"],
                    "status": "rascunho"
                  }
                ]
  
                Texto para análise:
                ${chunk}`
              }
            ]
          }
        ],
        config: {
          systemInstruction: getSystemInstruction(userRole, 'banco_questoes'),
          responseMimeType: "application/json",
          ...DEFAULT_CONFIG
        }
      });
  
      const result = safeParseJson(response.text, []);
      if (Array.isArray(result) && result.length > 0) {
        allQuestions.push(...result);
      } else {
        console.warn("[Import] Resposta da IA vazia ou inválida, usando fallback manual.");
        allQuestions.push(...simpleRegexParser(chunk));
      }
    } catch (error) {
      console.error("[Import] Erro no bloco de importação IA:", error);
      toast.warning("A IA falhou em processar este bloco. Usando extração manual.");
      allQuestions.push(...simpleRegexParser(chunk));
    }
  }
  
  return allQuestions;
}

export interface DiagnosticResult {
  aluno: string;
  resumo_executivo?: string;
  summary: {
    total_questoes: number;
    acertos: number;
    acuracia_geral: number;
    acuracia_ponderada: number;
    alertas_dados: string[];
  };
  diagnostico_por_competencia: Array<{
    competencia: string;
    nivel: "Forte" | "Atenção" | "Crítico";
    total_questoes: number;
    acertos: number;
    acuracia: number;
    acuracia_ponderada: number;
    peso_na_uc?: string | number;
    gap_identificado?: string;
    distribuicao_bloom: Record<string, number>;
    conhecimentos_fracos: string[];
    recomendacoes: string;
    professor_feedback?: string;
    professor_nota?: number | string;
    private_notes?: string;
    questoes?: Array<{
      id: string | number;
      enunciado?: string;
      resposta_aluno: any;
      gabarito: any;
      acertou: boolean;
      analise_erro?: {
        categoria: 'Interpretação' | 'Conceito' | 'Atenção' | 'Lógica';
        explicacao_detalhada: string;
        sugestao_intervencao: string;
      };
      professor_feedback?: string;
      professor_nota?: number | string;
      private_notes?: string;
    }>;
  }>;
  plano_de_estudos_7_dias: Array<{
    dia: number;
    tema: string;
    atividades: string[];
    criterio_sucesso: string;
  }>;
  sugestao_intervencao?: Array<{
    tipo: string;
    descricao: string;
    esforço?: string;
  }>;
  acoes_para_o_instrutor: string[];
  metricas_para_dashboard: {
    competencias: string[];
    acuracias: number[];
    pesos: number[];
  };
  mensagem_para_o_aluno: string;
}

export async function generateInterventionPlan(classData: any, modelName: string = 'fast'): Promise<any> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Coordenador Pedagógico Especialista em Intervenção.
            Com base nos dados de desempenho da turma abaixo, crie um Plano de Intervenção Pedagógica detalhado.
            
            DADOS DA TURMA:
            ${JSON.stringify(classData)}
            
            O plano deve conter:
            1. Diagnóstico da Situação (Resumo dos principais gargalos)
            2. Estratégias de Recuperação (Ações imediatas para alunos em risco)
            3. Atividades Complementares Sugeridas (Por competência crítica)
            4. Cronograma de Aplicação (Sugestão de 4 semanas)
            
            RETORNE UM JSON COM A SEGUINTE ESTRUTURA:
            {
              "diagnostico": string,
              "estrategias": string[],
              "atividades": { "competencia": string, "sugestao": string }[],
              "cronograma": { "semana": number, "foco": string, "acoes": string[] }[]
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction('professor', 'smart_content'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export async function generateLearningPath(studentData: any, modelName: string = 'fast'): Promise<any> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Tutor de IA Especialista em Trilhas de Aprendizagem Personalizadas.
            Com base nos dados de desempenho do aluno abaixo, crie uma trilha de aprendizagem estruturada para os próximos 15 dias.
            
            DADOS DO ALUNO:
            ${JSON.stringify(studentData)}
            
            A trilha deve ser dividida em 3 fases:
            1. Fase de Nivelamento (Foco nas competências críticas)
            2. Fase de Consolidação (Foco nas competências em atenção)
            3. Fase de Excelência (Desafios avançados nas competências fortes)
            
            Para cada fase, forneça:
            - Objetivos de Aprendizagem
            - Lista de tópicos a estudar
            - Sugestões de atividades práticas
            - Recursos recomendados (vídeos, artigos, exercícios)
            
            RETORNE UM JSON COM A SEGUINTE ESTRUTURA:
            {
              "fases": [
                {
                  "nome": "Nivelamento",
                  "objetivos": string[],
                  "topicos": string[],
                  "atividades": string[],
                  "recursos": string[]
                }
              ],
              "mensagem_motivacional": string
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction('aluno', 'plano_estudo'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export async function generateRecoveryTrack(params: { studentId: string, competencyId: string, diagnosticData: any }, modelName: string = 'fast'): Promise<{ riskLevel: string, summary: string, activities: any[], interventions: string[] }> {
  const { studentId, competencyId, diagnosticData } = params;
  
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Tutor de IA Especialista em Intervenções Pedagógicas.
            Um aluno (ID: ${studentId}) apresentou dificuldades na competência (ID: ${competencyId}).
            
            DADOS DO DIAGNÓSTICO:
            ${JSON.stringify(diagnosticData)}
            
            Com base nisso, gere uma trilha de recuperação rápida contendo:
            1. Uma avaliação do risco de aprendizagem.
            2. Um plano de atividades extras personalizadas.
            3. Sugestões de intervenções para o professor realizar em sala.
            
            RETORNE UM JSON COM A SEGUINTE ESTRUTURA:
            {
              "riskLevel": "Baixo" | "Médio" | "Alto",
              "summary": "Resumo detalhado...",
              "activities": [{"competency": "...", "activityType": "...", "description": "..."}],
              "interventions": ["Sugestão 1", "Sugestão 2"]
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction('professor', 'smart_content'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, { 
    riskLevel: 'Médio', 
    summary: 'Trilha gerada automaticamente.', 
    activities: [], 
    interventions: [] 
  });
}

export interface TwinSimulationResult {
  overview: string;
  predictedPerformance: number;
  bottlenecks: string[];
  engagementConfidence: number;
  recommendations: string[];
  detailedProjections: Array<{
    competency: string;
    probabilityOfSuccess: number;
    commonStruggles: string;
  }>;
}

export async function simulateDigitalTwin(stats: any, scenario: string, modelName: string = 'fast'): Promise<TwinSimulationResult> {
  const prompt = `
    Aja como o "Gêmeo Digital Pedagógico" de uma turma do SAEP. 
    Sua função é SIMULAR o comportamento desta turma diante de um cenário específico e PREVER resultados e dificuldades.
    
    ESTATÍSTICAS DA TURMA:
    ${JSON.stringify(stats)}
    
    CENÁRIO DA SIMULAÇÃO:
    ${scenario}
    
    Analise como a turma (com base no histórico de acertos, riscos e competências críticas) reagiria a este cenário.
    
    RETORNE UM JSON COM A SEGUINTE ESTRUTURA:
    {
      "overview": "Texto resumindo o impacto geral previsto",
      "predictedPerformance": 75, // (0-100)
      "bottlenecks": ["lista de pontos onde a turma vai travar"],
      "engagementConfidence": 85, // (0-100)
      "recommendations": ["ações preventivas recomendadas"],
      "detailedProjections": [
        {
          "competency": "nome",
          "probabilityOfSuccess": 80,
          "commonStruggles": "por que terão dificuldade aqui"
        }
      ]
    }
  `;

  const response = await generateContentWrapper({
    model: modelName,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: getSystemInstruction('professor', 'smart_content'),
      responseMimeType: 'application/json',
      ...DEFAULT_CONFIG
    }
  });

  return safeParseJson(response.text, {
    overview: "Simulação indisponível no momento.",
    predictedPerformance: 0,
    bottlenecks: [],
    engagementConfidence: 0,
    recommendations: [],
    detailedProjections: []
  });
}

export async function generateDiagnostic(data: any[], modelName: string = 'fast', userRole: 'professor' | 'aluno' = 'professor'): Promise<DiagnosticResult[]> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Especialista em Diagnóstico Educacional por Competências (padrão SAEP).
Analise os seguintes dados brutos de um simulado e gere um diagnóstico completo para CADA aluno presente nos dados.

REGRAS DE CÁLCULO:
1) acertou: use campo "acertou" ou compare resposta_aluno == gabarito.
2) peso: use campo "peso" ou derive por bloom (Fácil=1.0; Médio=1.5; Difícil=2.0; Superdifícil=3.0). Se bloom ausente, peso=1.0.
3) Métricas: acuracia_geral = acertos/total; acuracia_ponderada = soma(acertou*peso)/soma(peso).
4) Classificação: Forte >= 0.75; Atenção 0.55..0.74; Crítico < 0.55.
5) Priorização: Ordene por menor acuracia_ponderada, maior peso, maior total_questoes.

DADOS:
${JSON.stringify(data)}

RETORNE UM ARRAY JSON DE OBJETOS, ONDE CADA OBJETO SEGUE O FORMATO:
{
  "aluno": "Nome do Aluno",
  "summary": {
    "total_questoes": number,
    "acertos": number,
    "acuracia_geral": number,
    "acuracia_ponderada": number,
    "alertas_dados": string[]
  },
  "diagnostico_por_competencia": [
    {
      "competencia": string,
      "nivel": "Forte" | "Atenção" | "Crítico",
      "total_questoes": number,
      "acertos": number,
      "acuracia": number,
      "acuracia_ponderada": number,
      "distribuicao_bloom": { "Fácil": number, "Médio": number, "Difícil": number },
      "conhecimentos_fracos": string[],
      "recomendacoes": string,
          "questoes": [
        {
          "id": string | number,
          "enunciado": string,
          "resposta_aluno": any,
          "gabarito": any,
          "acertou": boolean,
          "analise_erro": {
            "categoria": "Interpretação" | "Conceito" | "Atenção" | "Lógica",
            "explicacao_detalhada": "Análise pedagógica profunda e detalhada do processo cognitivo que levou ao erro (mínimo 2 frases, apenas se acertou for false)",
            "sugestao_intervencao": "Sugestão prática, clara e acionável para o professor intervir pedagogicamente (mínimo 2 frases, apenas se acertou for false)"
          }
        }
      ]
    }
  ],
  "plano_de_estudos_7_dias": [
    { "dia": number, "tema": string, "atividades": string[], "criterio_sucesso": string }
  ],
  "acoes_para_o_instrutor": string[],
  "metricas_para_dashboard": {
    "competencias": string[],
    "acuracias": number[],
    "pesos": number[]
  },
  "mensagem_para_o_aluno": string
}
`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            aluno: { type: Type.STRING },
            summary: {
              type: Type.OBJECT,
              properties: {
                total_questoes: { type: Type.NUMBER },
                acertos: { type: Type.NUMBER },
                acuracia_geral: { type: Type.NUMBER },
                acuracia_ponderada: { type: Type.NUMBER },
                alertas_dados: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["total_questoes", "acertos", "acuracia_geral", "acuracia_ponderada"]
            },
            diagnostico_por_competencia: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  competencia: { type: Type.STRING },
                  nivel: { type: Type.STRING },
                  total_questoes: { type: Type.NUMBER },
                  acertos: { type: Type.NUMBER },
                  acuracia: { type: Type.NUMBER },
                  acuracia_ponderada: { type: Type.NUMBER },
                  conhecimentos_fracos: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recomendacoes: { type: Type.STRING },
                  questoes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        enunciado: { type: Type.STRING },
                        resposta_aluno: { type: Type.STRING },
                        gabarito: { type: Type.STRING },
                        acertou: { type: Type.BOOLEAN },
                        analise_erro: {
                          type: Type.OBJECT,
                          properties: {
                            categoria: { type: Type.STRING },
                            explicacao_detalhada: { type: Type.STRING },
                            sugestao_intervencao: { type: Type.STRING }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            plano_de_estudos_7_dias: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dia: { type: Type.NUMBER },
                  tema: { type: Type.STRING },
                  atividades: { type: Type.ARRAY, items: { type: Type.STRING } },
                  criterio_sucesso: { type: Type.STRING }
                }
              }
            },
            acoes_para_o_instrutor: { type: Type.ARRAY, items: { type: Type.STRING } },
            metricas_para_dashboard: {
              type: Type.OBJECT,
              properties: {
                competencias: { type: Type.ARRAY, items: { type: Type.STRING } },
                acuracias: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                pesos: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              }
            },
            mensagem_para_o_aluno: { type: Type.STRING }
          },
          required: ["aluno", "summary", "diagnostico_por_competencia", "plano_de_estudos_7_dias", "acoes_para_o_instrutor", "metricas_para_dashboard", "mensagem_para_o_aluno"]
        }
      }
    }
  });

  const parsed = safeParseJson(response.text, []);
  return Array.isArray(parsed) ? parsed : [parsed];
}

export async function generateSuggestions(conhecimentos: string[], recomendacoes: string, modelName: string = 'fast', userRole: 'professor' | 'aluno' = 'aluno'): Promise<string[]> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Com base nos conhecimentos fracos: ${(conhecimentos || []).join(", ")} e nas recomendações: ${recomendacoes}, gere uma lista de 3 a 5 sugestões de estudo detalhadas, claras e acionáveis para um aluno.
            
            RETORNE APENAS UM ARRAY JSON DE STRINGS.`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'plano_estudo'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, []);
}

export interface LearningProfileResult {
  vark_style: "Visual" | "Aural" | "Read/Write" | "Kinesthetic" | "Multimodal";
  cognitive_level: string;
  behavioral_traits: string[];
  recommendations: string;
}

export async function classifyLearningProfile(behavioralData: any, modelName: string = 'fast', userRole: UserRole = 'STUDENT'): Promise<LearningProfileResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analise os seguintes dados de comportamento do aluno e classifique seu perfil de aprendizagem (VARK) e nível cognitivo.
            
            DADOS DE COMPORTAMENTO:
            ${JSON.stringify(behavioralData)}
            
            RETORNE UM JSON COM:
            {
              "vark_style": "Visual" | "Aural" | "Read/Write" | "Kinesthetic" | "Multimodal",
              "cognitive_level": string,
              "behavioral_traits": string[],
              "recommendations": string
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export interface AdvancedQuestionParams {
  topic: string;
  discipline: string;
  competency: string;
  level: 'fácil' | 'médio' | 'difícil';
  bloom: 'lembrar' | 'compreender' | 'aplicar' | 'analisar' | 'avaliar' | 'criar';
  type: 'multipla_escolha' | 'discursiva' | 'estudo_caso' | 'analitica';
  marketContextDescription?: string; // Optional specific context
  resourceDescription?: string; // Optional specific description for image/diagram
  caseStudyDescription?: string; // Optional specific case study description
  includeCode?: boolean;
  resourceTypes?: ('image' | 'diagram' | 'table' | 'code' | 'case_study')[]; // Modified to array
  includeCaseStudy?: boolean;
  language?: string;
  marketContext?: boolean;
  count?: number;
}

/**
 * Gera questões avançadas com suporte a múltiplos recursos (código, imagens, tabelas, etc.)
 */
export async function generateAdvancedQuestion(params: AdvancedQuestionParams, modelName: string = 'fast'): Promise<any[]> {
  const prompt = `
Aja como um Arquiteto de Software Sênior e Especialista em Avaliação Educacional.
Gere ${params.count || 1} questão(ões) do tipo "${params.type}" para a disciplina "${params.discipline}" sobre o tema "${params.topic}".

REQUISITOS TÉCNICOS:
- Competência: ${params.competency}
- Nível de Dificuldade: ${params.level}
- Taxonomia de Bloom: ${params.bloom}
- Contexto de Mercado: ${params.marketContext ? (params.marketContextDescription ? `OBRIGATÓRIO: Use especificamente este contexto: ${params.marketContextDescription}` : 'OBRIGATÓRIO: Crie um cenário profissional real e aplicável.') : 'Opcional'}
- Estudo de Caso: ${params.includeCaseStudy ? (params.caseStudyDescription ? `OBRIGATÓRIO: Estruture a questão como um Estudo de Caso focado em: ${params.caseStudyDescription}` : 'OBRIGATÓRIO: Estruture a questão como um Estudo de Caso completo.') : 'Opcional'}
${params.includeCode ? `- Incluir BLOCO DE CÓDIGO na linguagem: ${params.language || 'Pseudocódigo'}` : ''}
${params.resourceTypes && params.resourceTypes.length > 0 ? `- Incluir recursos visuais/formatos: ${params.resourceTypes.join(', ')}. ${params.resourceDescription ? `Detalhes específicos que devem aparecer: ${params.resourceDescription}` : ''}` : ''}

FORMATO DE RESPOSTA:
Retorne um ARRAY de objetos seguindo estritamente este esquema:
{
  "questionUid": "string",
  "tipoQuestao": "${params.type === 'discursiva' ? 'discursiva' : 'multipla_escolha'}",
  "enunciado": "Texto rico do enunciado",
  "assets": [
    {
      "id": "string",
      "type": "image | code | table | diagram | case_study",
      "content": "Conteúdo do recurso",
      "title": "Título do recurso",
      "caption": "Legenda pedagógica",
      "language": "lingua do código se aplicável"
    }
  ],
  "alternativas": [ {"id": "A", "texto": "...", "feedback": "..."} ],
  "respostaCorreta": "A",
  "respostaEsperada": "Para discursivas, o padrão de resposta",
  "rubricaAvaliacao": "Critérios de correção",
  "comentarioGabarito": "Explicação completa",
  "comentarioPedagogico": "Dica de estudo",
  "dificuldade": "${params.level}",
  "bloom": "${params.bloom}",
  "tags": ["lista", "de", "tags"],
  "tempoEstimado": number (segundos),
  "aiExplicabilidade": {
    "justificativaDificuldade": "Por que esta questão foi classificada como difícil?",
    "justificativaBloom": "Qual o motivo da classificação nesta taxonomia?",
    "analiseDistratores": "Motivo da sugestão de cada alternativa/distrator",
    "intencaoPedagogica": "Qual objetivo de aprendizagem esta questão visa atingir?"
  }
}
  `;

  const response = await generateContentWrapper({
    model: modelName,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: getSystemInstruction('professor', 'banco_questoes'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionUid: { type: Type.STRING },
            tipoQuestao: { type: Type.STRING, enum: ['multipla_escolha', 'discursiva', 'verdadeiro_falso', 'lacuna', 'ordenacao', 'associacao'] },
            enunciado: { type: Type.STRING },
            assets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['image', 'code', 'table', 'diagram', 'case_study'] },
                  content: { type: Type.STRING },
                  title: { type: Type.STRING },
                  caption: { type: Type.STRING },
                  language: { type: Type.STRING }
                },
                required: ['id', 'type', 'content']
              }
            },
            alternativas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  texto: { type: Type.STRING },
                  feedback: { type: Type.STRING }
                },
                required: ['id', 'texto']
              }
            },
            respostaCorreta: { type: Type.STRING },
            respostaEsperada: { type: Type.STRING },
            rubricaAvaliacao: { type: Type.STRING },
            comentarioGabarito: { type: Type.STRING },
            comentarioPedagogico: { type: Type.STRING },
            dificuldade: { type: Type.STRING },
            bloom: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            tempoEstimado: { type: Type.NUMBER },
            aiExplicabilidade: {
              type: Type.OBJECT,
              properties: {
                justificativaDificuldade: { type: Type.STRING },
                justificativaBloom: { type: Type.STRING },
                analiseDistratores: { type: Type.STRING },
                intencaoPedagogica: { type: Type.STRING }
              },
              required: ['justificativaDificuldade', 'justificativaBloom', 'analiseDistratores', 'intencaoPedagogica']
            }
          },
          required: ['enunciado', 'tipoQuestao', 'dificuldade', 'bloom', 'aiExplicabilidade']
        }
      }
    }
  });

  return safeParseJson(response.text, []);
}

export interface CognitiveErrorResult {
  errors: Array<{
    questionId: string;
    category: "Interpretação" | "Conceito" | "Atenção" | "Lógica";
    explanation: string;
    explicacao_detalhada: string;
    suggested_fix: string;
    sugestao_intervencao: string;
  }>;
}

export async function analyzeCognitiveErrors(submissionData: any, questions: any[], modelName: string = 'fast', userRole: 'professor' | 'aluno' = 'professor'): Promise<CognitiveErrorResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analise os erros cognitivos cometidos pelo aluno nesta submissão de simulado.
            
            DADOS DA SUBMISSÃO:
            ${JSON.stringify(submissionData)}
            
            QUESTÕES DO SIMULADO:
            ${JSON.stringify(questions)}
            
            Classifique cada erro estritamente em uma destas quatro categorias:
            1. 'conceitual': Lacunas teóricas ou falta de domínio do conteúdo base.
            2. 'interpretação': Erro ao traduzir o problema ou entender o comando da questão.
            3. 'distração': Erros bobos, leitura rápida ou falta de atenção aos detalhes.
            4. 'execução': O aluno sabe o conceito e interpretou bem, mas errou no processo de resolução ou cálculo.
            
            Para cada erro, forneça:
            - explicacao_detalhada: O que exatamente o aluno errou.
            - sugestao_intervencao: Uma correção específica e prática para esta categoria de erro.`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          errors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionId: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['conceitual', 'interpretação', 'distração', 'execução'] },
                explicacao_detalhada: { type: Type.STRING },
                sugestao_intervencao: { type: Type.STRING }
              },
              required: ['category', 'explicacao_detalhada', 'sugestao_intervencao']
            }
          }
        }
      }
    }
  });

  return safeParseJson(response.text, { errors: [] });
}

export interface QuestionAnalysisResult {
  diagnosticoEnunciado: string;
  sugestaoReformulacaoEnunciado: string;
  diagnosticoAlternativas: string;
  sugestaoReformulacaoAlternativas: Array<{id: string, textoAtual: string, novoTextoSugerido: string, justificativa: string}>;
  nivelAdequacao: 'Baixo' | 'Médio' | 'Alto';
}

export async function analyzeQuestionByPerformance(questionData: any, performanceStats: any, modelName: string = 'fast', userRole: 'professor' | 'aluno' = 'professor'): Promise<QuestionAnalysisResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analise a questão '${questionData.id}' com base nos dados de desempenho recentes dos alunos, focando nos erros cognitivos mais comuns (interpretação, conceito, atenção, lógica). 
            Sugira uma reformulação do enunciado ou das alternativas para melhorar a clareza e a precisão pedagógica.
            
            DADOS DA QUESTÃO:
            ${JSON.stringify(questionData)}
            
            ESTATÍSTICAS DE DESEMPENHO NA QUESTÃO:
            ${JSON.stringify(performanceStats)}
            
            RETORNE UM JSON COM A SEGUINTE ESTRUTURA:
            {
              "diagnosticoEnunciado": "Diagnóstico claro sobre o enunciado atual",
              "sugestaoReformulacaoEnunciado": "Novo enunciado sugerido, ou nulo se não houver necessidade",
              "diagnosticoAlternativas": "Diagnóstico claro sobre as alternativas atuais",
              "sugestaoReformulacaoAlternativas": [
                  {"id": "A", "textoAtual": "...", "novoTextoSugerido": "...", "justificativa": "..."}
              ],
              "nivelAdequacao": "Baixo" | "Médio" | "Alto"
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'banco_questoes'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {
    diagnosticoEnunciado: "Não foi possível analisar o enunciado.",
    sugestaoReformulacaoEnunciado: "",
    diagnosticoAlternativas: "Não foi possível analisar as alternativas.",
    sugestaoReformulacaoAlternativas: [],
    nivelAdequacao: "Médio"
  });
}

export interface SmartContentInput {
  tipo: 'questoes' | 'simulado' | 'plano_estudo' | 'explicacao' | 'analise_desempenho' | 'estudo_caso' | 'aula_invertida';
  perfil: UserRole | 'professor' | 'aluno';
  disciplina: string;
  competencias: string[];
  nivel: 'facil' | 'medio' | 'dificil';
  dados_desempenho?: Array<{
    competencia: string;
    acertos: number;
    erros: number;
  }>;
  historico?: {
    simulados_realizados: number;
    media_geral: number;
  };
  prompt: string;
}

/**
 * Gera conteúdo educacional inteligente baseado no input estruturado.
 */
export async function generateSmartContent(input: SmartContentInput, modelName: string = 'fast'): Promise<any> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: JSON.stringify(input)
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(input.perfil, 'smart_content'),
      responseMimeType: input.tipo === 'questoes' || input.tipo === 'simulado' ? "application/json" : "text/plain",
      ...DEFAULT_CONFIG,
    }
  });

  if (input.tipo === 'questoes' || input.tipo === 'simulado' || input.tipo === 'analise_desempenho') {
    return safeParseJson(response.text);
  }
  
  return response.text;
}

export interface RecoveryPlanResult {
  studentId: string;
  riskLevel: "Baixo" | "Médio" | "Alto";
  summary: string;
  recommendedActivities: Array<{
    competency: string;
    activityType: string;
    description: string;
  }>;
  professorInterventions: string[];
}

export async function generateRecoveryPlan(studentData: any, modelName: string = 'fast', userRole: 'professor' | 'aluno' = 'professor'): Promise<RecoveryPlanResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Com base nos erros cognitivos do aluno, gere um plano de recuperação individualizado.
            
            DADOS DO ALUNO E ERROS COGNITIVOS:
            ${JSON.stringify(studentData)}
            
            RETORNE UM JSON COM:
            {
              "studentId": string,
              "riskLevel": "Baixo" | "Médio" | "Alto",
              "summary": string,
              "recommendedActivities": [
                {
                  "competency": string,
                  "activityType": string,
                  "description": string
                }
              ],
              "professorInterventions": [string]
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'plano_estudo'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export interface LessonPlanResult {
  id?: string;
  title: string;
  objectives: string[];
  topicsToReview: string[];
  practicalActivities: Array<{
    name: string;
    description: string;
    duration: string;
    professor_notes?: string;
  }>;
  suggestedMaterials: string[];
  aiInsights: string;
}

export async function generateLessonPlan(classData: any, cognitiveAnalyses: any[] = [], modelName: string = 'fast', userRole: 'professor' | 'aluno' = 'professor'): Promise<LessonPlanResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Com base nos dados de desempenho da turma e nas análises de erros cognitivos, gere um plano de aula focado em remediar as dificuldades mais comuns.
            
            DADOS DA TURMA (Desempenho por competência):
            ${JSON.stringify(classData)}
            
            ANÁLISES DE ERROS COGNITIVOS DA TURMA:
            ${JSON.stringify(cognitiveAnalyses)}
            
            INSTRUÇÕES ADICIONAIS:
            1. Agrupe os erros cognitivos por competência.
            2. Priorize as competências com menor desempenho (identificadas nos dados da turma).
            3. Gere o plano de aula focado nessas competências críticas.
            
            RETORNE UM JSON COM:
            {
              "title": string,
              "objectives": [string],
              "topicsToReview": [string],
              "practicalActivities": [
                {
                  "name": string,
                  "description": string,
                  "duration": string
                }
              ],
              "suggestedMaterials": [string],
              "aiInsights": string
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'plano_estudo'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export interface PerformancePredictionResult {
  probabilityOfSuccess: number;
  riskLevel: "Baixo" | "Médio" | "Alto" | "Crítico";
  factors: string[];
  recommendations: string;
}

export async function predictPerformance(historicalData: any, modelName: string = 'fast', userRole: UserRole = 'ADMIN'): Promise<PerformancePredictionResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Com base no histórico de desempenho do aluno, preveja sua probabilidade de sucesso no exame oficial SAEP.
            
            HISTÓRICO:
            ${JSON.stringify(historicalData)}
            
            RETORNE UM JSON COM:
            {
              "probabilityOfSuccess": number (0-100),
              "riskLevel": "Baixo" | "Médio" | "Alto" | "Crítico",
              "factors": string[],
              "recommendations": string
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export interface ClassOrchestrationResult {
  tracks: Array<{
    groupName: string;
    studentCount: number;
    focusCompetency: string;
    activities: string[];
    riskLevel: string;
  }>;
  overallStrategy: string;
}

export async function generateClassRecoveryOrchestration(stats: any, modelName: string = 'fast'): Promise<ClassOrchestrationResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como o Motor de Orquestração Pedagógica do EDUAI CORE.
            Analise os dados da turma e gere trilhas de recuperação personalizadas para os grupos de risco.
            
            DADOS DA TURMA:
            ${JSON.stringify(stats)}
            
            RETORNE UM JSON COM:
            {
              "tracks": [
                {
                  "groupName": string,
                  "studentCount": number,
                  "focusCompetency": string,
                  "activities": string[],
                  "riskLevel": "Baixo" | "Médio" | "Alto" | "Crítico"
                }
              ],
              "overallStrategy": string
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction('professor', 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, { tracks: [], overallStrategy: "" });
}

export async function suggestCompetencies(questions: any[], modelName: string = 'fast', userRole: 'professor' | 'aluno' = 'professor'): Promise<string[]> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analise as seguintes questões e sugira uma competência pedagógica adequada para cada uma.
            Se a questão já tiver uma competência clara, retorne ela mesma.
            
            Questões:
            ${JSON.stringify(questions.map(q => q.text))}
            
            Retorne um array JSON com as competências sugeridas na mesma ordem das questões.
            `
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'banco_questoes'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        }
      }
    }
  });

  return safeParseJson(response.text, []);
}

export interface SIPAResult {
  projectedGrowth: number;
  timeToGoal: string;
  impactByGroup: Array<{
    group: string;
    before: number;
    after: number;
    delta: string;
  }>;
  confidenceScore: number;
  aiCommentary: string;
}

export async function generateSIPA(stats: any, intervention: string, modelName: string = 'fast'): Promise<SIPAResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como o Simulador de Impacto Pedagógico (SIPA) do EDUAI CORE.
            Simule o impacto da intervenção proposta com base nos dados atuais da turma.
            
            DADOS ATUAIS:
            ${JSON.stringify(stats)}
            
            INTERVENÇÃO PROPOSTA:
            ${intervention}
            
            RETORNE UM JSON COM:
            {
              "projectedGrowth": number (incremental em %),
              "timeToGoal": string (ex: "3 semanas"),
              "impactByGroup": [
                { "group": "Crítico", "before": number, "after": number, "delta": string },
                ...
              ],
              "confidenceScore": number (0-1),
              "aiCommentary": string
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction('professor', 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, { projectedGrowth: 0, timeToGoal: "", impactByGroup: [], confidenceScore: 0, aiCommentary: "" });
}

export interface GuessDetectionResult {
  isGuess: boolean;
  confidence: number;
  reason: string;
}

export async function detectGuessing(responseTime: number, difficulty: string, isCorrect: boolean, modelName: string = 'fast', userRole: UserRole = 'STUDENT'): Promise<GuessDetectionResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Determine se a resposta do aluno foi um "chute" (guess) com base no tempo de resposta e dificuldade da questão.
            
            TEMPO: ${responseTime}s
            DIFICULDADE: ${difficulty}
            ACERTOU: ${isCorrect}
            
            RETORNE UM JSON COM:
            {
              "isGuess": boolean,
              "confidence": number (0-1),
              "reason": string
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export interface SAEPQuestion {
  questionUid: string;
  competenciaId: string;
  competenciaNome: string;
  temaId: string;
  temaNome: string;
  dificuldade: "fácil" | "médio" | "difícil";
  bloom: string;
  perfilGeracao: string;
  tipoQuestao: string;
  enunciado: string;
  assets?: Array<{
    id: string;
    type: 'image' | 'code' | 'table' | 'diagram' | 'case_study';
    content: string;
    title?: string;
    caption?: string;
    language?: string;
  }>;
  alternativas: { id: string, texto: string }[];
  respostaCorreta: string;
  comentarioGabarito: string;
  justificativasAlternativas: Record<string, string>;
  contextoHash: string;
  tags: string[];
  status: string;
  revisadaPorProfessor: boolean;
  usoTotal: number;
  ultimaUtilizacao: any;
  origem: string;
  criadoEm: any;
  atualizadoEm: any;
}

export const SAEPQuestionSchema = z.object({
  questionUid: z.string(),
  competenciaId: z.string(),
  competenciaNome: z.string(),
  temaId: z.string(),
  temaNome: z.string(),
  dificuldade: z.enum(['fácil', 'médio', 'difícil']),
  bloom: z.string(),
  perfilGeracao: z.string(),
  tipoQuestao: z.string(),
  enunciado: z.string(),
  alternativas: z.array(z.object({
      id: z.string(),
      texto: z.string()
  })).min(2),
  respostaCorreta: z.string(),
  comentarioGabarito: z.string(),
  justificativasAlternativas: z.record(z.string(), z.string()),
  contextoHash: z.string(),
  tags: z.array(z.string()),
  status: z.string(),
  revisadaPorProfessor: z.boolean(),
  usoTotal: z.number(),
  ultimaUtilizacao: z.any().optional(),
  origem: z.string(),
  criadoEm: z.any(),
  atualizadoEm: z.any(),
  assets: z.array(z.object({
      id: z.string(),
      type: z.enum(['image', 'code', 'table', 'diagram', 'case_study']),
      content: z.string(),
      title: z.string().optional(),
      caption: z.string().optional(),
      language: z.string().optional()
  })).optional()
});

export async function generateSAEPQuestion(competency: string, difficulty: string, modelName: string = 'fast', userRole: 'professor' | 'aluno' = 'professor'): Promise<SAEPQuestion> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Especialista em Elaboração de Itens para o SAEP/SENAI.
            Gere uma questão inédita para a competência: "${competency}" com nível de dificuldade "${difficulty}".
            
            REQUISITOS:
            1. Siga o padrão de múltipla escolha (5 alternativas: A, B, C, D, E).
            2. Forneça justificativas para cada alternativa.
            3. Identifique o nível da Taxonomia de Bloom.
            4. A questão deve ser técnica e contextualizada (modelo SENAI).
            5. Gere um questionUid único seguindo o padrão COMPETENCIA-TEMA-DIFICULDADE-HASH.
            
            RETORNE O JSON COMPLETO CONFORME O PADRÃO FIRESTORE ESPECIFICADO NAS INSTRUÇÕES DO SISTEMA.`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'banco_questoes'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questionUid: { type: Type.STRING },
          competenciaId: { type: Type.STRING },
          competenciaNome: { type: Type.STRING },
          temaId: { type: Type.STRING },
          temaNome: { type: Type.STRING },
          dificuldade: { type: Type.STRING },
          bloom: { type: Type.STRING },
          perfilGeracao: { type: Type.STRING },
          tipoQuestao: { type: Type.STRING },
          enunciado: { type: Type.STRING },
          alternativas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                texto: { type: Type.STRING }
              },
              required: ["id", "texto"]
            }
          },
          respostaCorreta: { type: Type.STRING },
          comentarioGabarito: { type: Type.STRING },
          justificativasAlternativas: {
            type: Type.OBJECT,
            properties: {
              A: { type: Type.STRING },
              B: { type: Type.STRING },
              C: { type: Type.STRING },
              D: { type: Type.STRING },
              E: { type: Type.STRING }
            },
            required: ["A", "B", "C", "D", "E"]
          },
          contextoHash: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          status: { type: Type.STRING },
          revisadaPorProfessor: { type: Type.BOOLEAN },
          usoTotal: { type: Type.NUMBER },
          ultimaUtilizacao: { type: Type.STRING },
          origem: { type: Type.STRING },
          criadoEm: { type: Type.STRING },
          atualizadoEm: { type: Type.STRING }
        },
        required: [
          "questionUid", "competenciaId", "competenciaNome", "temaId", "temaNome", 
          "dificuldade", "bloom", "perfilGeracao", "tipoQuestao", "enunciado", 
          "alternativas", "respostaCorreta", "comentarioGabarito", 
          "justificativasAlternativas", "contextoHash", "tags", "status", 
          "revisadaPorProfessor", "usoTotal", "origem", "criadoEm", "atualizadoEm"
        ]
      }
    }
  });

  const rawData = safeParseJson(response.text, {});
  
  try {
    const validatedQuestion = SAEPQuestionSchema.parse(rawData);
    return validatedQuestion as SAEPQuestion;
  } catch (error) {
    console.error("[Gemini] Validation error:", error);
    if (error instanceof z.ZodError) {
        throw new Error(`Erro na validação da questão: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw new Error("A IA gerou uma questão em um formato inválido. Tente novamente.");
  }
}

export interface PedagogicalAnalysisResult {
  resumo_geral: string;
  pontos_fortes: string[];
  principais_dificuldades: string[];
  alunos_em_risco: string[];
  plano_de_acao: string[];
  sugestoes_para_professor: string[];
}

export async function generatePedagogicalAnalysis(data: any, modelName: string = 'fast', userRole: UserRole = 'TEACHER'): Promise<PedagogicalAnalysisResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Analista de BI Educacional Sênior.
            Analise os seguintes dados de importação (SIAC/Planilha) e gere um relatório pedagógico estratégico.
            
            DADOS:
            ${JSON.stringify(data)}
            
            RETORNE UM JSON COM:
            {
              "resumo_geral": string (Um parágrafo executivo sobre o desempenho global),
              "pontos_fortes": string[] (Lista de competências ou áreas onde os alunos se destacaram),
              "principais_dificuldades": string[] (Lista de lacunas críticas identificadas),
              "alunos_em_risco": string[] (Nomes ou IDs de alunos que precisam de atenção imediata),
              "plano_de_acao": string[] (Passos práticos para recuperação),
              "sugestoes_para_professor": string[] (Dicas didáticas específicas para abordar as falhas)
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {
    resumo_geral: "Erro ao gerar análise.",
    pontos_fortes: [],
    principais_dificuldades: [],
    alunos_em_risco: [],
    plano_de_acao: [],
    sugestoes_para_professor: []
  });
}

export interface BloomAnalysisResult {
  distribution: Record<string, number>;
  health_score: number;
  recommendations: string;
}

export async function analyzeBloomTaxonomy(questions: any[], modelName: string = 'fast', userRole: UserRole = 'TEACHER'): Promise<BloomAnalysisResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analise o equilíbrio pedagógico deste simulado com base na Taxonomia de Bloom.
            DADOS DAS QUESTÕES:
            ${JSON.stringify(questions)}
            
            RETORNE UM JSON COM:
            {
              "distribution": { "Lembrar": %, "Entender": %, "Aplicar": %, "Analisar": %, "Avaliar": %, "Criar": % },
              "health_score": number (0-100),
              "recommendations": string (Dicas para equilibrar o simulado)
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export interface OpenQuestionGrade {
  score: number;
  feedback: string;
  criteria_met: string[];
  missing_points: string[];
}

export interface OpenQuestionGrade {
  score: number;
  feedback: string;
  criteria_met: string[];
  missing_points: string[];
}

export async function gradeOpenQuestion(question: string, answer: string, rubric: string, modelName: string = 'fast', userRole: UserRole = 'TEACHER'): Promise<OpenQuestionGrade> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Corretor Inteligente do SENAI.
            Corrija a seguinte resposta aberta com base na rubrica fornecida.
            
            QUESTÃO: "${question}"
            RESPOSTA DO ALUNO: "${answer}"
            RUBRICA/CRITÉRIOS: "${rubric}"
            
            RETORNE UM JSON COM:
            {
              "score": number (0-10),
              "feedback": string (Explicação pedagógica),
              "criteria_met": string[],
              "missing_points": string[]
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'simulados'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export interface QuestionQualityAnalysis {
  questionId: string;
  originalEnunciado: string;
  suggestedEnunciado?: string;
  originalAlternativas: any[];
  suggestedAlternativas: any[];
  originalRespostaEsperada?: string;
  suggestedRespostaEsperada?: string;
  originalCriterios?: any[];
  suggestedCriterios?: any[];
  analysis: string;
  improvements: string[];
  cognitiveErrorsAddressed: string[];
}

export async function analyzeDiscursiveQuestionQuality(question: any, errors: any[], modelName: string = 'fast', userRole: UserRole = 'TEACHER'): Promise<QuestionQualityAnalysis> {
  try {
    const res = await EduJarvis.execute(`Analise a questão '${question.id}' com base em seu desempenho e sugira uma reformulação para melhorar a clareza e o poder de discriminação. Considere os erros mais comuns dos alunos.`, {
      context: {
        question,
        errors,
        isDiscursive: true
      },
      role: userRole
    });

    if (res.data) {
      return res.data as QuestionQualityAnalysis;
    }
    throw new Error("Resposta da IA inválida");
  } catch (error) {
    console.warn("EduJarvis API analysis fallback to mock due to error", error);
    return {
      questionId: question.id || question.questionUid,
      originalEnunciado: question.enunciado,
      originalCriterios: question.criteriosAvaliacao || [],
      suggestedCriterios: question.criteriosAvaliacao || [],
      originalAlternativas: [],
      suggestedAlternativas: [],
      analysis: "Não foi possível gerar análise. " + (error as any).message,
      improvements: [],
      cognitiveErrorsAddressed: []
    } as any;
  }
}

export async function analyzeQuestionQuality(question: any, errors: any[], modelName: string = 'fast', userRole: UserRole = 'TEACHER'): Promise<QuestionQualityAnalysis> {
  try {
    const res = await EduJarvis.execute(`Analise a questão '${question.id}' com base em seu desempenho e sugira uma reformulação para melhorar a clareza e o poder de discriminação. Considere os erros mais comuns dos alunos.`, {
      context: {
        question,
        errors,
        isDiscursive: false
      },
      role: userRole
    });

    if (res.data) {
      return res.data as QuestionQualityAnalysis;
    }
    throw new Error("Resposta da IA inválida");
  } catch (error) {
    console.warn("EduJarvis API analysis fallback to mock due to error", error);
    return {
      questionId: question.id || question.questionUid,
      originalEnunciado: question.enunciado,
      originalAlternativas: question.alternativas || [],
      suggestedAlternativas: question.alternativas || [],
      analysis: "Não foi possível gerar análise. " + (error as any).message,
      improvements: [],
      cognitiveErrorsAddressed: []
    } as any;
  }
}

export interface InterventionStrategyResult {
  title: string;
  critical_students: string[];
  main_gap: string;
  intervention_strategy: string;
  suggested_resources: string[];
  n8n_trigger_payload: any;
}

export async function generateInterventionStrategy(classData: any[], studentsAtRisk: any[], modelName: string = 'fast', userRole: 'professor' | 'aluno' = 'professor'): Promise<InterventionStrategyResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Você é um Especialista em Intervenção Pedagógica Automática (SIPA).
            Dados da Turma: ${JSON.stringify(classData)}
            Alunos em Risco: ${JSON.stringify(studentsAtRisk)}
            
            Com base nesses dados, gere uma estratégia de intervenção imediata.
            
            RETORNE UM JSON NO FORMATO:
            {
              "title": string,
              "critical_students": string[],
              "main_gap": string,
              "intervention_strategy": string,
              "suggested_resources": string[],
              "n8n_trigger_payload": {
                "action": string,
                "target": string,
                "priority": "low" | "medium" | "high"
              }
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'analise_desempenho'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  return safeParseJson(response.text, {});
}

export async function getNextAdaptiveQuestion(proficiency: number, competency: string, history: any[], modelName: string = 'fast', userRole: UserRole = 'STUDENT'): Promise<SAEPQuestion> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um motor de Teste Adaptativo Computadorizado (CAT) de alta performance.
            O aluno tem uma proficiência estimada de ${proficiency}/100 na competência "${competency}".
            Gere uma questão inédita (Padrão SAEP/SENAI) adequada para este nível.
            
            REGRAS DE CONTEÚDO:
            1. Se proficiência < 33: Nível FÁCIL (Conceitos básicos, identificação).
            2. Se proficiência 33-66: Nível MÉDIO (Aplicação, análise simples, contextualização técnica).
            3. Se proficiência > 66: Nível DIFÍCIL (Análise crítica, síntese, resolução de problemas complexos).
            4. INCLUA RECURSOS RICOS (assets) para níveis Médio e Difícil: Snippets de código, tabelas de dados ou descrições de cenários/estudos de caso.
            5. NÃO repita questões do histórico: ${JSON.stringify(history.map(h => h.enunciado).slice(-5))}.
            
            RETORNE O JSON COMPLETO NO FORMATO SAEPQuestion.`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'simulados'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questionUid: { type: Type.STRING },
          competenciaId: { type: Type.STRING },
          competenciaNome: { type: Type.STRING },
          temaId: { type: Type.STRING },
          temaNome: { type: Type.STRING },
          dificuldade: { type: Type.STRING, enum: ['fácil', 'médio', 'difícil'] },
          bloom: { type: Type.STRING },
          perfilGeracao: { type: Type.STRING },
          tipoQuestao: { type: Type.STRING },
          enunciado: { type: Type.STRING },
          assets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['image', 'code', 'table', 'diagram', 'case_study'] },
                content: { type: Type.STRING },
                title: { type: Type.STRING },
                caption: { type: Type.STRING },
                language: { type: Type.STRING }
              },
              required: ['id', 'type', 'content']
            }
          },
          alternativas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                texto: { type: Type.STRING }
              },
              required: ["id", "texto"]
            }
          },
          respostaCorreta: { type: Type.STRING },
          comentarioGabarito: { type: Type.STRING },
          justificativasAlternativas: {
            type: Type.OBJECT,
            properties: {
              A: { type: Type.STRING },
              B: { type: Type.STRING },
              C: { type: Type.STRING },
              D: { type: Type.STRING },
              E: { type: Type.STRING }
            },
            required: ["A", "B", "C", "D", "E"]
          },
          contextoHash: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          status: { type: Type.STRING },
          revisadaPorProfessor: { type: Type.BOOLEAN },
          usoTotal: { type: Type.NUMBER },
          ultimaUtilizacao: { type: Type.STRING },
          origem: { type: Type.STRING },
          criadoEm: { type: Type.STRING },
          atualizadoEm: { type: Type.STRING }
        },
        required: [
          "questionUid", "competenciaId", "competenciaNome", "temaId", "temaNome", 
          "dificuldade", "bloom", "perfilGeracao", "tipoQuestao", "enunciado", 
          "alternativas", "respostaCorreta", "comentarioGabarito", 
          "justificativasAlternativas", "contextoHash", "tags", "status", 
          "revisadaPorProfessor", "usoTotal", "origem", "criadoEm", "atualizadoEm"
        ]
      }
    }
  });

  const parsed = safeParseJson(response.text, {});
  
  if (!parsed || !parsed.enunciado || !Array.isArray(parsed.alternativas) || parsed.alternativas.length < 2) {
    console.error("[Gemini] Invalid question generated:", parsed);
    throw new Error("A IA gerou uma questão em um formato inválido. Tente novamente.");
  }
  
  return parsed;
}

export const DiscursiveQuestionSchema = z.object({
  questionUid: z.string(),
  competenciaNome: z.string(),
  enunciado: z.string(),
  respostaEsperada: z.string(),
  criteriosAvaliacao: z.array(z.string()),
  comentarioGabarito: z.string(),
  feedbackSugerido: z.string(),
  explicabilidadeIA: z.string(),
  dificuldade: z.enum(['fácil', 'médio', 'difícil']),
  bloom: z.string(),
});

export async function generateDiscursiveQuestion(
  prompt: string,
  difficulty: string,
  modelName: string = 'fast',
  userRole: UserRole = 'TEACHER',
  competency: string = ''
): Promise<any> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um especialista em avaliação educacional de alto nível (padrão SAEP/SENAI).
            Gere uma questão DISCURSIVA (aberta) profunda e técnica com base no seguinte prompt do professor: "${prompt}".
            
            ESPECIFICAÇÕES:
            - Nível de dificuldade: ${difficulty}.
            - Competência: "${competency || 'Lógica de Programação e Desenvolvimento'}".
            - Tipo: Discursiva.
            
            A questão deve incluir:
            1. Enunciado robusto com contextualização (pode incluir trechos de código se o tema permitir).
            2. Resposta Esperada (Ideal): Um exemplo de resposta perfeita que o aluno deveria fornecer.
            3. Critérios de Avaliação (Rubrica): Pelo menos 3 critérios claros com pontuação (ex: Identificação do problema - 30pts, Implementação da lógica - 40pts, Sintaxe e boas práticas - 30pts).
            4. Comentário do Gabarito: Uma explicação detalhada de porque a resposta ideal é a correta e o que se espera que o aluno demonstre.
            5. Feedback Sugerido: Um campo com a sugestão de feedback do professor para o aluno.
            6. Explicabilidade da IA: Justificativa pedagógica para o nível de Bloom e dificuldade.
            
            RETORNE O JSON COMPLETO NO FORMATO SOLICITADO.`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction(userRole, 'simulados'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  const rawData = safeParseJson(response.text, {});
  
  try {
    const validatedQuestion = DiscursiveQuestionSchema.parse(rawData);
    return validatedQuestion;
  } catch (error) {
    console.error("[Gemini] Validation error:", error);
    if (error instanceof z.ZodError) {
        throw new Error(`Erro na validação da questão discursiva: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw new Error("A IA gerou uma questão discursiva em um formato inválido. Tente novamente.");
  }
}

export async function validateAndImproveQuestion(
  question: any,
  targetCompetency: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<any> {
  const prompt = `Como um Auditor Pedagógico Especialista, analise a seguinte questão discursiva em relação à:
  1. Clareza do enunciado.
  2. Relevância pedagógica.
  3. Alinhamento com a competência alvo: "${targetCompetency}".
  
  QUESTÃO:
  ${JSON.stringify(question, null, 2)}
  
  FORCE A ANÁLISE SOBRE:
  - O enunciado está ambíguo?
  - Os critérios de avaliação são justos e cobrem o que é pedido?
  - A resposta esperada está correta e completa?
  
  FORNEÇA:
  - Um status de validação (aprovado, aprovado_com_ressalvas, reprovado).
  - Um feedback detalhado.
  - Sugestões específicas de melhoria para o enunciado, resposta esperada ou critérios.
  - Uma VERSÃO MELHORADA da questão se necessário.
  
  RETORNE APENAS UM JSON NO FORMATO:
  {
    "status": "aprovado" | "ressalvas" | "melhorar",
    "feedback": "...",
    "sugestoes": ["...", "..."],
    "improvedQuestion": { ...mesma estrutura da questão original mas com melhorias... }
  }`;

  const response = await generateContentWrapper({
    model: modelName,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: getSystemInstruction('professor', 'smart_content'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG
    }
  });

  return safeParseJson(response.text, {});
}

export async function generateStudyPlan(data: any, modelName: string = "gemini-1.5-flash"): Promise<any> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Especialista em Aprendizagem Adaptativa.
            Com base no histórico de desempenho abaixo, crie um plano de estudos focado em melhoria contínua.
            
            DADOS:
            ${JSON.stringify(data)}
            
            O plano deve conter:
            1. Tópicos prioritários (com justificativa)
            2. Recomendações de estudo
            3. Metas de curto prazo
            4. Explicação (Justificativa pedagógica da IA para transparência)
            
            RETORNE UM JSON COM A SEGUINTE ESTRUTURA:
            {
              "priorityTopics": [{ "topic": string, "reason": string }],
              "recommendations": string[],
              "goals": string[],
              "explanation": "string"
            }`
          }
        ]
      }
    ],
    config: {
      systemInstruction: getSystemInstruction('aluno', 'plano_estudo'),
      responseMimeType: "application/json",
      ...DEFAULT_CONFIG,
    }
  });

  const result = safeParseJson(response.text, {
    priorityTopics: [],
    recommendations: ["Revisar conteúdos básicos"],
    goals: ["Aumentar acurácia geral"],
    explanation: "Recomendação baseada no histórico de desempenho e gaps de competência detectados."
  });

  // Log explanation for transparency (Module 4)
  if (result.explanation) {
    try {
      await addDoc(collection(db, 'ai_explanations'), {
        targetId: data.studentId || 'unknown',
        reasoning: result.explanation,
        dataUsed: ['exam_submissions', 'performance_stats'],
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to log explanation", e);
    }
  }

  return result;
}

// ============================================================================
// NOVEL INNOVATION AI MODULES (20 NEW FEATURES)
// ============================================================================

// Módulo 4: Explicação Contrária (Ensinar através do erro)
export async function generateContraryExplanation(questionText: string, incorrectAnswer: string) {
  const prompt = `Aja como um Tutor Socrático. O aluno escolheu a alternativa incorreta para a seguinte questão:
  
  QUESTÃO: ${questionText}
  RESPOSTA INCORRETA DADA: ${incorrectAnswer}
  
  Sua tarefa é usar a ESTRATÉGIA DA EXPLICAÇÃO CONTRÁRIA:
  1. Identifique o erro conceitual que leva a escolher essa alternativa.
  2. Prove por que esse raciocínio resulta num absurdo ou numa contradição lógica/histórica/científica.
  3. Convide o aluno a refazer o pensamento.
  Não dê a resposta certa diretamente.
  
  Retorne um JSON: { "explanation": "string", "cognitiveTrapDetected": "string" }`;

  const response = await generateContentWrapper({
    model: "gemini-1.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0.2 }
  });

  return safeParseJson(response.text, { explanation: "Infelizmente parece que houve um conflito." });
}

// Módulo 18: ABP Automatizada (Aprendizagem Baseada em Projetos)
export async function generateAutomatedPBL(competenciesCovered: string[], context: string) {
  const prompt = `Aja como Desenvolvedor Curricular Avançado. Crie um Projeto de Aprendizagem (ABP / PBL) de aplicação no mundo real para ensino médio/fundamental usando estas competências: ${(competenciesCovered || []).join(', ')} e o contexto: ${context}
  
  RETORNE JSON:
  {
    "title": "Título Atrativo do Projeto",
    "scenario": "Cenário contextual do mundo real",
    "problemStatement": "Qual é o problema central a ser resolvido pelos alunos?",
    "steps": ["Etapa 1", "Etapa 2"],
    "evaluationRubric": [
      { "criteria": "Nome do critério", "weight": "Peso em inteiros" }
    ],
    "complexityLevel": "avancado"
  }`;

  const response = await generateContentWrapper({
    model: "gemini-1.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0.7 }
  });

  return safeParseJson(response.text, { title: "Projeto não gerado." });
}

// Módulo 3: Conflito Cognitivo
export async function generateCognitiveConflictScenario(topic: string) {
    const prompt = `Aja como Tutor do EDUAI CORE. Para testar o aprendizado profundo do aluno no tema '${topic}', gere um cenário de CONFLITO COGNITIVO. 
    Apresente uma afirmação aparentemente verdadeira e lógica baseada no senso comum, mas que é falha cientificamente/historicamente, e peça para ele encontrar o "furo na matriz" do seu argumento, com 4 alternativas.
    
    RETORNE JSON: { "scenario": "texto", "apparentTruth": "texto ilusório", "alternatives": ["A","B","C","D"], "correctOptionIndex": number, "explanationIfWrong": "string" }`;
  
    const response = await generateContentWrapper({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", temperature: 0.5 }
    });
  
    return safeParseJson(response.text, null);
  }

