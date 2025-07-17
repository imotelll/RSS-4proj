# SUPRSS - Déploiement Docker

## Déploiement rapide avec Docker

SUPRSS peut être entièrement déployé avec Docker en une seule commande. Aucune installation manuelle n'est requise.

### Prérequis

- Docker et Docker Compose installés sur votre système

### Lancement

```bash
# Cloner le projet
git clone https://github.com/azure509/RSS-Project.git
cd RSS-Project

# Lancer l'application complète
docker-compose up --build

# Ou en mode détaché (arrière-plan)
docker-compose up -d --build

# Pour suivre les logs en temps réel
docker-compose logs -f
```

### Accès à l'application

Une fois les conteneurs démarrés :

- **Frontend** : http://localhost:4173
- **Backend API** : http://localhost:5000
- **Base de données** : PostgreSQL sur localhost:5432

### Architecture Docker

L'application utilise 3 conteneurs :

1. **`db`** : PostgreSQL 15 avec données persistantes
2. **`server`** : Backend Node.js avec migration automatique de la base
3. **`client`** : Frontend React servi par Nginx avec proxy API

### Migration automatique

Le conteneur serveur exécute automatiquement `drizzle-kit push` au démarrage pour créer/mettre à jour le schéma de base de données.

### Configuration Google OAuth

Pour activer l'authentification Google, ajoutez les variables suivantes dans votre fichier `.env` :

```env
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
```

**URLs de callback autorisées à configurer dans Google Cloud Console :**

- **Développement local** : `http://localhost:5000/api/auth/google/callback`
- **Docker local** : `http://localhost:4173/api/auth/google/callback`
- **Production** : `https://4proj.lpasr.fr/api/auth/google/callback`

Pour configurer le domaine de production, ajoutez dans votre `.env` :
```env
GOOGLE_CALLBACK_URL=https://4proj.lpasr.fr/api/auth/google/callback
```

**Étapes pour configurer Google OAuth :**

1. Allez sur https://console.cloud.google.com/
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ ou Google OAuth2
4. Créez des identifiants OAuth 2.0
5. Ajoutez les URLs de callback autorisées selon votre environnement
6. Copiez le Client ID et Client Secret dans votre fichier .env

### Résolution des problèmes de build

**Problème résolu** : Séparation des builds client/serveur
- Le frontend utilise uniquement `vite build` 
- Le backend utilise `tsx` directement sans compilation esbuild
- Aucune dépendance croisée entre les conteneurs
- Script de démarrage intelligent avec gestion des migrations

### Variables d'environnement

Les variables sont définies directement dans `docker-compose.yml` pour un déploiement autonome :

- Base de données : `suprss:suprsspass@db:5432/suprssdb`
- Session secret : `docker-session-secret-change-in-production`
- Domaines autorisés : `localhost:4173,localhost:5000`

### Arrêt

```bash
# Arrêter les conteneurs
docker-compose down

# Arrêter et supprimer les volumes (données perdues)
docker-compose down -v
```

### Debugging et Logs

```bash
# Voir tous les logs
docker-compose logs

# Voir les logs d'un service spécifique
docker-compose logs server
docker-compose logs client
docker-compose logs db

# Suivre les logs en temps réel
docker-compose logs -f server

# Vérifier le statut des conteneurs
docker-compose ps

# Entrer dans un conteneur pour debugging
docker-compose exec server sh
docker-compose exec db psql -U suprss -d suprssdb
```

### Résolution de problèmes

**Conteneurs qui s'arrêtent immédiatement :**
1. Vérifiez les logs : `docker-compose logs`
2. Vérifiez le fichier .env : `cat .env`
3. Redémarrez proprement : `docker-compose down && docker-compose up --build`

**Base de données (ExitCode 128) :**
```bash
# Supprimer les volumes et redémarrer
docker-compose down -v
docker-compose up --build
```

**Interface non accessible :**
- Vérifiez que les ports sont libres : `ss -tulpn | grep -E "(4173|5000|5432)"`
- Testez l'accès local : `curl http://localhost:4173`
- Accès réseau : `http://<IP-machine>:4173`

### Développement local

Pour le développement, utilisez plutôt :

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
npm install
npm run dev
```