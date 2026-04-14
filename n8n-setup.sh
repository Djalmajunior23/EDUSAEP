#!/bin/bash

# Guia de Implantação n8n Automática para JuniorsStudent
# Este script instala Docker, Docker Compose e configura o n8n com as variáveis necessárias.

echo "🚀 Iniciando implantação do n8n..."

# 1. Atualizar o sistema
echo "📦 Atualizando pacotes do sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
else
    echo "✅ Docker já está instalado."
fi

# 3. Instalar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐙 Instalando Docker Compose..."
    sudo apt install docker-compose -y
else
    echo "✅ Docker Compose já está instalado."
fi

# 4. Criar diretório de trabalho
mkdir -p ~/n8n-juniors
cd ~/n8n-juniors

# 5. Criar docker-compose.yml
echo "📝 Criando docker-compose.yml..."
cat <<EOF > docker-compose.yml
version: '3.1'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=\${N8N_HOST:-localhost}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://\${N8N_HOST:-localhost}/
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - N8N_EMAIL_MODE=smtp
      - N8N_SMTP_HOST=\${SMTP_HOST}
      - N8N_SMTP_PORT=\${SMTP_PORT}
      - N8N_SMTP_USER=\${SMTP_USER}
      - N8N_SMTP_PASS=\${SMTP_PASS}
      - N8N_SMTP_SENDER=\${SMTP_SENDER}
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
EOF

# 6. Criar arquivo .env para configurações
echo "🔐 Criando arquivo .env (Edite este arquivo com seus dados)..."
cat <<EOF > .env
N8N_HOST=seu-dominio.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
SMTP_SENDER=seu-email@gmail.com
EOF

# 7. Script de Backup
echo "💾 Criando script de backup..."
cat <<EOF > backup_n8n.sh
#!/bin/bash
BACKUP_DIR="~/backups/n8n"
mkdir -p \$BACKUP_DIR
DATE=\$(date +%Y%m%d_%H%M%S)
docker run --rm --volumes-from \$(docker ps -qf "name=n8n") -v \$BACKUP_DIR:/backup ubuntu tar cvf /backup/n8n_data_\$DATE.tar /home/node/.n8n
find \$BACKUP_DIR -type f -mtime +7 -delete
echo "Backup concluído em \$BACKUP_DIR/n8n_data_\$DATE.tar"
EOF
chmod +x backup_n8n.sh

echo "✅ Configuração concluída!"
echo "👉 Para iniciar o n8n, execute: docker-compose up -d"
echo "👉 Lembre-se de editar o arquivo .env com seu domínio e credenciais de e-mail."
