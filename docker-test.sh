#!/bin/bash

echo "🔍 Test de validation du déploiement Docker SUPRSS"
echo "================================================"

# Fonction pour vérifier si un service répond
check_service() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo "⏳ Test de $name sur $url..."
    
    for i in {1..30}; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
            echo "✅ $name répond correctement"
            return 0
        fi
        echo "   Tentative $i/30..."
        sleep 2
    done
    
    echo "❌ $name ne répond pas après 60 secondes"
    return 1
}

# Vérifier que docker-compose est disponible
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose n'est pas installé"
    exit 1
fi

echo "🐳 Lancement des conteneurs..."
docker-compose up -d --build

echo "⏳ Attendre le démarrage des services..."
sleep 30

echo "📊 Statut des conteneurs:"
docker-compose ps

# Tests des services
echo ""
echo "🧪 Tests des endpoints..."

# Test de la base de données (via l'API de santé du serveur)
check_service "API de santé" "http://localhost:5000/api/health" "200"

# Test du frontend
check_service "Frontend" "http://localhost:4173" "200"

# Test de l'API backend
check_service "Backend API" "http://localhost:5000/api/auth/user" "401"

echo ""
echo "📊 Vérification des logs..."
echo "Logs du serveur (dernières 10 lignes):"
docker-compose logs --tail=10 server

echo ""
echo "📋 Résumé:"
echo "- Frontend: http://localhost:4173"
echo "- Backend API: http://localhost:5000"
echo "- Base de données: localhost:5432"

echo ""
echo "🚀 Test terminé ! Pour arrêter les services:"
echo "   docker-compose down"