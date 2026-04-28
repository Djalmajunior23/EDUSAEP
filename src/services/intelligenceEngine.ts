import { generateAIContent } from './aiService';

export const intelligenceEngine = {
  async process(prompt: string, userId: string): Promise<{ response: string }> {
    const response = await generateAIContent({
      prompt,
      task: 'socratic_tutor',
      systemInstruction: 'Atue como um Tutor Socrático altamente pedagógico. Não dê respostas prontas. Faça perguntas que guiem o aluno ao raciocínio correto.'
    });
    return { response: response.text };
  }
};
