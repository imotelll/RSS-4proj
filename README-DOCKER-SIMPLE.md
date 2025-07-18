# 🐳 Déploiement Ultra-Simple avec Docker

## 🚀 Démarrage en 2 commandes

```bash
# 1. Télécharger et lancer
git clone <votre-repo>
cd suprss

# 2. Démarrer l'application complète
./start-docker.sh
```

**C'est tout !** Votre application est accessible sur http://localhost

## 🎯 Que fait le script ?

- ✅ **Base de données PostgreSQL** automatiquement configurée
- ✅ **Backend API** avec toutes les dépendances  
- ✅ **Frontend React** compilé et optimisé
- ✅ **Reverse proxy Nginx** pour tout unifier sur le port 80
- ✅ **Configuration réseau** automatique entre les services
- ✅ **Health checks** pour s'assurer que tout fonctionne
- ✅ **Variables d'environnement** pré-configurées et sécurisées

## 📱 Accès à l'application

- **Application complète**: http://localhost
- **API directe**: http://localhost/api
- **WebSocket**: http://localhost/ws

## 🔧 Modes disponibles

```bash
# Mode production (défaut)
./start-docker.sh

# Mode développement avec hot-reload
./start-docker.sh development
```

## 🛠️ Commandes de gestion

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Voir l'état des services
docker-compose ps

# Redémarrer un service
docker-compose restart server

# Arrêter tout
docker-compose down

# Supprimer et recommencer à zéro
docker-compose down -v && ./start-docker.sh
```

## 🔍 Dépannage

Si quelque chose ne fonctionne pas :

```bash
# 1. Vérifier l'état des services
docker-compose ps

# 2. Voir les logs d'erreur
docker-compose logs

# 3. Redémarrer complètement
docker-compose down -v
./start-docker.sh
```

## 🌐 Déploiement sur serveur

Pour déployer sur votre serveur (4proj.lpasr.fr) :

1. **Copier les fichiers** sur votre serveur
2. **Ouvrir le port 80** dans le firewall
3. **Lancer** `./start-docker.sh`

L'application sera accessible via votre nom de domaine !

## 📦 Contenu inclus

- `docker-compose.yml` - Configuration principale
- `nginx.conf` - Configuration du reverse proxy
- `start-docker.sh` - Script de démarrage automatique
- Tous les Dockerfiles optimisés

**Aucune autre installation requise** - Docker fait tout !

---

🎉 **Votre lecteur RSS collaboratif SUPRSS est prêt à l'emploi !**