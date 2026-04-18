import { GoogleGenAI, Type } from "@google/genai";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Logs AI usage to Firestore for institutional governance and cost analysis.
 */
async function logAIUsage(provider: AIProvider, model: string, success: boolean, error?: string) {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    const email = auth.currentUser?.email || 'anonymous';
    
    await addDoc(collection(db, 'ai_usage_logs'), {
      userId,
      email,
      provider,
      model,
      timestamp: serverTimestamp(),
      success,
      error: error || null,
      // In a real environment, we would also log tokens here if the API provides them
      costEstimate: provider === 'openai' ? 0.01 : 0.005, // Placeholder for cost tracking logic
    });
  } catch (err) {
    console.warn("[AI Logging] Failed to log usage:", err);
  }
}

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
  const isSmartContent = module === 'smart_content';

  return `
## 🎯 PAPEL DO MODELO
Você atuará como um **Especialista em Educação Profissional, Avaliação por Competências, BI Educacional e Inteligência Artificial aplicada ao ensino técnico**, com domínio do padrão SAEP (SENAI) e da Taxonomia de Bloom.
Seu objetivo é analisar dados, gerar conteúdos educacionais inteligentes, personalizados e estruturados, e propor recomendações inteligentes para aprendizagem a partir de comandos recebidos.
Você está integrado à plataforma educacional chamada **JuniorsStudent**.

---

## 👤 PERFIL DO USUÁRIO
perfil: ${profile}
Sua resposta deve se adaptar automaticamente ao perfil do usuário (Professores esperam profundidade técnica e insights de BI; Alunos esperam clareza didática e caminhos de aprendizagem).

---

## ⚙️ OBJETIVO
Gerar conteúdo educacional de alta qualidade e análises de desempenho, com foco em:
- questões pedagógicas bem elaboradas no padrão SAEP
- planos de estudo personalizados baseados em dados de desempenho
- explicações técnicas claras e contextualizadas
- simulados inteligentes com balanceamento de competências
- análise de BI educacional para professores
- recomendações de estudo baseadas em lacunas de competência

---

## 📥 FORMATO DE ENTRADA (JSON)
Você receberá um JSON com os seguintes campos:
{
  "tipo": "questoes | simulado | plano_estudo | explicacao | analise_desempenho",
  "perfil": "${profile}",
  "disciplina": "nome da disciplina",
  "competencias": ["lista de competências"],
  "nivel": "facil | medio | dificil",
  "dados_desempenho": [
    {
      "competencia": "nome",
      "acertos": number,
      "erros": number
    }
  ],
  "historico": {
    "simulados_realizados": number,
    "media_geral": number
  },
  "prompt": "instrução adicional"
}

---

## 🚫 REGRAS POR PERFIL

${isProfessor && (isBancoQuestoes || isSmartContent) ? `
### 👨‍🏫 REGRA CRÍTICA (PROFESSOR)
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
      const errorMsg = fetchError ? fetchError.message : (fetchResponse ? `Status ${fetchResponse.status}` : 'Unknown error');
      await logAIUsage(provider, params.model || 'unknown', false, errorMsg);
      
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
      
      try {
        console.warn(`[AI] Fallback to Gemini...`);
        return await ai.models.generateContent(fallbackParams);
      } catch (geminiErr: any) {
        if (geminiErr?.status === 429 || geminiErr?.message?.includes('429') || geminiErr?.message?.includes('quota')) {
          console.error(`[AI] Gemini fallback also failed due to quota.`);
          throw new Error("Limite de uso da Inteligência Artificial excedido (Quota Exceeded). Por favor, aguarde alguns instantes e tente novamente.");
        }
        throw geminiErr;
      }
    }

    const data = await fetchResponse.json();
    await logAIUsage(provider, params.model || 'unknown', true);
    return { text: data.text };
  } else {
    // Ensure we use a Gemini model if the provider is gemini
    const geminiParams = { ...params };
    if (!geminiParams.model?.startsWith('gemini-')) {
      geminiParams.model = 'gemini-3-flash-preview';
    }
    try {
      const result = await ai.models.generateContent(geminiParams);
      await logAIUsage('gemini', geminiParams.model, true);
      return result;
    } catch (err: any) {
      const isQuotaError = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota');
      await logAIUsage('gemini', geminiParams.model, false, err.message);

      if (isQuotaError) {
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

        let fetchResponse;
        try {
          fetchResponse = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt, 
              responseFormat, 
              provider: 'deepseek',
              model: 'deepseek-chat' 
            })
          });
        } catch (fetchErr) {
          console.error(`[AI] Backend fallback failed:`, fetchErr);
          throw new Error("Limite de uso da Inteligência Artificial excedido (Quota Exceeded). Por favor, aguarde alguns instantes e tente novamente.");
        }

        if (!fetchResponse.ok) {
          await logAIUsage('deepseek', 'deepseek-chat', false, `Secondary fallback failed: ${fetchResponse.status}`);
          if (fetchResponse.status === 429) {
            throw new Error("Limite de uso da Inteligência Artificial excedido (Quota Exceeded). Por favor, aguarde alguns instantes e tente novamente.");
          }
          throw new Error(`Backend fallback failed com status ${fetchResponse.status}`);
        }

        const data = await fetchResponse.json();
        await logAIUsage('deepseek', 'deepseek-chat', true);
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
    const parsed = JSON.parse(cleanJson);
    
    // Handle the case where the AI returns an object with a 'questoes' array
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.questoes)) {
      return parsed.questoes;
    }
    
    // Handle the case where the AI returns a single question wrapped in 'questao' or 'question'
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (parsed.questao && typeof parsed.questao === 'object') {
        return parsed.questao;
      }
      if (parsed.question && typeof parsed.question === 'object') {
        return parsed.question;
      }
    }
    
    return parsed;
  } catch (error) {
    console.error("[Gemini] Erro ao parsear JSON:", error, "Texto original:", text);
    return fallback;
  }
}

export async function generateQuestionVariation(originalQuestion: any, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<any> {
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
Alternativas: ${originalQuestion.alternativas?.map((a: any) => `${a.id}) ${a.texto}`).join(' | ')}
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

export async function generateMultipleQuestionVariations(originalQuestion: any, count: number = 5, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<any[]> {
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
Alternativas: ${originalQuestion.alternativas?.map((a: any) => `${a.id}) ${a.texto}`).join(' | ')}
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

export async function parseQuestionsFromText(text: string, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<any[]> {
  // Split text into chunks of ~15,000 characters to avoid output token limits
  const chunkSize = 15000;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }

  const allQuestions: any[] = [];
  
  for (const chunk of chunks) {
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

    const result = safeParseJson(response.text, []);
    if (Array.isArray(result)) {
      allQuestions.push(...result);
    } else if (result && typeof result === 'object' && result.enunciado) {
      allQuestions.push(result);
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

export async function generateInterventionPlan(classData: any, modelName: string = "gemini-3-flash-preview"): Promise<any> {
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

export async function generateLearningPath(studentData: any, modelName: string = "gemini-3-flash-preview"): Promise<any> {
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

export async function generateRecoveryTrack(params: { studentId: string, competencyId: string, diagnosticData: any }, modelName: string = "gemini-3-flash-preview"): Promise<{ riskLevel: string, summary: string, activities: any[], interventions: string[] }> {
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

export async function simulateDigitalTwin(stats: any, scenario: string, modelName: string = "gemini-3-flash-preview"): Promise<TwinSimulationResult> {
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
export async function generateAdvancedQuestion(params: AdvancedQuestionParams, modelName: string = "gemini-3-flash-preview"): Promise<any[]> {
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
  "tempoEstimado": number (segundos)
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
            tempoEstimado: { type: Type.NUMBER }
          },
          required: ['enunciado', 'tipoQuestao', 'dificuldade', 'bloom']
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

export async function analyzeCognitiveErrors(submissionData: any, questions: any[], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<CognitiveErrorResult> {
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

export interface SmartContentInput {
  tipo: 'questoes' | 'simulado' | 'plano_estudo' | 'explicacao' | 'analise_desempenho';
  perfil: 'professor' | 'aluno';
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
export async function generateSmartContent(input: SmartContentInput, modelName: string = "gemini-3-flash-preview"): Promise<any> {
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

export async function generateClassRecoveryOrchestration(stats: any, modelName: string = "gemini-3-flash-preview"): Promise<ClassOrchestrationResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como o Motor de Orquestração Pedagógica do EDUSAEP.
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

export async function generateSIPA(stats: any, intervention: string, modelName: string = "gemini-3-flash-preview"): Promise<SIPAResult> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como o Simulador de Impacto Pedagógico (SIPA) do EDUSAEP.
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

  const parsed = safeParseJson(response.text, {});
  
  if (!parsed || !parsed.enunciado || !Array.isArray(parsed.alternativas) || parsed.alternativas.length < 2) {
    console.error("[Gemini] Invalid question generated:", parsed);
    throw new Error("A IA gerou uma questão em um formato inválido. Tente novamente.");
  }
  
  return parsed;
}

export interface PedagogicalAnalysisResult {
  resumo_geral: string;
  pontos_fortes: string[];
  principais_dificuldades: string[];
  alunos_em_risco: string[];
  plano_de_acao: string[];
  sugestoes_para_professor: string[];
}

export async function generatePedagogicalAnalysis(data: any, modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<PedagogicalAnalysisResult> {
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

export interface QuestionQualityAnalysis {
  questionId: string;
  originalEnunciado: string;
  suggestedEnunciado?: string;
  originalAlternativas: Array<{ id: string, texto: string }>;
  suggestedAlternativas: Array<{ id: string, texto: string }>;
  analysis: string;
  improvements: string[];
  cognitiveErrorsAddressed: string[];
}

export async function analyzeQuestionQuality(question: any, errors: any[], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<QuestionQualityAnalysis> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Como um Especialista em Avaliação Educacional e Design de Itens (padrão SAEP), analise esta questão de múltipla escolha que apresenta alto índice de erros cognitivos pelos alunos.
            
            DADOS DA QUESTÃO:
            ${JSON.stringify({
              enunciado: question.enunciado,
              alternativas: question.alternativas,
              respostaCorreta: question.respostaCorreta,
              comentarioGabarito: question.comentarioGabarito
            })}
            
            DADOS DE ERROS COGNITIVOS IDENTIFICADOS NAS SUBMISSÕES:
            ${JSON.stringify(errors.map(e => ({ category: e.category, explanation: e.explanation })))}
            
            Sua tarefa:
            1. Identificar se o enunciado possui ambiguidades, falta de clareza ou excesso de carga cognitiva (interpretação de texto vs conhecimento técnico).
            2. Avaliar se os distratores capturam equívocos comuns de raciocínio.
            3. Sugerir uma reformulação do enunciado focada na clareza e objetividade.
            4. Sugerir alternativas que diferenciem melhor alunos que possuem o conceito daqueles que estão cometendo erros de processo.
            5. Explicar como essas mudanças abordam especificamente os erros cognitivos (Falta de Conceito, Interpretação, Processo, etc).
            
            RETORNE UM JSON COM A SEGUINTE ESTRUTURA:
            {
              "questionId": "${question.id || question.questionUid}",
              "originalEnunciado": string,
              "suggestedEnunciado": string (opcional, apenas se houver melhoria),
              "originalAlternativas": Array<{id, texto}>,
              "suggestedAlternativas": Array<{id, texto}>,
              "analysis": string (Análise pedagógica da questão original),
              "improvements": string[] (Lista de melhorias sugeridas),
              "cognitiveErrorsAddressed": string[] (Quais categorias de erro esta reformulação visa reduzir)
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
    questionId: question.id || question.questionUid,
    originalEnunciado: question.enunciado,
    originalAlternativas: question.alternativas || [],
    suggestedAlternativas: question.alternativas || [],
    analysis: "Não foi possível gerar análise.",
    improvements: [],
    cognitiveErrorsAddressed: []
  });
}

export interface InterventionStrategyResult {
  title: string;
  critical_students: string[];
  main_gap: string;
  intervention_strategy: string;
  suggested_resources: string[];
  n8n_trigger_payload: any;
}

export async function generateInterventionStrategy(classData: any[], studentsAtRisk: any[], modelName: string = "gemini-3-flash-preview", userRole: 'professor' | 'aluno' = 'professor'): Promise<InterventionStrategyResult> {
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

  const parsed = safeParseJson(response.text, {});
  
  if (!parsed || !parsed.enunciado || !Array.isArray(parsed.alternativas) || parsed.alternativas.length < 2) {
    console.error("[Gemini] Invalid question generated:", parsed);
    throw new Error("A IA gerou uma questão em um formato inválido. Tente novamente.");
  }
  
  return parsed;
}

export async function generateDiscursiveQuestion(
  prompt: string,
  difficulty: string,
  modelName: string = 'gemini-3-flash-preview',
  userRole: 'professor' | 'aluno' = 'professor'
): Promise<any> {
  const response = await generateContentWrapper({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um especialista em avaliação educacional.
            Gere uma questão DISCURSIVA (aberta) com base no seguinte prompt do professor: "${prompt}".
            Nível de dificuldade desejado: ${difficulty}.
            
            A questão deve ser desafiadora, clara e avaliar competências de alto nível.
            Além do enunciado, você DEVE fornecer:
            1. Uma resposta esperada (padrão de resposta).
            2. Critérios de avaliação detalhados (rubrica) para o professor usar na correção.
            
            RETORNE O JSON COMPLETO CONFORME O PADRÃO ESPECIFICADO.`
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
          competenciaNome: { type: Type.STRING },
          temaNome: { type: Type.STRING },
          dificuldade: { type: Type.STRING },
          bloom: { type: Type.STRING },
          tipoQuestao: { type: Type.STRING },
          enunciado: { type: Type.STRING },
          respostaEsperada: { type: Type.STRING },
          criteriosAvaliacao: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                criterio: { type: Type.STRING },
                pontuacao: { type: Type.NUMBER },
                descricao: { type: Type.STRING }
              },
              required: ["criterio", "pontuacao", "descricao"]
            }
          },
          comentarioPedagogico: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: [
          "questionUid", "competenciaNome", "temaNome", "dificuldade", "bloom", 
          "tipoQuestao", "enunciado", "respostaEsperada", "criteriosAvaliacao"
        ]
      }
    }
  });

  const parsed = safeParseJson(response.text, {});
  
  if (!parsed || !parsed.enunciado || !parsed.respostaEsperada || !Array.isArray(parsed.criteriosAvaliacao)) {
    console.error("[Gemini] Invalid discursive question generated:", parsed);
    throw new Error("A IA gerou uma questão discursiva em um formato inválido. Tente novamente.");
  }
  
  return {
    ...parsed,
    tipoQuestao: 'discursiva',
    status: 'published',
    revisadaPorProfessor: false,
    usoTotal: 0,
    origem: 'IA',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
}

export async function generateStudyPlan(data: any, modelName: string = "gemini-3-flash-preview"): Promise<any> {
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
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0.2 }
  });

  return safeParseJson(response.text, { explanation: "Infelizmente parece que houve um conflito." });
}

// Módulo 18: ABP Automatizada (Aprendizagem Baseada em Projetos)
export async function generateAutomatedPBL(competenciesCovered: string[], context: string) {
  const prompt = `Aja como Desenvolvedor Curricular Avançado. Crie um Projeto de Aprendizagem (ABP / PBL) de aplicação no mundo real para ensino médio/fundamental usando estas competências: ${competenciesCovered.join(', ')} e o contexto: ${context}
  
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
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", temperature: 0.7 }
  });

  return safeParseJson(response.text, { title: "Projeto não gerado." });
}

// Módulo 3: Conflito Cognitivo
export async function generateCognitiveConflictScenario(topic: string) {
    const prompt = `Aja como Tutor do EDUSAEP. Para testar o aprendizado profundo do aluno no tema '${topic}', gere um cenário de CONFLITO COGNITIVO. 
    Apresente uma afirmação aparentemente verdadeira e lógica baseada no senso comum, mas que é falha cientificamente/historicamente, e peça para ele encontrar o "furo na matriz" do seu argumento, com 4 alternativas.
    
    RETORNE JSON: { "scenario": "texto", "apparentTruth": "texto ilusório", "alternatives": ["A","B","C","D"], "correctOptionIndex": number, "explanationIfWrong": "string" }`;
  
    const response = await generateContentWrapper({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", temperature: 0.5 }
    });
  
    return safeParseJson(response.text, null);
  }

