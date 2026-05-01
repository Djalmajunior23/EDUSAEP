import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";
import { memoryAgent } from "./memoryAgent";
import admin from "firebase-admin";

/**
 * Agente Aluno - Tutor IA Ultra
 * Focado em Explicações, Planos de Estudo e Micro-Desafios
 */
export async function studentAgent(request: EduJarvisRequest) {
  const db = admin.firestore();
  const { userId, command, action, context, input } = request;

  // 1. Recuperar contexto rico do aluno (DNA de Aprendizagem e Memória)
  let studentProfile: any = context?.studentProfile || {};
  let memorySummary = context?.memorySummary || "";

  if (userId) {
    if (!memorySummary) {
      memorySummary = await memoryAgent.getMemorySummary(userId);
    }
    
    if (Object.keys(studentProfile).length === 0) {
      const profileSnap = await db.collection('LearningDNA').where('userId', '==', userId).limit(1).get();
      if (!profileSnap.empty) {
        studentProfile = profileSnap.docs[0].data();
      }
    }
  }

  const systemInstruction = `
Você é o **Tutor IA Ultra**, o Agente Aluno do ecossistema EduAI Core.
Sua missão é ser o mentor definitivo, oferecendo suporte personalizado, empático e de alto impacto pedagógico.

### Habilidades Principais:
1. **Explicador Passo a Passo**: Quebre conceitos complexos em etapas lógicas (Scaffolding).
2. **Gerador de Planos de Estudo**: Crie roteiros baseados no tempo disponível e nível do aluno.
3. **Mestre do Método Socrático**: Não dê a resposta direto; guie o aluno com perguntas instigantes.
4. **Adaptabilidade Extrema**: Use a "Memória Pedagógica" para lembrar o que o aluno já sabe e ajustar o tom (Iniciante vs Avançado).
5. **Validador de Aprendizado**: Sempre que explicar algo, sugira um "Micro-Exercício" imediato.

### Diretrizes de Resposta:
- Seja encorajador e use Markdown para clareza (tabelas, listas, negritos).
- Identifique "Gatilhos de Frustração": se o aluno parecer confuso, mude a abordagem.
- Foco em Competências Técnicas (Padrão SENAI/SAEP).

### Formato de Retorno (JSON Obrigatório):
{
  "resposta": "Explicação formatada em Markdown",
  "planoEstudo": {
    "titulo": "string",
    "etapas": ["string"],
    "recomendacao": "string"
  } | null,
  "suggestedExercise": {
    "enunciado": "string",
    "tipo": "multipla | aberta",
    "opcoes": ["string"], // se múltipla
    "gabarito_sugerido": "string",
    "feedback_esperado": "string"
  } | null,
  "difficultyDetected": {
    "habilidade": "string",
    "nivel": "leve | media | alta | nenhuma",
    "descricao": "O que você percebeu"
  } | null,
  "insight": "Dica rápida ou curiosidade sobre o tema",
  "perguntaGuia": "Pergunta socrática para manter o diálogo",
  "status_cognitivo": "entendendo | confuso | avançado",
  "insightHistoryUsed": "Frase sobre o histórico usado (ex: Como discutimos sobre X antes...)"
}
`;

  const prompt = `
MEMÓRIA PEDAGÓGICA (Conversas Anteriores):
${memorySummary || "Primeira interação do aluno."}

PERFIL DO ALUNO (DNA):
${JSON.stringify(studentProfile, null, 2)}

COMANDO OU DÚVIDA DO ALUNO:
"${command || action}"

DADOS ADICIONAIS:
${JSON.stringify(input || {}, null, 2)}

SOLICITAÇÃO ESPECÍFICA:
${action === 'GERAR_PLANO_ESTUDO' ? 'Crie um plano de estudo detalhado para este tema.' : 'Explique detalhadamente e ofereça um exercício de validação.'}

RETORNE APENAS O JSON.
`;

  const result = await callAI({ 
    systemPrompt: systemInstruction, 
    userPrompt: prompt, 
    costMode: request.costMode || "normal",
    responseFormat: 'json'
  });

  const parsed = JSON.parse(result.text);

  // Registrar na memória
  if (userId && (parsed.resposta || parsed.planoEstudo)) {
    await memoryAgent.recordInteraction(
      userId, 
      action || "TUTOR_STUDENT_DOUBT", 
      command || "", 
      parsed.resposta || "Plano de estudo gerado."
    );
  }

  return parsed;
}
