#!/bin/bash

echo "🚀 SUPRSS - Démarrage avec Docker Compose"
echo "=========================================="

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    echo "   Veuillez installer Docker et Docker Compose"
    exit 1
fi

# Vérifier que Docker est en cours d'exécution
if ! docker info &> /dev/null; then
    echo "❌ Docker n'est pas en cours d'exécution"
    echo "   Veuillez démarrer Docker"
    exit 1
fi

# Mode de démarrage
MODE=${1:-production}

echo "🔧 Mode: $MODE"

if [ "$MODE" = "development" ] || [ "$MODE" = "dev" ]; then
    echo "🔄 Démarrage en mode développement..."
    echo "   Port: http://localhost:3000"
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d --build
else
    echo "🚀 Démarrage en mode production..."
    echo "   Port: http://localhost:80"
    docker-compose up -d --build
fi

echo ""
echo "⏳ Attente du démarrage des services..."
sleep 10

echo ""
echo "📊 État des services:"
docker-compose ps

echo ""
echo "🧪 Test de santé des services..."

# Test du proxy nginx
if curl -s http://localhost:${MODE_PORT:-80}/health > /dev/null; then
    echo "✅ Nginx proxy: OK"
else
    echo "❌ Nginx proxy: Erreur"
fi

# Test de l'API
if curl -s http://localhost:${MODE_PORT:-80}/api/health > /dev/null; then
    echo "✅ API Backend: OK"
else
    echo "❌ API Backend: Erreur"
fi

# Test du frontend
if curl -s http://localhost:${MODE_PORT:-80}/ > /dev/null; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: Erreur"
fi

echo ""
echo "🎉 SUPRSS est maintenant accessible:"
if [ "$MODE" = "development" ] || [ "$MODE" = "dev" ]; then
    echo "   🌐 Application: http://localhost:3000"
    echo "   📡 API directe: http://localhost:3000/api"
else
    echo "   🌐 Application: http://localhost"
    echo "   📡 API directe: http://localhost/api"
fi

echo ""
echo "📋 Commandes utiles:"
echo "   Voir les logs:        docker-compose logs -f"
echo "   Arrêter:             docker-compose down"
echo "   Redémarrer:          docker-compose restart"
echo "   Reconstruire:        docker-compose up -d --build"
echo "   Supprimer tout:      docker-compose down -v"