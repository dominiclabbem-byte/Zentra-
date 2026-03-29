#!/bin/bash

# ============================================
# 🚀 Zentra Auto-Sync con GitHub
# ============================================
# Vigila cambios en el proyecto y hace push
# automático a GitHub cada vez que guardas.
# ============================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="main"
COOLDOWN=5  # segundos de espera tras el último cambio antes de hacer push

echo ""
echo "🚀 Zentra Auto-Sync iniciado"
echo "📁 Carpeta: $PROJECT_DIR"
echo "🌿 Rama: $BRANCH"
echo "⏱️  Cooldown: ${COOLDOWN}s tras último cambio"
echo "--------------------------------------------"
echo "✅ Vigilando cambios... (Ctrl+C para detener)"
echo ""

cd "$PROJECT_DIR"

# Verificar que git esté configurado
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Error: Esta carpeta no es un repositorio git."
  exit 1
fi

# Verificar que fswatch esté instalado
if ! command -v fswatch &> /dev/null; then
  echo "⚠️  fswatch no está instalado. Instalando..."
  brew install fswatch
fi

TIMER_PID=""

do_sync() {
  cd "$PROJECT_DIR"

  # Verificar si hay cambios
  if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    echo "ℹ️  Sin cambios nuevos."
    return
  fi

  TIMESTAMP=$(date "+%d/%m/%Y %H:%M:%S")
  echo ""
  echo "📤 [$TIMESTAMP] Subiendo cambios a GitHub..."

  git add .

  # Obtener lista de archivos cambiados para el mensaje
  CHANGED=$(git diff --cached --name-only | head -3 | tr '\n' ', ' | sed 's/,$//')
  if [ -z "$CHANGED" ]; then
    CHANGED="varios archivos"
  fi

  git commit -m "🔄 Auto-sync [$TIMESTAMP]: $CHANGED"

  if git push origin "$BRANCH"; then
    echo "✅ ¡Sincronizado con GitHub exitosamente!"
  else
    echo "❌ Error al hacer push. Verifica tu conexión o permisos."
  fi
  echo ""
}

# Función que se llama cada vez que fswatch detecta un cambio
trigger_sync() {
  # Matar timer anterior si existe (debounce)
  if [ -n "$TIMER_PID" ] && kill -0 "$TIMER_PID" 2>/dev/null; then
    kill "$TIMER_PID" 2>/dev/null
  fi

  # Iniciar nuevo timer
  (sleep "$COOLDOWN" && do_sync) &
  TIMER_PID=$!
}

# Iniciar vigilancia (ignorando node_modules, .git, dist)
fswatch \
  --exclude "node_modules" \
  --exclude ".git" \
  --exclude "dist" \
  --exclude ".DS_Store" \
  --exclude "*.log" \
  -r "$PROJECT_DIR" | while read -r event; do
    trigger_sync
  done
