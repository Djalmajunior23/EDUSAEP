import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.Gemini_API_key || "" });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
    });
    console.log("Response text:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
