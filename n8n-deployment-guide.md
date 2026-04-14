# Guia de Implantação n8n (Docker)

Este guia contém os scripts necessários para implantar o n8n em sua nova VPS e integrá-lo com o JuniorsStudent.

## 1. Instalar Docker e Docker Compose
Execute estes comandos na sua VPS:

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y
```

## 2. Configurar o Docker Compose
Crie um arquivo chamado `docker-compose.yml`:

```yaml
version: '3.1'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=seu-dominio.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://seu-dominio.com/
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

## 3. Iniciar o n8n
```bash
docker-compose up -d
```

## 4. Configuração de Webhooks no JuniorsStudent
Após o n8n estar rodando, você deve configurar os webhooks na plataforma:

1. Acesse o n8n e crie um novo Workflow.
2. Adicione um nó **Webhook** (Método POST).
3. Copie a URL do Webhook.
4. No JuniorsStudent, configure esta URL nas variáveis de ambiente ou no painel de administração.

### Endpoints Esperados:
- `/api/n8n/forms`: Para criação de Google Forms.
- `/api/n8n/alerts`: Para notificações de alunos.
- `/api/n8n/import`: Para processamento de planilhas SIAC.

## 5. Script de Backup Automático (Opcional)
Crie um arquivo `backup_n8n.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/root/backups/n8n"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker run --rm --volumes-from $(docker ps -qf "name=n8n") -v $BACKUP_DIR:/backup ubuntu tar cvf /backup/n8n_data_$DATE.tar /home/node/.n8n
find $BACKUP_DIR -type f -mtime +7 -delete
```
