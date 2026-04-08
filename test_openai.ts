import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function run() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello" }],
    });
    console.log("Response text:", completion.choices[0].message.content);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
