# Guia de Configuração do Workflow n8n - Integração de Simulados Externos

Este guia descreve como configurar o workflow no n8n para integrar formulários externos (como Google Forms) com a plataforma de simulados.

## 1. Visão Geral do Fluxo

O workflow deve:
1.  **Receber** a resposta do formulário (via Webhook ou Trigger de Planilha).
2.  **Validar** os campos obrigatórios (E-mail, Matrícula, Respostas).
3.  **Enviar** os dados para a API da plataforma via Webhook.

## 2. Configuração do Webhook na Plataforma

A plataforma está preparada para receber dados no seguinte endpoint:
`https://<SUA_URL_DA_APP>.run.app/api/webhooks/forms`

**Método:** `POST`
**Headers:**
- `Content-Type: application/json`
- `x-api-key: <SUA_CHAVE_API_CONFIGURADA>` (Opcional, se implementado)

## 3. Estrutura do JSON Esperado

O n8n deve enviar um JSON com a seguinte estrutura:

```json
{
  "formId": "ID_DO_FORMULARIO_NA_PLATAFORMA",
  "alunoEmail": "email@aluno.com",
  "alunoMatricula": "123456",
  "alunoNome": "Nome do Aluno",
  "turma": "Turma A",
  "respostas": {
    "1": "A",
    "2": "C",
    "3": "B",
    ...
  },
  "submittedAt": "2023-10-27T10:00:00Z"
}
```

## 4. Passos no n8n

### Passo 1: Gatilho (Trigger)
Use o nó **Google Forms Trigger** ou **Google Sheets Trigger** para capturar novas respostas.

### Passo 2: Mapeamento de Campos (Set Node)
Mapeie as colunas da planilha para os campos esperados pela API:
- `alunoEmail` -> Coluna de E-mail
- `alunoMatricula` -> Coluna de Matrícula (se houver)
- `alunoNome` -> Coluna de Nome
- `respostas` -> Crie um objeto onde a chave é o número da questão e o valor é a alternativa selecionada.

### Passo 3: Envio para a Plataforma (HTTP Request)
Use o nó **HTTP Request**:
- **Method:** `POST`
- **URL:** `https://<SUA_URL_DA_APP>.run.app/api/webhooks/forms`
- **Body Parameters:** Envie o JSON mapeado no passo anterior.

## 5. Tratamento de Erros
Recomendamos adicionar um nó de **Error Trigger** no n8n para alertar caso o envio para a plataforma falhe (ex: `formId` inválido).

## 6. Sincronização Manual
Caso o webhook falhe, o professor pode clicar em "Sincronizar Respostas" na gestão do simulado. Isso fará com que a plataforma chame o n8n solicitando todas as respostas pendentes.
Para isso, o n8n deve ter um segundo workflow com um Webhook de entrada que retorne a lista de todas as respostas.
