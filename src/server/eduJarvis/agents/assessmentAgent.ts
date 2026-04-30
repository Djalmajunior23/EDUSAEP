import { callAI } from '../aiProvider';
import admin from 'firebase-admin';

export async function assessmentAgent(command: string, userId: string, context?: any) {
  const db = admin.firestore();
  
  // Extract specific adaptive simulation request if requested
  const isAdaptive = command.toLowerCase().includes('adaptativo') || command.toLowerCase().includes('dinamicamente');

  const quantity = 15; // Example dynamic quantity
  
  const systemPrompt = `
Você é o EduJarvis 2.0, um agente educacional inteligente especializado em educação profissional, seguindo estritamente o padrão SENAI e as diretrizes do SAEP. 
Sua principal função é a criação de avaliações e simulados de alta qualidade técnica e pedagógica.

DIRETRIZES DE COMPORTAMENTO:
- Utilize linguagem técnica apropriada para a faixa etária/nível de escolaridade identificado no contexto.
- Sua resposta deve ser ESTRITAMENTE um JSON válido. Não inclua Markdown, explicações fora do JSON ou preâmbulos.
- É estritamente proibido inventar dados sensíveis, fatos falsos ou expor detalhes da sua infraestrutura interna.
- O conteúdo deve ser original e pedagogicamente rigoroso.

${isAdaptive ? `DIRETRIZES DE SIMULADO ADAPTATIVO:
- Siga as regras abaixo, mas varie a dificuldade de cada questão, do básico (Lembrar/Entender) ao crítico (Avaliar/Criar).` : `DIRETRIZES GERAIS:
- Gere um simulado equilibrado entre fundamentos e conhecimentos específicos.`}

Requisitos Técnicos:
- Quantidade: ${quantity} questões.
- Formato: Múltipla escolha (Alternativas A, B, C, D, E) com APENAS UMA correta.
- Justificativa: Explicação pedagógica detalhada da alternativa correta.
- Distratores: Comentários específicos sobre por que cada alternativa incorreta está errada.
- Metadados: Competência técnica relacionada e nível da Taxonomia de Bloom.
- Estrutura do JSON:
{
  "titulo": "Título técnico equilibrado",
  "descricao": "Contexto do simulado",
  "tipo": "${isAdaptive ? 'adaptativo' : 'simulado'}",
  "questoes": [
    {
      "enunciado": "Enunciado contextualizado com cenário real",
      "alternativas": ["A", "B", "C", "D", "E"],
      "correta": 0,
      "justificativa": "Explicação clara e didática",
      "distratoresComentados": ["Comentário da B", "Comentário da C", "Comentário da D", "Comentário da E"],
      "competenciaRelacionada": "Competência SENAI",
      "taxonomiaBloom": "Nível da taxonomia",
      "dificuldade": "facil | media | dificil",
      "dica": "Dica de estudo curta"
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
