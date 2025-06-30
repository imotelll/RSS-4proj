# SUPRSS - Déploiement Docker

## Déploiement rapide avec Docker

SUPRSS peut être entièrement déployé avec Docker en une seule commande. Aucune installation manuelle n'est requise.

### Prérequis

- Docker et Docker Compose installés sur votre système

### Lancement

```bash
# Cloner le projet
git clone <url-du-projet>
cd suprss

# Lancer l'application complète
docker-compose up --build
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

### Logs

```bash
# Voir tous les logs
docker-compose logs

# Voir les logs d'un service spécifique
docker-compose logs server
docker-compose logs client
docker-compose logs db
```

### Développement local

Pour le développement, utilisez plutôt :

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
npm install
npm run dev
```