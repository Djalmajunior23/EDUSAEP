
import { generateSingleQuestion } from "./src/services/examService.js";

async function run() {
  try {
    const question = await generateSingleQuestion({
      theme: "Gerenciamento de Bancos de Dados",
      competency: "Modelagem de Dados",
      difficulty: "médio",
      type: "objetiva",
      bloomTaxonomy: "aplicar"
    });
    console.log(JSON.stringify(question, null, 2));
  } catch (e) {
    console.error(e);
  }
}
run();
