export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  type: 'gemini' | 'openai' | 'groq' | 'together' | 'cohere';
}

export class AIProviderManager {
  // Implementation will follow
}
