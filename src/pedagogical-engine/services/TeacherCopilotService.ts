import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateContentWrapper } from '../../services/geminiService';
import { AnalyticsHubService } from '../../services/analyticsHubService';

export class TeacherCopilotService {
  /**
   * Obtém o contexto unificado para a IA.
   * Busca saúde das turmas, alunos em risco e preferências do professor.
   */
  public static async getTeacherContext(teacherId: string) {
    let contextStr = '--- CONTEXTO DO PROFESSOR ---\n';

    try {
      // 1. Alunos em Risco
      const riskQuery = query(collection(db, 'studentRiskScores'), where('level', 'in', ['HIGH', 'MEDIUM']));
      const riskSnap = await getDocs(riskQuery);
      if (!riskSnap.empty) {
        contextStr += `\nAlunos em Risco Acadêmico:\n`;
        riskSnap.forEach(doc => {
          const data = doc.data();
          contextStr += `- Aluno UID: ${doc.id.substring(0,6)}... | Nível: ${data.level} | Score: ${data.score} | Motivo: ${(data.justifications || []).join(', ')}\n`;
        });
      }

      // 2. Saúde das Turmas (Simulação de pegar a de "todas" as turmas)
      const classesSnap = await getDocs(collection(db, 'classes'));
      if (!classesSnap.empty) {
        const topClass = classesSnap.docs[0];
        const health = await AnalyticsHubService.calculateClassHealth(topClass.id);
        contextStr += `\nSaúde da Turma Principal (${topClass.data().name}):\n`;
        contextStr += `- Engajamento: ${health.engagementScore}%\n`;
        contextStr += `- Taxa de Entrega: ${health.deliveryRate}%\n`;
        contextStr += `- Alunos em Risco: ${health.studentsAtRiskCount}\n`;
      }
      
      // 3. Memória (Simulada, poderia vir de 'teacherPreferences')
      contextStr += `\nPreferências (Memória Pedagógica):\n`;
      contextStr += `- O professor prefere atividades focadas em PBL (Project Based Learning).\n`;
      contextStr += `- O estilo de devolutiva deve ser encorajador, porém direto.\n`;

    } catch (err) {
      console.error("Erro ao obter contexto do professor:", err);
    }

    return contextStr;
  }

  /**
   * Processa uma mensagem no formato de "Copiloto"
   * e gera uma explicação da recomendação.
   */
  public static async processMessage(teacherId: string, message: string, history: any[], model: string = 'gemini-1.5-flash') {
    const teacherContext = await this.getTeacherContext(teacherId);

    const systemPrompt = `
      Você é o COPILOTO PEDAGÓGICO do EduAI Core, um assistente formidável focado no Sucesso do Aluno e produtividade do Professor.
      Seu objetivo é:
      - Ajudar na priorização diária (quem precisa de ajuda).
      - Sugerir intervenções pedagógicas baseadas em DADOS.
      - Criar, formatar ou revisar conteúdos a pedido do professor.
      - Agir de maneira consultiva ("Professor, recomendo x por causa de y").
      - TODA vez que você recomendar uma ação pedagógica importante para um aluno, você DEVE adicionar no final do texto o bloco "[EXPLICABILIDADE: {motivo curto da recomendação baseada nos dados}]".

      Abaixo está o estado atual do painel do professor (injetação de dados ao vivo):
      ${teacherContext}
    `;

    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    try {
      const response = await generateContentWrapper({
        model: model,
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4 // Temperatura mais baixa para respostas mais lógicas e precisas
        }
      });

      // Salva log para a "memória" futura
      await addDoc(collection(db, 'teacherCopilotSessions'), {
        teacherId,
        message,
        response: response.text,
        timestamp: serverTimestamp()
      });

      return response.text;
    } catch (error) {
      console.error("Erro no Copiloto:", error);
      throw error;
    }
  }

  /**
   * Gera a lista de Prioridades do Dia dinamicamente
   */
  public static async generateDailyPriorities(teacherId: string, model: string = 'gemini-1.5-flash'): Promise<{ title: string; desc: string; type: string }[]> {
    const context = await this.getTeacherContext(teacherId);
    
    const prompt = `
      Baseado no contexto abaixo, gere EXACTAMENTE 3 prioridades críticas de ação para o professor hoje.
      Retorne APENAS um array JSON válido, sem markdown envolvente. Formato:
      [
        { "title": "Ação Curta", "desc": "Justificativa de 1 linha", "type": "urgente" | "planejamento" | "correcao" }
      ]

      Contexto: ${context}
    `;

    try {
      const response = await generateContentWrapper({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.1 }
      });
      
      const cleanJson = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(cleanJson || '[]');
      } catch (parseErr) {
        console.error("Erro ao parsear prioridades JSON:", parseErr);
        return [
          { title: "Verificar Alunos em Risco", desc: "Acesse o painel de saúde para agir sobre alertas críticos.", type: "urgente" }
        ];
      }
    } catch (err) {
      console.error("Erro gerando prioridades", err);
      // Fallback
      return [
        { title: "Verificar Alunos em Risco", desc: "Acesse o painel de saúde para agir sobre alertas críticos.", type: "urgente" }
      ];
    }
  }

  /**
   * Gera um Estudo de Caso (PBL) Estruturado e salva no Banco
   */
  public static async generateAndSavePBLActivity(teacherId: string, competency: string, model: string = 'gemini-1.5-flash'): Promise<{ text: string, pblId: string }> {
    const prompt = `
      Você é um designer instrucional e especialista em Metodologias Ativas.
      Crie uma atividade de Problem-Based Learning (PBL) ou Estudo de Caso para a competência: "${competency}".
      
      Retorne um JSON estrito para o Banco de Dados com esta estrutura:
      {
        "title": "Título engajador do Caso",
        "context": "História completa descrevendo o cenário realista do problema",
        "centralChallenge": "A grande pergunta ou desafio que o aluno precisa resolver",
        "objective": "Objetivo pedagógico da atividade",
        "steps": [
          { "title": "Passo 1", "description": "Descrição do que fazer", "duration": "Tempo ex: 30 min" }
        ],
        "resources": ["Um link", "Outro material text"],
        "deliverables": ["Pitch de 5 minutos", "Documento PDF"],
        "evaluationCriteria": [
          { "criteria": "Nome da rubrica", "points": 20 }
        ],
        "marketRelation": "Como isso se aplica ao mercado de trabalho atual",
        "course": "Trilha/Curso genérico",
        "competency": "${competency}",
        "complexity": "médio",
        "duration": "Tempo total ex: 2 horas"
      }
      Notas: complexity só pode ser "fácil", "médio" ou "difícil".
    `;

    try {
      const response = await generateContentWrapper({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { 
          temperature: 0.4,
          responseMimeType: "application/json" 
        }
      });
      
      const cleanJson = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
      let pblData: any;
      try {
        pblData = JSON.parse(cleanJson || '{}');
      } catch (parseErr) {
        console.error("Erro ao parsear PBL JSON:", parseErr);
        throw new Error("A IA retornou um formato de Estudo de Caso inválido.");
      }

      // Salva no Firestore direto como LearningSituation
      const docRef = await addDoc(collection(db, 'learning_situations'), {
        ...pblData,
        createdBy: teacherId,
        createdAt: new Date().toISOString(),
        status: 'draft' // Salva como rascunho para o professor revisar depois no Gerenciamento
      });

      // Retorna uma resposta amigável para o chat
      const chatResponse = `
**Estudo de Caso Gerado e Salvo com Sucesso! 🚀**

**Título:** ${pblData.title}

**Cenário:**
${pblData.context}

**Problema e Missão:**
${pblData.centralChallenge}

*(Esta atividade foi salva automaticamente como "Rascunho" e já pode ser visualizada e editada em "Minhas SAs"!)*
      `;

      return { text: chatResponse.trim(), pblId: docRef.id };

    } catch (err) {
      console.error("Erro gerando PBL", err);
      throw new Error("Falha ao gerar e salvar o Estudo de Caso.");
    }
  }
}
