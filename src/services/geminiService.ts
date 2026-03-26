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

export async function generateDiagnostic(data: any[], modelName: string = "gemini-3-flash-preview"): Promise<DiagnosticResult[]> {
  const response = await ai.models.generateContent({
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

  const parsed = JSON.parse(response.text || "[]");
  return Array.isArray(parsed) ? parsed : [parsed];
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

export interface PedagogicalAnalysis {
  resumo_geral: string;
  principais_dificuldades: string[];
  pontos_fortes: string[];
  alunos_em_risco: string[];
  sugestoes_para_professor: string[];
  plano_de_acao: string[];
}

export async function generatePedagogicalAnalysis(data: any, modelName: string = "gemini-3-pro-preview"): Promise<PedagogicalAnalysis> {
  const response = await ai.models.generateContent({
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
      responseMimeType: "application/json",
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

  return JSON.parse(response.text || "{}");
}

export interface LearningProfileResult {
  vark_style: "Visual" | "Aural" | "Read/Write" | "Kinesthetic" | "Multimodal";
  cognitive_level: string;
  behavioral_traits: string[];
  recommendations: string;
}

export async function classifyLearningProfile(behavioralData: any, modelName: string = "gemini-3-flash-preview"): Promise<LearningProfileResult> {
  const response = await ai.models.generateContent({
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export interface CognitiveErrorResult {
  errors: Array<{
    questionId: string;
    category: "Interpretação" | "Conceito" | "Atenção" | "Lógica";
    explanation: string;
    suggested_fix: string;
  }>;
}

export async function analyzeCognitiveErrors(submissionData: any, modelName: string = "gemini-3-flash-preview"): Promise<CognitiveErrorResult> {
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analise os erros cometidos pelo aluno nesta submissão e classifique-os por categoria cognitiva (Interpretação, Conceito, Atenção, Lógica).
            
            DADOS DA SUBMISSÃO:
            ${JSON.stringify(submissionData)}
            
            RETORNE UM JSON COM:
            {
              "errors": [
                {
                  "questionId": string,
                  "category": "Interpretação" | "Conceito" | "Atenção" | "Lógica",
                  "explanation": string,
                  "suggested_fix": string
                }
              ]
            }`
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

export async function generateRecoveryPlan(studentData: any, modelName: string = "gemini-3-flash-preview"): Promise<RecoveryPlanResult> {
  const response = await ai.models.generateContent({
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export interface LessonPlanResult {
  title: string;
  objectives: string[];
  topicsToReview: string[];
  practicalActivities: Array<{
    name: string;
    description: string;
    duration: string;
  }>;
  suggestedMaterials: string[];
  aiInsights: string;
}

export async function generateLessonPlan(classData: any, modelName: string = "gemini-3-flash-preview"): Promise<LessonPlanResult> {
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Com base nos erros cognitivos da turma, gere um plano de aula focado em remediar as dificuldades mais comuns.
            
            DADOS DA TURMA E ERROS COGNITIVOS:
            ${JSON.stringify(classData)}
            
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export interface PerformancePredictionResult {
  probabilityOfSuccess: number;
  riskLevel: "Baixo" | "Médio" | "Alto" | "Crítico";
  factors: string[];
  recommendations: string;
}

export async function predictPerformance(historicalData: any, modelName: string = "gemini-3-flash-preview"): Promise<PerformancePredictionResult> {
  const response = await ai.models.generateContent({
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function suggestCompetencies(questions: any[], modelName: string = "gemini-3-flash-preview"): Promise<string[]> {
  const response = await ai.models.generateContent({
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
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}

export interface GuessDetectionResult {
  isGuess: boolean;
  confidence: number;
  reason: string;
}

export async function detectGuessing(responseTime: number, difficulty: string, isCorrect: boolean, modelName: string = "gemini-3-flash-preview"): Promise<GuessDetectionResult> {
  const response = await ai.models.generateContent({
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export interface SAEPQuestion {
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
  competency: string;
  skill: string;
  difficulty: "fácil" | "médio" | "difícil";
  bloom_level: string;
}

export async function generateSAEPQuestion(competency: string, difficulty: string, modelName: string = "gemini-3-flash-preview"): Promise<SAEPQuestion> {
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Aja como um Especialista em Elaboração de Itens para o SAEP/SENAI.
            Gere uma questão inédita para a competência: "${competency}" com nível de dificuldade "${difficulty}".
            
            REQUISITOS:
            1. Siga o padrão de múltipla escolha (4 alternativas).
            2. Inclua uma explicação detalhada da resposta correta.
            3. Identifique o nível da Taxonomia de Bloom.
            4. A questão deve ser técnica e contextualizada (modelo SENAI).
            
            RETORNE APENAS O JSON NO FORMATO:
            {
              "text": string,
              "options": [string, string, string, string],
              "correctOption": number (0-3),
              "explanation": string,
              "competency": string,
              "skill": string,
              "difficulty": "fácil" | "médio" | "difícil",
              "bloom_level": string
            }`
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

export interface BloomAnalysisResult {
  distribution: Record<string, number>;
  health_score: number;
  recommendations: string;
}

export async function analyzeBloomTaxonomy(questions: any[], modelName: string = "gemini-3-flash-preview"): Promise<BloomAnalysisResult> {
  const response = await ai.models.generateContent({
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export interface OpenQuestionGrade {
  score: number;
  feedback: string;
  criteria_met: string[];
  missing_points: string[];
}

export async function gradeOpenQuestion(question: string, answer: string, rubric: string, modelName: string = "gemini-3-flash-preview"): Promise<OpenQuestionGrade> {
  const response = await ai.models.generateContent({
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export interface SIPAResult {
  title: string;
  critical_students: string[];
  main_gap: string;
  intervention_strategy: string;
  suggested_resources: string[];
  n8n_trigger_payload: any;
}

export async function generateSIPA(classData: any[], studentsAtRisk: any[]): Promise<SIPAResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function getNextAdaptiveQuestion(proficiency: number, competency: string, history: any[], modelName: string = "gemini-3-flash-preview"): Promise<SAEPQuestion> {
  const response = await ai.models.generateContent({
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
            
            RETORNE UM JSON NO FORMATO:
            {
              "text": string,
              "options": [string, string, string, string],
              "correctOption": number (0-3),
              "explanation": string,
              "competency": string,
              "skill": string,
              "difficulty": "fácil" | "médio" | "difícil",
              "bloom_level": string
            }`
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
