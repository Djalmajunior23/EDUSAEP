# Workflows do n8n (EduSAEP)

Este diretório contém os blueprints dos workflows configurados para importação rápida na sua instância do [n8n](https://n8n.io/). Esses arquivos JSON conectam a arquitetura orientada a eventos (`EventBusService.ts`) do EduSAEP aos fluxos automatizados externos, sem poluir a aplicação web com envio nativo de e-mail ou integrações Slack/Teams.

## Fluxos Disponíveis

### 1. `01-Alertas-Em-Realtime.json`
**Ativador:** Webhook via `EventBus` (`POST /webhook...`).
**Função:** Triagem de Eventos do Sistema (Eventos como `performance.below_threshold` ou `intervention.triggered`).
- Roteará o JSON que chega da EduSAEP.
- Manda notificações no Slack para a Coordenação escolar em caso de perigo de evasão/aprendizado crítico.
- Aciona disparos de e-mail ao Professor da disciplina avisando sobre trilhas de recuperação automatizadas.

### 2. `02-Relatorio-Semanal-Inteligente.json`
**Ativador:** Recorrência Crontab Automática (Sexta às 18h).
**Função:** Geração e Consolidado de BI Pedagógico Ativo.
- Baseia-se numa requisição ao Firestore (via REST) buscando o log de uso institucional daquela semana.
- Integra o node do **Google Gemini AI** diretamente no n8n.
- Emite um prompt formatando a resposta para encontrar destaques, números de engajamento e métricas de intervenções bem-sucedidas.
- Envia o relatório formatado em HTML diretamente para a Diretoria escolar (Node Google Workspace ou Email Send).

## AVISO: Migração de Notificações (Plano de Estudos)
Para o gatilho `EnviarPlanoEmail` (atualizado em `n8nService.ts`):
1. **Remova** qualquer nó que envie mensagens para **Telegram**.
2. **Adicione** um nó de **Gmail** ou **SMTP**.
3. Configure o e-mail para utilizar a variável de template contendo nome do aluno, ID da submissão e o plano de estudos gerado.
4. O payload contém `studentEmail`, `studentName` e `plan`. Utilize esses campos obrigatórios para compor a mensagem.
- Envia o relatório formatado em HTML diretamente para a Diretoria escolar (Node Google Workspace ou Email Send).

---

## Como Importar no n8n

1. Configure e inicie a sua instância n8n local, ou abra o seu workspace n8n em Cloud.
2. Crie ou abra um novo workflow em branco.
3. No painel principal no canto superior (ou no menu de configurações central), clique na opção **"Import from File..."** (Importar de um Arquivo).
4. Selecione qual arquivo `.json` deste diretório deseja implantar.
5. Todo o pipeline de blocos (Nodes) e setas se desenhará automaticamente em seu canvas.
6. Substitua as credenciais e substitua a URL do WebHook do painel e adicione na classe do TypeScript `src/services/eventBusService.ts` nos gatilhos!

*Sempre ative a chavinha "Active" no canto superior de seus workflows no n8n para que eles fiquem vigiando conexões reais e ativem os Webhooks de Produção.*
