import OpenAI from "openai";
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
async function run() {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Hello" }],
    });
    console.log("Response text:", completion.choices[0].message.content);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
