# Fluxos de Automação N8N - EduAI Core ULTRA

Para que a engrenagem do Gêmeo Digital, do Copiloto Pedagógico e da Sala de Comando atinjam autonomia de processamento, as Cloud Functions desenvolvidas podem e devem ser conectadas a um fluxo n8n para rodarem em *background* sem a necessidade de um *Client* (Frontend browser) engatilhar a demanda. 

## Arquitetura de Comunicação n8n <-> Firebase Cloud Functions

O n8n vai agir via nós do tipo HTTP Request contra os Callables do Firebase, além de escutar nós de Webhook vindos também do Firebase quando algo global muda (como o Risco de uma turma inteira).

### 1- Fluxo Recoronrente: Recálculo Semanal em Lote (CronJob)

**Objetivo:** Uma vez por semana (exemplo: Sexta-feira às 18h), o n8n força o processamento agregador da classe via HTTP Request e atualiza o `WeeklySummary`.

*   **Node 1: Cron (Schedule Trigger)** -> Executa a cada sexta-feira.
*   **Node 2: HTTP Request** -> Dispara para Firebase Callable.
    *   Método: `POST`
    *   URL: `https://[REGION]-[PROJECT_ID].cloudfunctions.net/runPedagogicalEngineForClass`
    *   Body: `{ "data": { "classId": "id-da-turma-aqui" } }`
*   **Node 3: If Node** -> Verifica se `.data.processedClassId` foi sucesso.
*   **Node 4: Discord / Slack / API WhatsApp (Node)** -> Notifica ao Professor Supervisor do curso:
    *   *"📊 EduAI Core: O processamento de saúde da Turma X foi finalizado. O painel está atualizado para você analisar as recomendações da sua próxima aula segunda-feira."*

### 2- Fluxo Reativo: Automação de Intervenção Pedagógica (Risco Crítico)

**Objetivo:** Quando uma Função nativa de `onUpdate` no Firestore detectar que o `ClassHealthSnapshot` abaixou de status (Ex: de "ATENÇÃO" para "CRÍTICO"), a Cloud function Firebase enviará um Payload p/ o Webhook N8N para disparar uma cadeia de eventos no mundo físico.

*   **Node 1: Webhook Trigger (N8N Endpoint)** -> Recebe `POST` payload do Trigger Firebase. Ex:`{ classId: 'abc', newHealthScore: 35, affectedStudentsCount: 14 }`.
*   **Node 2: Switch Node** -> Roteamento baseado no Score. Se o score está crítico, vai pro fluxo de ação.
*   **Node 3: API do ERP/LMS Escolar** -> Resgata dados de contato de Coordenadores.
*   **Node 4: E-mail Sender (N8n)** -> Dispara e-mail de "Alerta Vermelho" da Turma solicitando comitê de avaliação extraordinário para a Turma.

---
### Chaves de Operação Simulada

No dashboard do Admin, nós configuramos um componente chamado `PedagogicalEngineSimulator.tsx`. Ele possui o botão primário: **Processar Turma Inteira**. Você pode testar ele em tempo real! Ele utiliza o `firebase/functions` HTTPS Callable direto pelo Client React, emulando perfeitamente a chamada descrita no "Fluxo Recorrente" do N8N acima, imprimindo logs em tela quando a ação é concretizada com sucesso pela Cloud Function.
