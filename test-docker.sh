#!/bin/bash

echo "🧪 Test complet du déploiement Docker SUPRSS"
echo "============================================="

# Fonction pour attendre qu'un service réponde
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Attente de $name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $name: Opérationnel"
            return 0
        fi
        
        echo "   Tentative $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $name: Timeout après ${max_attempts} tentatives"
    return 1
}

# Nettoyer les anciens conteneurs
echo "🧹 Nettoyage des anciens conteneurs..."
docker-compose down -v 2>/dev/null || true

echo ""
echo "🚀 Démarrage de tous les services..."
./start-docker.sh

echo ""
echo "⏳ Attente du démarrage complet (60 secondes)..."
sleep 60

echo ""
echo "🔍 Vérification de l'état des conteneurs..."
docker-compose ps

echo ""
echo "🧪 Tests des endpoints..."

# Test principal - Application via proxy
wait_for_service "Application principale (via Nginx)" "http://localhost:80"

# Test API via proxy  
wait_for_service "API via proxy" "http://localhost:80/api/health"

# Test direct frontend
wait_for_service "Frontend direct" "http://localhost:4173/health" 

# Test direct backend
wait_for_service "Backend direct" "http://localhost:5000/api/health"

echo ""
echo "📊 Tests de fonctionnalité..."

# Test de l'authentification
echo "🔐 Test endpoint d'authentification..."
auth_response=$(curl -s -w "%{http_code}" http://localhost:80/api/auth/user)
if echo "$auth_response" | grep -q "401"; then
    echo "✅ Authentification: Fonctionne (401 Unauthorized attendu)"
else
    echo "❌ Authentification: Réponse inattendue"
fi

# Test des flux RSS
echo "📡 Test endpoint des flux..."
feeds_response=$(curl -s -w "%{http_code}" http://localhost:80/api/feeds)
if echo "$feeds_response" | grep -q "401"; then
    echo "✅ API Feeds: Fonctionne (401 Unauthorized attendu)"
else
    echo "❌ API Feeds: Réponse inattendue"
fi

echo ""
echo "📋 Résumé des logs récents..."
echo "--- Logs Nginx ---"
docker-compose logs --tail=5 nginx 2>/dev/null || echo "Nginx non accessible"

echo "--- Logs Server ---"
docker-compose logs --tail=5 server 2>/dev/null || echo "Server non accessible"

echo "--- Logs Client ---"
docker-compose logs --tail=5 client 2>/dev/null || echo "Client non accessible"

echo "--- Logs Database ---"
docker-compose logs --tail=5 db 2>/dev/null || echo "Database non accessible"

echo ""
echo "🎯 URLs de test:"
echo "   Application: http://localhost"
echo "   API Health:  http://localhost/api/health"
echo "   Frontend:    http://localhost:4173"
echo "   Backend:     http://localhost:5000"

echo ""
echo "✅ Test terminé !"
echo "💡 Pour arrêter: docker-compose down"
echo "💡 Pour nettoyer: docker-compose down -v"