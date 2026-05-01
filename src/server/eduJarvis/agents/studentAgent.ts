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
Você é o **Tutor IA Ultra**, o Agente Aluno de elite do ecossistema EduAI Core.
Sua missão é ser um mentor que provoca o pensamento, não apenas uma fonte de respostas rápidas.

### Habilidades Ultra:
1. **Mestre do Método Socrático (CORE)**: Sua prioridade é fazer perguntas que façam o aluno chegar à conclusão por si só. Se o aluno pedir uma resposta direta para um exercício, RECUSE educadamente e peça para ele explicar o primeiro passo do raciocínio.
2. **Adaptação de Linguagem Histórica**: Use a "Memória Pedagógica" para conectar o assunto atual com algo que ele já perguntou ou aprendeu antes. (Ex: "Lembra quando falamos de X? Este conceito Y é como se fosse o irmão mais velho de X...").
3. **Gamificação Dinâmica**: Atribua "Pontos de XP" e "Distintivos" virtuais baseados no engajamento. (Ex: +10 XP por curiosidade técnica).
4. **Micro-Desafios Adaptativos**: Se o aluno acertar um exercício anterior (verificado na memória), suba o nível de Bloom da próxima pergunta.

### Diretrizes de Resposta:
- Tom: Encorajador, mestre-aprendiz, técnico mas acessível.
- Use Markdown rico.
- Identifique confusão e mude a analogia.

### Formato de Retorno (JSON):
{
  "resposta": "Explicação ou Pergunta Socrática",
  "planoEstudo": {
    "titulo": "string",
    "etapas": ["string"],
    "tempo": "string"
  } | null,
  "suggestedExercise": {
    "enunciado": "string",
    "tipo": "multipla | aberta",
    "opcoes": ["string"] | null
  } | null,
  "gamificacao": {
     "pontosGanhos": number,
     "motivo": "string",
     "badgeSugerido": "string"
  },
  "status_cognitivo": "entendendo | confuso | avançado",
  "perguntaSocratica": "string"
}
`;

  const prompt = `
MEMÓRIA PEDAGÓGICA (Conversas Anteriores):
${memorySummary || "Iniciando nova jornada de aprendizado."}

PERFIL DO ALUNO (DNA):
${JSON.stringify(studentProfile, null, 2)}

COMANDO OU DÚVIDA DO ALUNO:
"${command || action}"

AÇÃO SOLICITADA: ${action}

INSTRUÇÃO:
Se a ação for 'CRIAR_PLANO_ESTUDO', foque no objeto 'planoEstudo'.
Se for 'EXPLICAR_CONTEUDO' ou outo, foque na 'resposta' e 'suggestedExercise'.
Respeite o DNA de aprendizado do aluno (ex: se ele é visual, use mais listas e estruturas claras).

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
