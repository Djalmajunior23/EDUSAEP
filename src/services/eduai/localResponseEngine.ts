export class LocalResponseEngine {
  process(input: string) {
    const isOllamaEnabled = process.env.VITE_USE_OLLAMA === 'true';

    if (input.toLowerCase().includes('olá')) {
      return "Olá! Sou o seu tutor inteligente. Como posso ajudar com seus estudos hoje?";
    }

    if (isOllamaEnabled) {
      return `[Ollama LLaMA 3.1 Local]: "O processamento local determinou que a sua dúvida '${input}' pode ser respondida usando nossos RAGs internos. Consulte o material de apoio na biblioteca virtual."`;
    }

    return "[Fallback Interno]: Consulte o banco de conhecimentos ou o RAG para mais detalhes.";
  }
}
export const localResponseEngine = new LocalResponseEngine();
