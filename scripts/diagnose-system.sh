#!/bin/bash

# EDUAI CORE ULTRA - Production Diagnostic Script
echo "===================================================="
echo "🔍 DIAGNÓSTICO DE SISTEMA - EDUAI CORE ULTRA"
echo "===================================================="

# 1. Ambiente
echo "--- AMBIENTE ---"
node -v
npm -v
docker -v
docker-compose --version

# 2. Status Docker
echo -e "\n--- CONTAINERS ATIVOS ---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 3. Configurações
echo -e "\n--- VERIFICAÇÃO DE ARQUIVOS CRÍTICOS ---"
files=(".env" "package.json" "vite.config.ts" "firestore.rules" "firebase-applet-config.json")
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file encontrado"
  else
    echo "❌ $file AUSENTE"
  fi
done

# 4. Build
echo -e "\n--- STATUS DO BUILD ---"
if [ -d "dist" ]; then
  echo "✅ Pasta /dist existe"
  ls -lh dist | head -n 5
else
  echo "❌ Pasta /dist NÃO ENCONTRADA. Execute npm run build."
fi

# 5. Logs Recentes (Backend)
echo -e "\n--- ÚLTIMOS LOGS DO BACKEND ---"
if [ "$(docker ps -q -f name=backend)" ]; then
  docker logs --tail 20 backend
else
  echo "⚠️ Container 'backend' não está rodando."
fi

echo -e "\n===================================================="
echo "✅ Diagnóstico Concluído."
