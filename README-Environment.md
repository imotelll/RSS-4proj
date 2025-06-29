# Configuration des Variables d'Environnement - SUPRSS

## Vue d'ensemble

L'application SUPRSS utilise maintenant un fichier `.env` standard pour la configuration des variables d'environnement, remplaçant la configuration `.replit`.

## Configuration Locale

### 1. Créer le fichier .env

Copiez le fichier d'exemple et configurez les valeurs :

```bash
cp .env.example .env
```

### 2. Variables Requises

Éditez le fichier `.env` avec vos valeurs :

```env
# Configuration Serveur
NODE_ENV=development
PORT=5000

# Configuration Base de Données
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=localhost
PGPORT=5432
PGUSER=votre_utilisateur
PGPASSWORD=votre_mot_de_passe
PGDATABASE=votre_base

# Configuration Authentification
SESSION_SECRET=votre-clé-secrète-très-sécurisée
REPL_ID=votre-repl-id-de-replit
REPLIT_DOMAINS=localhost:5000,votre-domaine.com
ISSUER_URL=https://replit.com/oidc

# Configuration Frontend
VITE_API_URL=http://localhost:5000
```

## Variables d'Environnement Détaillées

### Configuration Serveur
- `NODE_ENV` : Mode d'exécution (`development`, `production`)
- `PORT` : Port d'écoute du serveur (défaut: 5000)

### Configuration Base de Données
- `DATABASE_URL` : URL complète de connexion PostgreSQL
- `PGHOST` : Hôte de la base de données
- `PGPORT` : Port de la base de données (défaut: 5432)
- `PGUSER` : Nom d'utilisateur de la base
- `PGPASSWORD` : Mot de passe de la base
- `PGDATABASE` : Nom de la base de données

### Configuration Authentification
- `SESSION_SECRET` : Clé secrète pour les sessions (doit être unique et sécurisée)
- `REPL_ID` : Identifiant Repl pour l'authentification OAuth
- `REPLIT_DOMAINS` : Domaines autorisés (séparés par des virgules)
- `ISSUER_URL` : URL du fournisseur OAuth (Replit)

### Configuration Frontend
- `VITE_API_URL` : URL de l'API backend pour les builds de production

## Sécurité

⚠️ **Important** : 
- Le fichier `.env` est ignoré par Git et ne doit **jamais** être versionné
- Utilisez des valeurs sécurisées pour `SESSION_SECRET`
- Ne partagez jamais vos variables d'environnement sensibles

## Développement vs Production

### Développement
```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/suprss_dev
VITE_API_URL=http://localhost:5000
```

### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/suprss_prod
VITE_API_URL=https://votre-api.domaine.com
```

## Dépannage

### Variable manquante
Si une variable requise manque, l'application affichera une erreur explicite au démarrage.

### Base de données inaccessible
Vérifiez que :
- Les credentials de base sont corrects
- Le serveur PostgreSQL est démarré
- Les ports ne sont pas bloqués

### Authentification échouée
Vérifiez que :
- `REPL_ID` correspond à votre projet Replit
- `REPLIT_DOMAINS` inclut votre domaine actuel
- `SESSION_SECRET` est défini et sécurisé