
import { db } from './src/firebase.js';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const question = {
  questionUid: "Q-DISC-REP-001",
  competenciaId: "COMP-LOGICA-01",
  competenciaNome: "Lógica de Programação",
  temaId: "TEMA-REP-01",
  temaNome: "Estruturas de Repetição",
  dificuldade: "médio",
  bloom: "aplicar",
  perfilGeracao: "copiloto_pedagogico",
  tipoQuestao: "discursiva",
  enunciado: `Analise o trecho de código JavaScript abaixo:

let numeros = [10, 20, 30, 40, 50];
let resultado = 0;

for (let i = 0; i < numeros.length; i++) {
    if (numeros[i] > 25) {
        resultado += numeros[i];
    }
}

Tarefa:
1. Determine o valor final da variável resultado e explique o raciocínio aplicado.
2. Como você alteraria a estrutura condicional (if) deste código para que ele somasse apenas os números que são pares e maiores que 20? Reescreva o trecho do if necessário.`,
  respostaEsperada: "O loop for percorre o array numeros. A condição if (numeros[i] > 25) filtra os valores 30, 40 e 50. A soma resulta em 120. Para somar pares maiores que 20, a condição seria (numeros[i] > 20 && numeros[i] % 2 === 0).",
  criteriosAvaliacao: ["Análise do Código (4 pontos)", "Aplicação da Lógica (4 pontos)", "Sintaxe/Conceito (2 pontos)"],
  rubricaAvaliacao: "Análise Correta: Explica o fluxo e chega ao valor 120. Aplicação Correta: Modifica o if para (n > 20 && n % 2 === 0).",
  comentarioGabarito: "Estruturas de repetição aliadas a condicionais são ferramentas fundamentais. A lógica de paridade utiliza o operador módulo (%).",
  contextoHash: "manual_creation_001",
  tags: ["javascript", "logica-programacao", "estruturas-repeticao"],
  status: "publicado",
  revisadaPorProfessor: true,
  usoTotal: 0,
  isAiGenerated: true,
  origem: "copiloto_pedagogico",
  createdAt: new Date().toISOString(),
  atualizadoEm: new Date().toISOString()
};

async function add() {
    try {
        await addDoc(collection(db, 'questions'), question);
        console.log("Questão adicionada com sucesso!");
    } catch(e) {
        console.error(e);
    }
}

add();
