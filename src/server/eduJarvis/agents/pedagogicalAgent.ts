import { callAI } from '../aiProvider';

export async function pedagogicalAgent(command: string, context?: any) {
  const memoryInfo = context?.memory ? `
MEMÓRIA PEDAGÓGICA DO USUÁRIO:
- Preferências: ${JSON.stringify(context.memory.preferencias)}
- Últimos Insights: ${context.memory.insights?.map((i: any) => i.texto).join(', ') || 'Nenhum'}
` : '';

  const systemPrompt = `
Você é o EduJarvis, um assistente educacional didático e proativo.
Sua missão é explicar conteúdos de forma clara, progressiva e adaptada ao nível do usuário.
${memoryInfo}
Use português do Brasil, tom encorajador e formatação Markdown para facilitar a leitura.
Se o usuário tiver preferências registradas na memória, respeite-as (ex: tom, nível de detalhamento).
`;

  const userPrompt = `
Comando do usuário: ${command}
Contexto extra: ${context ? JSON.stringify(context) : 'Nenhum'}
`;

  return await callAI({ systemPrompt, userPrompt });
}
