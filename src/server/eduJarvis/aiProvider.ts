import { GoogleGenerativeAI } from "@google/generative-ai";
import { CostMode } from "../../types/eduJarvisTypes";

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  context?: Record<string, unknown>;
  responseFormat?: 'json' | 'text';
  model?: string;
  image?: string; // Base64
  costMode?: CostMode;
}

export interface AIResponse {
  text: string;
  metadata?: Record<string, unknown>;
}

// In this environment, we use GEMINI_API_KEY from environment variables.
export async function callAI(request: AIRequest): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured in backend environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Model selection based on costMode
  let modelName = "gemini-1.5-flash";
  if (request.costMode === "avancado") {
    modelName = "gemini-1.5-pro";
  }

  const model = genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction: request.systemPrompt,
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      responseMimeType: request.responseFormat === 'json' ? "application/json" : "text/plain",
      maxOutputTokens: request.costMode === "avancado" ? 4096 : 2048
    }
  });

  try {
    let promptParts: any[] = [request.userPrompt];
    
    if (request.image) {
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
        model: modelName,
        costMode: request.costMode || "normal"
      }
    };
  } catch (error) {
    console.error("[EduJarvis AI Provider] Error:", error);
    throw new Error("Falha ao comunicar com a inteligência artificial eduJarvis.");
  }
}
