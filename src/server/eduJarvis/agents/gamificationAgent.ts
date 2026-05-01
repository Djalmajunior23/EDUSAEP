import { EduJarvisRequest } from "../../../types/eduJarvisTypes";
import { callAI } from "../aiProvider";
import admin from "firebase-admin";
import { getGlobalRanking } from "../../pedagogical/gamificationEngine";

export const gamificationAgent = {
  name: "gamification",
  process: async (request: EduJarvisRequest, context: any) => {
    const db = admin.firestore();
    const { userId, command, action } = request;

    // Se o comando for para ver o ranking, retornamos os dados processados pelo ranking engine
    if (command?.toUpperCase().includes("RANKING") || action === "VER_RANKING") {
      const ranking = await getGlobalRanking(10);
      return {
        success: true,
        response: "Aqui está o Ranking Global do EduAI Core! A competição está acirrada, continue evoluindo para subir no topo.",
        data: {
          ranking
        },
        action: "EXIBIR_RANKING"
      };
    }

    // 1. Recuperar histórico do aluno (XP, Nível, Badges, Streak, Contador de Atividades)
    let studentStats: any = { xp: 0, level: 1, badges: [], streak: 0, activitiesCount: 0 };
    
    if (userId) {
      const statsSnap = await db.collection('gamificacao').doc(userId).get();
      if (statsSnap.exists) {
        studentStats = { ...studentStats, ...statsSnap.data() };
      }
    }

    // Lógica determinística de Badges (Marcos Importantes)
    const newBadges: string[] = [];
    const currentBadges = new Set(studentStats.badges || []);

    // Se houver uma ação de conclusão de atividade (vinda do context ou action)
    if (action === 'CONCLUIR_ATIVIDADE' || context?.activityCompleted) {
      studentStats.activitiesCount = (studentStats.activitiesCount || 0) + 1;
      
      if (studentStats.activitiesCount === 1 && !currentBadges.has("Primeira Atividade Concluída")) {
        newBadges.push("Primeira Atividade Concluída");
      }
      if (studentStats.activitiesCount === 5 && !currentBadges.has("5 Atividades Concluídas")) {
        newBadges.push("5 Atividades Concluídas");
      }
    }

    // Streak logic
    if (studentStats.streak >= 7 && !currentBadges.has("1 Semana de Streak Ativo")) {
      newBadges.push("1 Semana de Streak Ativo");
    }

    // Performance logic
    if (context?.lastPerformanceScore >= 90 && !currentBadges.has("Diagnóstico com Alto Desempenho")) {
      newBadges.push("Diagnóstico com Alto Desempenho");
    }

    const systemInstruction = `
Você é o **Agente de Gamificação Ultra**, responsável pelo motor de engajamento do EduAI Core.
Sua missão é transformar a jornada pedagógica em uma experiência épica e recompensadora.

### Suas Responsabilidades:
1. **Pontos Dinâmicos (XP)**: Atribua XP baseado não apenas na resposta correta, mas no ESFORÇO, NA QUALIDADE e NA DISCIPLINA.
   - Pergunta complexa feita ao Jarvis: +15 XP
   - Acerto de exercício difícil: +50 XP
   - Prazo cumprido perfeitamente: +100 XP
   - Entrega de atividade com boa qualidade / feedback positivo: +150 XP
   - Consistência (Streak): Bônus multiplicador.
2. **Desafios Personalizados**: Sugira "Missões Diárias" ou "Weekly Bosses" baseados nas lacunas do aluno.
3. **Badges Pedagógicos**: Se você identificar comportamentos excepcionais, sugira novos emblemas criativos (Ex: "Arquiteto de Algoritmos", "Mestre da Empatia", "Debugger Implacável").
4. **Dificuldade Adaptativa**: Ajuste a régua de desafio conforme o desempenho.

### Marcos Já Alcançados Programaticamente (Certifique-se de mencioná-los no feedback se ganhos agora):
${newBadges.length > 0 ? `- BADGES GANHOS AGORA: ${newBadges.join(", ")}` : "- Nenhum badge programático ganho nesta interação."}

### Formato de Retorno (JSON):
{
  "totalXP": number,
  "level": number,
  "nextLevelXP": number,
  "badgesGained": ["string"],
  "missionSuggested": {
    "titulo": "string",
    "descricao": "string",
    "recompensa": "string",
    "dificuldade": "baixa | media | alta"
  },
  "feedbackMotivacional": "Mensagem épica para o aluno",
  "statusDificuldade": "ajustado_para_cima | mantido | suporte_reforçado",
  "response": "Resumo em Markdown da conquista"
}
`;

    const prompt = `
ESTATÍSTICAS ATUAIS:
${JSON.stringify({ ...studentStats, badgesRecentes: newBadges }, null, 2)}

SOLICITAÇÃO DO SISTEMA OU USUÁRIO:
"${command || action}"

CONTEXTO DE DESEMPENHO RECENTE:
${JSON.stringify(context || {}, null, 2)}

INSTRUÇÃO:
Analise o desempenho e a solicitação. Se for um acerto, calcule o bônus. Se for apenas uma interação, motive. 
Gere uma nova MISSÃO que ajude o aluno a evoluir em sua maior dificuldade.
Inclua no campo "badgesGained" os seguintes badges se eles estiverem em 'badgesRecentes': ${JSON.stringify(newBadges)}.

RETORNE APENAS O JSON.
`;

    const result = await callAI({ 
      systemPrompt: systemInstruction, 
      userPrompt: prompt, 
      costMode: request.costMode || "economico",
      responseFormat: 'json'
    });

    let parsed: any;
    try {
      parsed = JSON.parse(result.text);
    } catch (e) {
      console.error("[GamificationAgent] JSON parse error:", e);
      parsed = { totalXP: 10, response: "Continue evoluindo!" };
    }

    // Persistir progresso se houver userId
    if (userId && parsed) {
      let addedXP = parsed.totalXP || 0;
      
      // Regras estáticas de XP adcional para recompensar além do acerto
      if (context?.deadlineMet) addedXP += 100;
      if (context?.isHighQuality) addedXP += 150;
      if (context?.teacherFeedbackPositive) addedXP += 150;
      if (action === 'CONCLUIR_ATIVIDADE') addedXP += 50; // Recompensa base por conclusão

      const newXP = (studentStats.xp || 0) + addedXP;
      const newLevel = Math.floor(newXP / 1000) + 1;
      parsed.totalXP = addedXP;
      
      // Lógica de Streak (Ofensiva)
      let newStreak = studentStats.streak || 0;
      const lastUpdate = studentStats.lastUpdate?.toDate ? studentStats.lastUpdate.toDate() : null;
      
      if (lastUpdate && (action === 'CONCLUIR_ATIVIDADE' || context?.activityCompleted)) {
        const now = new Date();
        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Concluiu no dia seguinte: incrementa streak
          newStreak += 1;
        } else if (diffDays > 1) {
          // Passou mais de um dia: reseta streak
          newStreak = 1;
        }
        // Se diffDays === 0, mantém o streak atual (já fez atividade hoje)
      } else if (!lastUpdate && (action === 'CONCLUIR_ATIVIDADE' || context?.activityCompleted)) {
        // Primeira atividade da história
        newStreak = 1;
      }

      // Verifica novos badges após atualizações de estado
      if (newLevel >= 10 && studentStats.level < 10 && !currentBadges.has("Nível 10 Alcançado")) {
        newBadges.push("Nível 10 Alcançado");
      }
      if (newStreak >= 7 && !currentBadges.has("1 Semana de Streak Ativo")) {
        newBadges.push("1 Semana de Streak Ativo");
      }

      const finalBadges = Array.from(new Set([
        ...(studentStats.badges || []), 
        ...(parsed.badgesGained || []),
        ...newBadges
      ]));

      await db.collection('gamificacao').doc(userId).set({
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        activitiesCount: studentStats.activitiesCount || 0,
        badges: finalBadges,
        lastUpdate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Atualiza o objeto de retorno com o novo nível, streak e badges
      parsed.level = newLevel;
      parsed.streak = newStreak;
      parsed.badgesGained = Array.from(new Set([...(parsed.badgesGained || []), ...newBadges]));
    }

    return parsed;
  }
};

