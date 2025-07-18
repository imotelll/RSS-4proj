# 🚀 Guide de Déploiement Docker Compose - SUPRSS

Ce guide vous explique comment déployer SUPRSS avec Docker Compose sur votre serveur.

## 📋 Prérequis

- Docker et Docker Compose installés sur votre serveur
- Un nom de domaine pointant vers votre serveur (ex: 4proj.lpasr.fr)
- Port 80 et 443 ouverts sur votre serveur

## 🔧 Configuration Initiale

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd suprss
```

### 2. Configurer l'environnement
```bash
# Copier le fichier d'environnement pour Docker
cp docker-env.example .env

# Éditer le fichier .env avec vos paramètres
nano .env
```

### 3. Personnaliser le fichier .env

Modifiez les variables suivantes dans le fichier `.env` :

```bash
# Base de données - Changez ces valeurs pour la sécurité
POSTGRES_USER=votre_utilisateur_db
POSTGRES_PASSWORD=votre_mot_de_passe_securise
POSTGRES_DB=suprss_production

# Configuration serveur
NODE_ENV=production
SESSION_SECRET=votre-secret-session-ultra-securise-minimum-32-caracteres
REPL_ID=production-deployment
REPLIT_DOMAINS=4proj.lpasr.fr,www.4proj.lpasr.fr
ISSUER_URL=https://replit.com/oidc

# Configuration OAuth Google (optionnel)
GOOGLE_CLIENT_ID=votre-client-id-google
GOOGLE_CLIENT_SECRET=votre-client-secret-google

# URLs et domaines
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
PGHOST=db
PGPORT=5432
PGUSER=${POSTGRES_USER}
PGPASSWORD=${POSTGRES_PASSWORD}
PGDATABASE=${POSTGRES_DB}
```

## 🚀 Déploiement

### 1. Construction et lancement
```bash
# Construire et démarrer tous les services
docker-compose up -d --build

# Vérifier que tous les services sont en cours d'exécution
docker-compose ps
```

### 2. Vérification des logs
```bash
# Logs de tous les services
docker-compose logs -f

# Logs d'un service specific
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f db
```

### 3. Accès à l'application
- Frontend: http://votre-domaine.com:4173
- API Backend: http://votre-domaine.com:5000
- Base de données: Port 5432 (accès interne uniquement)

## 🔒 Configuration HTTPS (Recommandé)

Pour un déploiement en production, ajoutez un reverse proxy avec SSL :

### Option 1: Nginx avec Let's Encrypt

Créez un fichier `nginx.conf` :
```nginx
server {
    listen 80;
    server_name 4proj.lpasr.fr www.4proj.lpasr.fr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 4proj.lpasr.fr www.4proj.lpasr.fr;
    
    ssl_certificate /etc/letsencrypt/live/4proj.lpasr.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/4proj.lpasr.fr/privkey.pem;
    
    location / {
        proxy_pass http://localhost:4173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 Commandes Utiles

### Gestion des services
```bash
# Arrêter tous les services
docker-compose down

# Redémarrer un service
docker-compose restart server

# Mise à jour avec rebuild
docker-compose up -d --build

# Supprimer tout et recommencer
docker-compose down -v
docker-compose up -d --build
```

### Maintenance
```bash
# Accéder à la base de données
docker-compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB

# Voir l'espace disque utilisé
docker system df

# Nettoyer les images inutilisées
docker system prune -a
```

### Sauvegarde de la base de données
```bash
# Créer une sauvegarde
docker-compose exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer une sauvegarde
docker-compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB < backup.sql
```

## 🔍 Dépannage

### Vérifier l'état des services
```bash
# Santé des conteneurs
docker-compose ps

# Logs détaillés
docker-compose logs -f server

# Entrer dans un conteneur
docker-compose exec server sh
```

### Problèmes courants

1. **Base de données non accessible** :
   - Vérifiez que le service db est en cours d'exécution
   - Vérifiez les variables DATABASE_URL dans .env

2. **Erreur de migration** :
   ```bash
   docker-compose exec server npx drizzle-kit push
   ```

3. **Frontend non accessible** :
   - Vérifiez les logs du service client
   - Vérifiez que le port 4173 est ouvert

4. **Problème d'authentification** :
   - Vérifiez REPLIT_DOMAINS dans .env
   - Assurez-vous que SESSION_SECRET est défini

## 📊 Monitoring

### Vérifier la santé de l'application
```bash
# Test de l'API
curl http://localhost:5000/api/health

# Test du frontend
curl http://localhost:4173
```

### Logs en temps réel
```bash
# Tous les services
docker-compose logs -f

# Suivre uniquement les erreurs
docker-compose logs -f | grep -i error
```

## 🔄 Mise à jour

Pour mettre à jour l'application :
```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Reconstruire et redémarrer
docker-compose down
docker-compose up -d --build

# 3. Vérifier que tout fonctionne
docker-compose logs -f
```

## 📝 Support

En cas de problème :
1. Vérifiez les logs avec `docker-compose logs -f`
2. Consultez la documentation dans `README.md`
3. Vérifiez que tous les ports sont ouverts
4. Assurez-vous que les variables d'environnement sont correctes

---

Votre application SUPRSS est maintenant déployée et accessible via https://4proj.lpasr.fr ! 🎉