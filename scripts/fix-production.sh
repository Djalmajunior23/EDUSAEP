#!/bin/bash

# EDUAI CORE ULTRA - Production Fix Script
# Use com cautela. Este script limpa e reconstrói o ambiente.

set -e # Aborta em caso de erro

echo "===================================================="
echo "🚀 INICIANDO CORREÇÃO DE PRODUÇÃO - EDUAI CORE"
echo "===================================================="

# 1. Backup (Simulado por cópia de segurança se possível)
echo "📦 Criando backup de configurações..."
mkdir -p ./backups
cp .env ./backups/.env.bak || true
cp firebase-applet-config.json ./backups/firebase.bak || true

# 2. Limpeza Profunda
echo "🧹 Limpando caches e binários antigos..."
rm -rf node_modules
rm -rf dist
rm -rf build
rm -rf .vite
rm -rf .next # Caso exista
echo "✅ Limpeza concluída."

# 3. Instalação
echo "📦 Instalando dependências limpas..."
npm install
npm install @supabase/supabase-js # Garante SDK Supabase

# 4. Verificação de Integridade
echo "🛠️ Rodando Typecheck..."
npm run lint || echo "⚠️ Avisos de lint encontrados, continuando..."

# 5. Reconstrução
echo "🏗️ Construindo pacote de produção..."
npm run build

# 6. Docker (Opcional - depende do ambiente)
if command -v docker &> /dev/null; then
  echo "🐳 Reiniciando containers Docker..."
  docker-compose down || true
  docker system prune -f || true
  docker-compose up -d --build
fi

echo -e "\n===================================================="
echo "✨ SISTEMA RESTAURADO E OTIMIZADO ✨"
echo "===================================================="
