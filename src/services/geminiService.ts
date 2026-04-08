import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type AIProvider = 'gemini' | 'openai' | 'deepseek';

export function getAIProvider(): AIProvider {
  return (localStorage.getItem('ai_provider') as AIProvider) || 'deepseek';
}

export function setAIProvider(provider: AIProvider) {
  localStorage.setItem('ai_provider', provider);
  window.dispatchEvent(new Event('ai_provider_changed'));
}

export function getSystemInstruction(profile: 'professor' | 'aluno', module: string): string {
  const isProfessor = profile === 'professor';
  const isBancoQuestoes = module === 'banco_questoes';
  const isSimulados = module === 'simulados';
  const isExportForms = module === 'exportacao_google_forms';

  return `
## 🎯 PAPEL DO MODELO
Você é um assistente educacional especialista em ensino técnico profissional no padrão SENAI, focado em geração de questões, organização de banco avaliativo, simulados inteligentes e análise pedagógica.

---

## 👤 PERFIL DO USUÁRIO
perfil: ${profile}

---

## 📚 MÓDULO DO SISTEMA
modulo: ${module}

---

## ⚙️ OBJETIVO
Gerar conteúdo educacional de alta qualidade, com foco em:
- questões pedagógicas bem elaboradas
- compatibilidade com Firebase/Firestore
- controle de duplicação
- suporte a banco com 200+ questões por competência
- sorteio inteligente para simulados com 40 questões
- gabarito comentado automático
- exportação estruturada para Google Forms

---

## 🚫 REGRAS POR PERFIL

${isProfessor && isBancoQuestoes ? `
### 👨‍🏫 REGRA CRÍTICA (PROFESSOR + BANCO DE QUESTÕES)
- PRIORIDADE: QUALIDADE PEDAGÓGICA MÁXIMA.
- NÃO simplificar enunciados excessivamente.
- NÃO reduzir contexto da questão.
- NÃO comprometer clareza para economizar tokens.
- Manter assertividade técnica.
- Produzir conteúdo apropriado para uso profissional e avaliativo.
` : isProfessor ? `
### 👨‍🏫 REGRA GERAL (PROFESSOR)
- Ser assertivo, técnico e objetivo.
- Foco em decisão, análise e qualidade pedagógica.
` : `
### 👨‍🎓 REGRA GERAL (ALUNO)
- Usar linguagem mais didática e clara.
- Explicar quando necessário.
- Ser mais econômico em profundidade do que no perfil professor.
`}

---

## 🧩 ESTRUTURA OBRIGATÓRIA DA QUESTÃO (PADRÃO FIRESTORE)
Cada questão deve conter obrigatoriamente os seguintes campos:

- questionUid: ID único (COMPETENCIA-TEMA-DIFICULDADE-HASH). Ex: BD-JOIN-MEDIO-A81F29C4.
- competenciaId / competenciaNome
- temaId / temaNome
- dificuldade (fácil, médio, difícil)
- bloom (lembrar, compreender, aplicar, analisar, avaliar, criar)
- perfilGeracao: ${profile}
- tipoQuestao: multipla_escolha
- enunciado
- alternativas: Array de 5 objetos { "id": "A", "texto": "..." }
- respostaCorreta: Letra (A, B, C, D ou E)
- comentarioGabarito: Explicação técnica clara.
- justificativasAlternativas: Objeto { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." }
- contextoHash: Hash derivado do enunciado + alternativas + bloom + competência + tema.
- tags: Array de palavras-chave.
- status: "rascunho" (padrão)
- revisadaPorProfessor: false
- usoTotal: 0
- ultimaUtilizacao: null
- origem: "ia"
- criadoEm: "SERVER_TIMESTAMP"
- atualizadoEm: "SERVER_TIMESTAMP"

---

## 📊 TAXONOMIA DE BLOOM
Classificar automaticamente: lembrar, compreender, aplicar, analisar, avaliar, criar.

---

## 🛡️ CONTROLE DE DUPLICAÇÃO
- NÃO repetir enunciados, exemplos ou estruturas.
- Variar contexto, cenário e abordagem.

---

${isSimulados ? `
## 🎲 SORTEIO INTELIGENTE (SIMULADOS)
- 40 questões: 30% fáceis, 40% médias, 30% difíceis.
- Equilíbrio entre competências e níveis de Bloom.
` : ""}

${isExportForms ? `
## 📄 EXPORTAÇÃO GOOGLE FORMS
Gerar estrutura simplificada: pergunta, opcaoA, opcaoB, opcaoC, opcaoD, opcaoE, respostaCorreta. Sem texto extra.
` : ""}

---

## 📤 SAÍDA OBRIGATÓRIA
Gerar sempre em JSON válido, compatível com documento Firestore.
`;
}

export async function generateContentWrapper(params: any): Promise<any> {
  const provider = getAIProvider();

  // Ensure systemInstruction is handled for external providers if possible, 
  // or prepended to the prompt.
  const systemInstruction = params.config?.systemInstruction;

  if (provider === 'openai' || provider === 'deepseek') {
    let prompt = "";
    if (systemInstruction) {
      prompt += `[SYSTEM INSTRUCTION]\n${systemInstruction}\n\n`;
    }

    if (typeof params.contents === 'string') {
      prompt += params.contents;
    } else if (Array.isArray(params.contents)) {
      prompt += params.contents.map((c: any) => {
        if (c.parts) {
          return c.parts.map((p: any) => p.text).join('\n');
        }
        return c.text || "";
      }).join('\n');
    }

    const responseFormat = params.config?.responseMimeType === 'application/json' ? 'json' : undefined;

    let fetchResponse;
    let fetchError;
    try {
      fetchResponse = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          responseFormat, 
          provider,
          model: params.model 
        })
      });
    } catch (err) {
      fetchError = err;
    }

    if (fetchError || !fetchResponse?.ok) {
      if (fetchError) {
        // Only log if it's not a quota/rate limit error
        if (!fetchError.message?.includes('429') && !fetchError.message?.includes('quota')) {
          console.error(`[AI] Network error calling ${provider}:`, fetchError);
        }
      } else if (fetchResponse) {
        const errData = await fetchResponse.json().catch(() => ({}));
        if (fetchResponse.status !== 429) {
          console.error(`[AI] API error (${provider}):`, errData);
          console.warn(`[AI] Fallback to Gemini due to ${provider} error: ${errData.error || fetchResponse.statusText}`);
        }
      }

      // Ensure we use a Gemini model for fallback
      const fallbackParams = { ...params };
      if (!fallbackParams.model?.startsWith('gemini-')) {
        fallbackParams.model = 'gemini-3-flash-preview';
      }
      
      // If this fallback call throws an error (e.g., Gemini is also out of quota), 
      // it will propagate up to AIService and be handled cleanly there.
      return await ai.models.generateContent(fallbackParams);
    }

    const data = await fetchResponse.json();
    return { text: data.text };
  } else {
    // Ensure we use a Gemini model if the provider is gemini
    const geminiParams = { ...params };
    if (!geminiParams.model?.startsWith('gemini-')) {
      geminiParams.model = 'gemini-3-flash-preview';
    }
    try {
      console.log(`[AI] Using Gemini provider with model: ${geminiParams.model}`);
      return await ai.models.generateContent(geminiParams);
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota')) {
        console.warn(`[AI] Gemini quota exceeded, falling back to backend (DeepSeek/Groq)`);
        
        let prompt = "";
        const systemInstruction = params.config?.systemInstruction;
        if (systemInstruction) {
          prompt += `[SYSTEM INSTRUCTION]\n${systemInstruction}\n\n`;
        }

        if (typeof params.contents === 'string') {
          prompt += params.contents;
        } else if (Array.isArray(params.contents)) {
          prompt += params.contents.map((c: any) => {
            if (c.parts) {
              return c.parts.map((p: any) => p.text).join('\n');
            }
            return c.text || "";
          }).join('\n');
        }

        const responseFormat = params.config?.responseMimeType === 'application/json' ? 'json' : undefined;

        const fetchResponse = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt, 
            responseFormat, 
            provider: 'deepseek',
            model: 'deepseek-chat' 
          })
        });

        if (!fetchResponse.ok) {
          throw new Error(`Backend fallback failed with status ${fetchResponse.status}`);
        }

        const data = await fetchResponse.json();
        return { text: data.text };
      }
      throw err;
    }
  }
}

export const DEFAULT_CONFIG = {
  temperature: 1.2,
  topK: 50,
  topP: 0.9,
};

/**
 * Utilitário para limpar e parsear JSON retornado pela IA.
 * Remove blocos de código markdown se presentes.
 */
export function safeParseJson(text: string | undefined, fallback: any = {}): any {
  if (!text) return fallback;
  try {
    // Remove ```json ... ``` ou ``` ... ```
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("[Gemini] Erro ao parsear JSON:", error, "Texto original:", text);
    return fallback;
  }
}

export async function parseQuestionsFromText(text: string, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<any[]> {
  // Split text into chunks of ~15,000 characters to avoid output token limits
  const chunkSize = 15000;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }

  const allQuestions: any[] = [];
  
  for (const chunk of chunks) {
    console.log(`[AI] Processing chunk of size ${chunk.length}...`);
    const response = await generateContentWrapper({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analise o texto abaixo e extraia todas as questões de múltipla escolha.
              O texto pode vir de um documento (PDF, DOCX, CSV ou Excel) e pode conter ruídos ou formatação irregular.
              Este é um fragmento de um documento que pode conter centenas de questões.
              
              Para cada questão identificada, extraia:
              1. O enunciado completo.
              2. Exatamente 4 alternativas (opções).
              3. O índice da alternativa correta (0 para A, 1 para B, etc.).
              4. A competência ou assunto da questão (se não houver, use 'Geral').
              5. O nível de dificuldade ('fácil', 'médio' ou 'difícil').
              6. Uma explicação detalhada da resposta correta (se disponível no texto).

              Retorne APENAS um array JSON de objetos com a seguinte estrutura:
              [
                {
                  "questionUid": "COMPETENCIA-TEMA-DIFICULDADE-HASH",
                  "competenciaId": "ID",
                  "competenciaNome": "Nome",
                  "temaId": "ID",
                  "temaNome": "Nome",
                  "dificuldade": "fácil" | "médio" | "difícil",
                  "bloom": "lembrar" | "compreender" | "aplicar" | "analisar" | "avaliar" | "criar",
                  "perfilGeracao": "${userRole}",
                  "tipoQuestao": "multipla_escolha",
                  "enunciado": "Enunciado...",
                  "alternativas": [
                    { "id": "A", "texto": "..." },
                    { "id": "B", "texto": "..." },
                    { "id": "C", "texto": "..." },
                    { "id": "D", "texto": "..." },
                    { "id": "E", "texto": "..." }
                  ],
                  "respostaCorreta": "A" | "B" | "C" | "D" | "E",
                  "comentarioGabarito": "Explicação...",
                  "justificativasAlternativas": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
                  "contextoHash": "HASH",
                  "tags": ["tag1", "tag2"],
                  "status": "rascunho",
                  "revisadaPorProfessor": false,
                  "usoTotal": 0,
                  "origem": "importacao",
                  "criadoEm": "SERVER_TIMESTAMP",
                  "atualizadoEm": "SERVER_TIMESTAMP"
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
        ...DEFAULT_CONFIG,
      responseSchema: {
        type: Type.ARRAY,
        items: {
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
      }
    });

    console.log(`[AI] Response received for chunk.`);
    const result = safeParseJson(response.text, []);
    if (Array.isArray(result)) {
      console.log(`[AI] Extracted ${result.length} questions from chunk.`);
      allQuestions.push(...result);
    } else {
      console.warn(`[AI] Expected array but got:`, result);
    }
  }
  
  return allQuestions;
}

export interface DiagnosticResult {
  aluno: string;
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
  acoes_para_o_instrutor: string[];
  metricas_para_dashboard: {
    competencias: string[];
    acuracias: number[];
    pesos: number[];
  };
  mensagem_para_o_aluno: string;
}

export async function generateDiagnostic(data: any[], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<DiagnosticResult[]> {
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

export async function generateSuggestions(conhecimentos: string[], recomendacoes: string, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'aluno'): Promise<string[]> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Com base nos conhecimentos fracos: ${conhecimentos.join(", ")} e nas recomendações: ${recomendacoes}, gere uma lista de 3 a 5 sugestões de estudo detalhadas, claras e acionáveis para um aluno.
            
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

export interface PedagogicalAnalysis {
  resumo_geral: string;
  principais_dificuldades: string[];
  pontos_fortes: string[];
  alunos_em_risco: string[];
  sugestoes_para_professor: string[];
  plano_de_acao: string[];
}

export async function generatePedagogicalAnalysis(data: any, modelName: string = "gemini-3-pro-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<PedagogicalAnalysis> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um motor de análise pedagógica avançado.
Analise os seguintes dados estruturados do sistema de avaliação e gere um relatório pedagógico estruturado.

DADOS:
${JSON.stringify(data)}

RETORNE O RELATÓRIO NO FORMATO JSON SEGUINDO O ESQUEMA DEFINIDO.`
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
          resumo_geral: { type: Type.STRING, description: "Resumo geral da análise pedagógica." },
          principais_dificuldades: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista das principais dificuldades identificadas." },
          pontos_fortes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista dos pontos fortes identificados." },
          alunos_em_risco: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista dos nomes dos alunos em risco pedagógico." },
          sugestoes_para_professor: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Sugestões de intervenção para o professor." },
          plano_de_acao: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Plano de ação detalhado." }
        },
        required: ["resumo_geral", "principais_dificuldades", "pontos_fortes", "alunos_em_risco", "sugestoes_para_professor", "plano_de_acao"]
      }
    }
  });

  return safeParseJson(response.text, {});
}

export interface LearningProfileResult {
  vark_style: "Visual" | "Aural" | "Read/Write" | "Kinesthetic" | "Multimodal";
  cognitive_level: string;
  behavioral_traits: string[];
  recommendations: string;
}

export async function classifyLearningProfile(behavioralData: any, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'aluno'): Promise<LearningProfileResult> {
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

export async function analyzeCognitiveErrors(submissionData: any, questions: any[], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<CognitiveErrorResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analise os erros cometidos pelo aluno nesta submissão e classifique-os por categoria cognitiva (Interpretação, Conceito, Atenção, Lógica).
            
            Para cada erro identificado:
            1. Forneça uma explicação pedagógica profunda e detalhada sobre a falha cognitiva específica que levou ao erro. Não apenas descreva o erro, mas analise o processo de pensamento do aluno.
            2. Forneça uma sugestão de intervenção prática, clara e acionável para o professor. A sugestão deve incluir atividades, perguntas de sondagem ou materiais de apoio específicos para superar essa dificuldade.
            
            DADOS DA SUBMISSÃO:
            ${JSON.stringify(submissionData)}
            
            DETALHES DAS QUESTÕES:
            ${JSON.stringify(questions.map(q => ({
              id: q.id,
              text: q.text,
              options: q.options,
              correctOption: q.correctOption,
              competency: q.competency
            })))}
            
            RETORNE UM JSON COM:
            {
              "errors": [
                {
                  "questionId": string,
                  "category": "Interpretação" | "Conceito" | "Atenção" | "Lógica",
                  "explanation": "Resumo curto do erro",
                  "explicacao_detalhada": "Análise pedagógica profunda do processo cognitivo (mínimo 2 frases)",
                  "suggested_fix": "Como o aluno pode corrigir (curto)",
                  "sugestao_intervencao": "Plano de ação detalhado para o professor (mínimo 2 frases)"
                }
              ]
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

export async function generateRecoveryPlan(studentData: any, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<RecoveryPlanResult> {
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

export async function generateLessonPlan(classData: any, cognitiveAnalyses: any[] = [], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<LessonPlanResult> {
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

export async function predictPerformance(historicalData: any, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'aluno'): Promise<PerformancePredictionResult> {
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

export async function suggestCompetencies(questions: any[], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<string[]> {
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

export interface GuessDetectionResult {
  isGuess: boolean;
  confidence: number;
  reason: string;
}

export async function detectGuessing(responseTime: number, difficulty: string, isCorrect: boolean, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'aluno'): Promise<GuessDetectionResult> {
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

export async function generateSAEPQuestion(competency: string, difficulty: string, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<SAEPQuestion> {
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
          ultimaUtilizacao: { type: Type.NULL },
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

  return safeParseJson(response.text, {});
}

export interface BloomAnalysisResult {
  distribution: Record<string, number>;
  health_score: number;
  recommendations: string;
}

export async function analyzeBloomTaxonomy(questions: any[], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<BloomAnalysisResult> {
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

export async function gradeOpenQuestion(question: string, answer: string, rubric: string, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<OpenQuestionGrade> {
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

export interface SIPAResult {
  title: string;
  critical_students: string[];
  main_gap: string;
  intervention_strategy: string;
  suggested_resources: string[];
  n8n_trigger_payload: any;
}

export async function generateSIPA(classData: any[], studentsAtRisk: any[], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<SIPAResult> {
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

export async function getNextAdaptiveQuestion(proficiency: number, competency: string, history: any[], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'aluno'): Promise<SAEPQuestion> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um motor de Teste Adaptativo Computadorizado (CAT).
            O aluno tem uma proficiência estimada de ${proficiency} (escala 0-100).
            Gere uma questão de múltipla escolha para a competência "${competency}" que seja adequada para este nível de proficiência.
            
            REGRAS:
            1. Se proficiência < 30: Nível Fácil.
            2. Se proficiência 30-70: Nível Médio.
            3. Se proficiência > 70: Nível Difícil.
            4. NÃO repita questões do histórico: ${JSON.stringify(history.map(h => h.text).slice(-5))}.
            
            RETORNE O JSON COMPLETO CONFORME O PADRÃO FIRESTORE ESPECIFICADO NAS INSTRUÇÕES DO SISTEMA.`
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
          ultimaUtilizacao: { type: Type.NULL },
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

  return safeParseJson(response.text, {});
}
