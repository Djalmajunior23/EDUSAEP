import { callAI } from '../aiProvider';
import admin from 'firebase-admin';

export async function assessmentAgent(command: string, userId: string, context?: any) {
  const db = admin.firestore();
  
  // Extract specific adaptive simulation request if requested
  const isAdaptive = command.toLowerCase().includes('adaptativo') || command.toLowerCase().includes('dinamicamente');

  const systemPrompt = `
Você é o EduJarvis, Especialista em Avaliação Educacional no padrão SAEP e Especialista em Criação de Simulados Inteligentes.
Sua tarefa é gerar um simulado de alta qualidade.

${isAdaptive ? `DIRETRIZES DE SIMULADO ADAPTATIVO:
- O usuário pediu um simulado adaptativo. Você deve gerar uma diversidade de níveis de dificuldade desde o nível Iniciante (Taxonomia: Lembrando, Entendendo) até Especialista (Taxonomia: Avaliando, Criando).
- Inclua metadados claros para cada questão, para que o motor na ponta saiba qual puxar dependendo do erro/acerto anterior.` : `DIRETRIZES GERAIS:
- Gere um simulado bem equilibrado, adequado ao nível técnico (fácil, médio, difícil).`}

Requisitos Obrigatórios:
- O simulado DEVE conter questões bem elaboradas. A proporção ideal para um simulado longo é de 40 questões, divididas entre fundamentos e especialidades. Se o usuário pedir um simulado completo sem especificar a quantidade, tente gerar o máximo de questões possíveis (como 15 ou 20) sem quebrar o JSON. Se ele especificar uma quantidade, RESPEITE (ex: 15 questões). 
- Questões estilo múltipla escolha (alternativas A, B, C, D, E) com APENAS UMA correta.
- Justifique detalhadamente por que a correta é correta.
- Comente os distratores explicando por que as outras opções são incorretas.
- Defina a Competência e o Nível da Taxonomia de Bloom para CADA questão.
- Evite duplicação de conceitos.

VOCÊ DEVE RETORNAR ESTRITAMENTE UM JSON COM A SEGUINTE ESTRUTURA E GARANTIR QUE "questoes" POSSUA ELEMENTOS:
{
  "titulo": "Título do Simulado",
  "descricao": "Descrição curta",
  "tipo": "${isAdaptive ? 'adaptativo' : 'simulado'}",
  "questoes": [
    {
      "enunciado": "Texto da questão...",
      "alternativas": ["A", "B", "C", "D", "E"],
      "correta": 0, // Índice numérico da alternativa correta (0 a 4)
      "dificuldade": "facil|media|dificil",
      "competenciaRelacionada": "Nome da competência principal",
      "taxonomiaBloom": "Nível (ex: Aplicação)",
      "justificativa": "Explicação completa e comentários de distratores",
      "dica": "Dica rápida"
    }
  ]
}
`;

  const userPrompt = `
Solicitação de Simulado: ${command}
Usuário: ${userId}
Contexto do Aluno/Turma: ${context ? JSON.stringify(context) : 'Nenhum'}
`;

  const aiResponse = await callAI({ systemPrompt, userPrompt, responseFormat: 'json' });

  let parsedResponse: any = {};
  if (aiResponse.text) {
    try {
      parsedResponse = JSON.parse(aiResponse.text);
    } catch(err) {
      console.error("Erro ao fazer o parse do JSON do simulado:", err);
      parsedResponse = { erro: "O assistente não retornou um JSON válido." };
    }
  }

  const questoes = parsedResponse.questoes && Array.isArray(parsedResponse.questoes) ? parsedResponse.questoes : [];

  if (questoes.length === 0 && !parsedResponse.erro) {
    throw new Error("A IA não retornou nenhuma questão. O formato gerado pode ser inválido.");
  }

  // Save to Firestore as "rascunho" ou published relying on needs
  const docRef = await db.collection('simulados').add({
    titulo: parsedResponse.titulo || `Simulado EduJarvis - ${new Date().toLocaleDateString()}`,
    criadoPor: userId,
    descricao: parsedResponse.descricao || 'Simulado gerado por IA',
    dadosFormatoJson: parsedResponse,
    quantidadeQuestoes: questoes.length,
    tipo: parsedResponse.tipo || 'simulado',
    status: 'rascunho', // O professor precisa revisar
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    response: `Gerei o simulado "**${parsedResponse.titulo || 'Simulado'}**" com sucesso.\nSalvo como rascunho com ${questoes.length} questões.\nVocê pode revisá-lo na seção de Gestão de Avaliações.`,
    actionType: 'GERAR_SIMULADO' as any,
    data: {
      generatedId: docRef.id,
      json: parsedResponse
    }
  };
}
