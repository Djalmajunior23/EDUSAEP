# Guia de Automações n8n - EduAI Core

Este diretório contém os templates JSON para reconstruir todas as automações do sistema EduAI Core no seu n8n.

## Como Importar

1. Abra o seu n8n.
2. Crie um novo workflow.
3. No menu superior direito (três pontos), clique em **Import from File...** ou copie o conteúdo do arquivo JSON e cole diretamente na tela do n8n.
4. Salve e ative o workflow.

## Workflows Disponíveis

### 1. EduAI Core - Alertas e Planos (`edusaep-study-plan.json`)
Este workflow recebe notificações do sistema quando:
- Um **Plano de Aula** é gerado pelo professor.
- Uma **Recomendação Pedagógica** é gerada para um aluno.
- Um **Plano de Recuperação** é gerado.

**Configuração necessária:**
- Atualize a URL do Webhook gerada pelo n8n nas configurações globais do EduAI Core (Painel Admin -> Configurações -> Webhook Global) ou no perfil do usuário.
- Configure os nós de notificação (ex: Telegram, Slack, Email) com suas credenciais.

### 2. EduAI Core - Importação SIAC (`import-siac.json`)
Este workflow é responsável por receber arquivos de planilhas (Excel/CSV) enviados pela tela de "Importação de Dados" do EduAI Core, processá-los e enviá-los de volta para a API do sistema.

**Configuração necessária:**
- Atualize a URL do Webhook gerada pelo n8n nas configurações globais do EduAI Core.
- Configure o nó "Enviar para EduAI Core" com a URL correta da sua API de importação.

### 3. EduAI Core - Formulários Externos (`external-forms.json`)
Este workflow integra formulários externos (como Google Forms) com a plataforma de simulados.

**Configuração necessária:**
- Configure o gatilho (Trigger) para o seu provedor de formulários (ex: Google Forms Trigger).
- Mapeie os campos corretamente no nó "Enviar para EduAI Core".
- A URL de destino deve apontar para o endpoint de webhooks da sua aplicação EduAI Core (`/api/webhooks/forms`).

## Atualizações no Código

O código do sistema foi atualizado para **não usar mais URLs fixas (hardcoded)**. Agora, todas as chamadas para o n8n buscam a URL do Webhook configurada no perfil do usuário ou, caso não exista, a URL configurada globalmente pelo administrador.

Para configurar a URL global:
1. Acesse o sistema com uma conta de Administrador.
2. Vá em **Configurações**.
3. Preencha o campo **Webhook Global (n8n / Automação)** com a URL do seu n8n.
4. Clique em **Testar** para garantir que a conexão está funcionando.
