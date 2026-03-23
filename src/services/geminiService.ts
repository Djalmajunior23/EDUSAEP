import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
      professor_feedback?: string;
      professor_nota?: number | string;
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

export async function generateDiagnostic(data: any[], modelName: string = "gemini-3-flash-preview"): Promise<DiagnosticResult> {
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Especialista em Diagnóstico Educacional por Competências (padrão SAEP).
Analise os seguintes dados brutos de um simulado e gere um diagnóstico completo em formato JSON.

REGRAS DE CÁLCULO:
1) acertou: use campo "acertou" ou compare resposta_aluno == gabarito.
2) peso: use campo "peso" ou derive por bloom (Fácil=1.0; Médio=1.5; Difícil=2.0; Superdifícil=3.0). Se bloom ausente, peso=1.0.
3) Métricas: acuracia_geral = acertos/total; acuracia_ponderada = soma(acertou*peso)/soma(peso).
4) Classificação: Forte >= 0.75; Atenção 0.55..0.74; Crítico < 0.55.
5) Priorização: Ordene por menor acuracia_ponderada, maior peso, maior total_questoes.

DADOS:
${JSON.stringify(data)}

RETORNE APENAS O JSON NO FORMATO:
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
          "acertou": boolean
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateSuggestions(conhecimentos: string[], recomendacoes: string, modelName: string = "gemini-3-flash-preview"): Promise<string[]> {
  const response = await ai.models.generateContent({
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "[]");
}
