# SUPRSS - Déploiement Docker

Ce guide explique comment lancer l'application SUPRSS avec Docker Compose.

## Prérequis

- Docker et Docker Compose installés
- Port 4173, 5000 et 5432 disponibles

## Configuration

1. **Copiez le fichier d'environnement :**
   ```bash
   cp docker-env.example .env.docker
   ```

2. **Modifiez les variables d'environnement dans `.env.docker` :**
   - `SESSION_SECRET` : Changez pour une clé secrète sécurisée
   - `REPL_ID` : Votre ID Repl depuis Replit (pour l'authentification)
   - `REPLIT_DOMAINS` : Ajustez selon votre domaine

## Lancement

```bash
# Construire et lancer tous les services
docker-compose up --build

# Ou en arrière-plan
docker-compose up --build -d
```

## Services

- **Frontend** : http://localhost:4173
- **Backend API** : http://localhost:5000
- **Base de données** : localhost:5432

## Structure des conteneurs

- `db` : PostgreSQL 15 avec données persistantes
- `server` : Backend Node.js/Express sur port 5000
- `client` : Frontend React servi par Nginx sur port 4173

## Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down

# Supprimer volumes (données DB)
docker-compose down -v

# Reconstruire un service spécifique
docker-compose build server
docker-compose up server
```

## Configuration base de données

La base PostgreSQL utilise :
- Utilisateur : `suprss`
- Mot de passe : `suprsspass`
- Base : `suprssdb`
- Port : `5432`

Les données sont persistantes via un volume Docker.

## Dépannage

1. **Port occupé** : Vérifiez qu'aucun service n'utilise les ports 4173, 5000 ou 5432
2. **Erreur de build** : Supprimez les images et reconstruisez avec `docker-compose build --no-cache`
3. **Problème de DB** : Vérifiez les logs avec `docker-compose logs db`