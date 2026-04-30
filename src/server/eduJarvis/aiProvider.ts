import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  context?: Record<string, unknown>;
  responseFormat?: 'json' | 'text';
  model?: string;
  image?: string; // Base64
}

export interface AIResponse {
  text: string;
  metadata?: Record<string, unknown>;
}

// In this environment, we use GEMINI_API_KEY from environment variables.
// The user specified "IA própria via backend", so we encapsulate it here.
export async function callAI(request: AIRequest): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured in backend environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash for reliability and to avoid 5 NOT_FOUND errors
  const modelName = "gemini-1.5-flash";
  
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction: request.systemPrompt,
    generationConfig: request.responseFormat === 'json' ? { responseMimeType: "application/json" } : undefined
  });

  try {
    let promptParts: any[] = [request.userPrompt];
    
    if (request.image) {
      // Remove data:image/jpeg;base64, prefix if exists
      const base64Data = request.image.split(',')[1] || request.image;
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    const text = response.text();

    return {
      text,
      metadata: {
        timestamp: new Date().toISOString(),
        model: modelName
      }
    };
  } catch (error) {
    console.error("[EduJarvis AI Provider] Error:", error);
    throw new Error("Falha ao comunicar com a inteligência artificial eduJarvis.");
  }
}
