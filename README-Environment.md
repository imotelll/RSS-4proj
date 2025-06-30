# Configuration des Variables d'Environnement - SUPRSS

## Fichier .env Principal

Le projet utilise un fichier `.env` pour centraliser toute la configuration. Copiez `.env.example` vers `.env` et adaptez selon vos besoins.

### Variables Requises

```bash
# Configuration serveur
NODE_ENV=production
PORT=5000

# Base de données PostgreSQL
DATABASE_URL=postgresql://suprss:suprsspass@db:5432/suprssdb
PGHOST=db
PGPORT=5432
PGUSER=suprss
PGPASSWORD=suprsspass
PGDATABASE=suprssdb

# Authentication (sécurité)
SESSION_SECRET=changez-cette-clé-secrète-en-production
REPL_ID=votre-repl-id
REPLIT_DOMAINS=localhost:4173,0.0.0.0:4173,localhost:5000,0.0.0.0:5000
ISSUER_URL=https://replit.com/oidc

# Frontend
VITE_API_URL=http://localhost:5000
```

## Configuration Docker

### docker-compose.yml utilise .env

Le fichier docker-compose.yml lit automatiquement le fichier `.env` et utilise les variables avec la syntaxe `${VARIABLE}`.

### Réseau et Ports

- **Base de données** : Port 5432 (PostgreSQL)
- **Backend API** : Port 5000 (Node.js/Express)
- **Frontend** : Port 4173 (Nginx)

### Accès réseau local

L'interface est accessible depuis :
- Local : `http://localhost:4173`
- Réseau : `http://<IP-machine>:4173`

## Sécurité

### Variables sensibles à changer

1. **SESSION_SECRET** : Clé de 32+ caractères aléatoires
2. **PGPASSWORD** : Mot de passe PostgreSQL fort
3. **REPL_ID** : Identifiant unique pour l'authentification

### Exemple de génération de secrets

```bash
# Générer un secret de session
openssl rand -hex 32

# Ou avec Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### Problèmes courants

1. **Variables non chargées**
   - Vérifiez que le fichier `.env` est à la racine
   - Pas d'espaces autour du `=`
   - Pas de quotes inutiles

2. **Connexion base de données**
   - Vérifiez `DATABASE_URL` correspond aux autres variables PG*
   - Le service `db` doit être démarré avant `server`

3. **Ports occupés**
   ```bash
   # Vérifier les ports utilisés
   ss -tulpn | grep -E "(4173|5000|5432)"
   
   # Libérer un port si nécessaire
   sudo fuser -k 5000/tcp
   ```

## Variables par environnement

### Développement local
```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/suprss_dev
VITE_API_URL=http://localhost:5000
```

### Production Docker
```bash
NODE_ENV=production
DATABASE_URL=postgresql://suprss:suprsspass@db:5432/suprssdb
VITE_API_URL=http://localhost:5000
```

### Production serveur
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/suprss_prod
VITE_API_URL=https://api.votre-domaine.com
```