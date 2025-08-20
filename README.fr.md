# SUPRSS - Lecteur RSS Collaboratif

Un lecteur de flux RSS moderne et collaboratif qui rassemble les équipes autour du contenu qui compte le plus.

## Fonctionnalités

### Authentification Multi-Fournisseurs
- **Inscription par Email** : Créer des comptes avec email et mot de passe
- **OAuth Google** : Connexion rapide avec les comptes Google
- **OAuth Facebook** : Connexion avec les comptes Facebook  
- **Authentification Replit** : Intégration native avec l'authentification Replit

### Gestion des Flux RSS
- S'abonner aux flux RSS avec validation automatique
- Flux partagés accessibles à tous les utilisateurs
- Actualisation automatique avec intervalles configurables
- Organisation par tags et catégorisation
- Mises à jour des flux en temps réel

### Fonctionnalités Collaboratives
- Collections partagées avec permissions basées sur les rôles
- Chat en temps réel dans les collections
- Commentaires et discussions d'articles
- Invitation et gestion des membres

### Gestion des Articles
- Suivi lu/non-lu par utilisateur
- Système de favoris personnel
- Recherche en texte intégral dans les articles
- Design responsive avec thèmes sombre/clair

## Stack Technique

- **Frontend** : React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend** : Node.js + Express, TypeScript, WebSocket
- **Base de données** : PostgreSQL avec Drizzle ORM
- **Authentification** : Passport.js avec stratégies multiples
- **Temps réel** : WebSocket pour les mises à jour en direct

## Démarrage Rapide avec Docker

### Prérequis
- Docker et Docker Compose installés
- Base de données PostgreSQL (locale ou cloud comme Neon)

### 1. Cloner et Configurer

```bash
git clone <votre-repo>
cd suprss
cp .env.example .env
```

### 2. Configurer l'Environnement

Éditez `.env` avec votre configuration :

```bash
# Base de données (Requis)
DATABASE_URL=postgresql://user:password@host:5432/database
PGDATABASE=nom_base_donnees
PGHOST=localhost
PGPASSWORD=mot_de_passe
PGPORT=5432
PGUSER=utilisateur

# Session (Requis)
SESSION_SECRET=votre-cle-secrete-session-ultra-securisee

# OAuth (Optionnel)
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
FACEBOOK_APP_ID=votre-facebook-app-id
FACEBOOK_APP_SECRET=votre-facebook-app-secret
```

### 3. Exécuter avec Docker

```bash
# Construire et démarrer tous les services
docker-compose up --build

# Ou exécuter en arrière-plan
docker-compose up -d --build
```

L'application sera disponible sur :
- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:5000
- **Vérification de Santé** : http://localhost:5000/api/health

### 4. Initialiser la Base de Données

La base de données sera automatiquement migrée au premier démarrage. Les flux RSS par défaut sont inclus pour les tests.

## Architecture du Projet

### Vue d'Ensemble du Système
SUPRSS est une application web full-stack construite pour la scalabilité et les pratiques de développement modernes :

- **Frontend** : React 18 avec TypeScript, outils de build Vite, stylisation Tailwind CSS
- **Backend** : Serveur Node.js Express avec TypeScript, support WebSocket
- **Base de données** : PostgreSQL avec Drizzle ORM pour les opérations type-safe
- **Authentification** : Système multi-fournisseurs supportant email, Google, Facebook et Replit
- **Temps réel** : Connexions WebSocket pour les mises à jour en direct et la messagerie

### Composants Clés

#### Système d'Authentification
- Support multi-fournisseurs avec gestion de session unifiée
- Hachage des mots de passe bcrypt pour les comptes email
- Intégration OAuth avec Google et Facebook
- Sessions sauvegardées en PostgreSQL avec TTL configurable
- Middleware d'authentification mixte supportant tous les fournisseurs

#### Système de Gestion des Flux
- Parseur RSS supportant plusieurs formats de flux
- Validation d'URL en temps réel avant abonnement
- Actualisation automatique avec intervalles configurables (30 minutes par défaut)
- Flux partagés accessibles à tous les utilisateurs
- Organisation par tags et catégorisation

#### Fonctionnalités Temps Réel
- Serveur WebSocket pour la messagerie instantanée
- Notifications en direct pour les nouveaux articles et mises à jour
- Collaboration en temps réel dans les collections partagées
- Reconnexion automatique avec backoff exponentiel

#### Architecture des Données
- Base de données PostgreSQL avec Drizzle ORM
- Opérations de base de données type-safe avec validation de schéma
- Migrations automatiques avec drizzle-kit
- Pool de connexions pour la scalabilité

## Configuration de Développement

### Prérequis
- Node.js 18+ et npm
- Base de données PostgreSQL

### Installer les Dépendances
```bash
npm install
```

### Configurer la Base de Données
```bash
# Générer et exécuter les migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Démarrer le Serveur de Développement
```bash
npm run dev
```

## Configuration de l'Authentification

### OAuth Google
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un existant
3. Activer l'API Google+
4. Créer des identifiants OAuth 2.0
5. Ajouter l'URI de redirection autorisée : `http://localhost:5000/api/auth/google/callback`
6. Ajouter `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` au `.env`

### OAuth Facebook
1. Aller sur [Facebook Developers](https://developers.facebook.com/)
2. Créer une nouvelle application
3. Ajouter le produit Facebook Login
4. Ajouter l'URI de redirection : `http://localhost:5000/api/auth/facebook/callback`
5. Ajouter `FACEBOOK_APP_ID` et `FACEBOOK_APP_SECRET` au `.env`

## Configuration Docker

### Architecture Multi-Services
- **Conteneur Frontend** : Nginx servant le build React
- **Conteneur Backend** : Serveur Node.js Express
- **Base de données** : PostgreSQL externe (Neon recommandé)

### Variables d'Environnement
- Développement : `.env`
- Production : Définir les variables d'environnement dans votre plateforme de déploiement

### Surveillance de Santé
- Point de terminaison de vérification de santé : `/api/health`
- Surveillance de la connectivité de la base de données
- Redémarrage automatique du service en cas d'échec

## Points de Terminaison API

### Authentification
- `POST /api/auth/register` - Inscription par email
- `POST /api/auth/login` - Connexion par email
- `GET /api/auth/google` - OAuth Google
- `GET /api/auth/facebook` - OAuth Facebook
- `GET /api/auth/user` - Obtenir l'utilisateur actuel
- `POST /api/auth/logout` - Déconnexion

### Flux
- `GET /api/feeds` - Obtenir les flux utilisateur
- `POST /api/feeds` - Ajouter un nouveau flux
- `PUT /api/feeds/:id` - Mettre à jour un flux
- `DELETE /api/feeds/:id` - Supprimer un flux
- `POST /api/feeds/:id/refresh` - Actualiser un flux

### Articles
- `GET /api/articles` - Obtenir les articles avec filtres
- `GET /api/articles/favorites` - Obtenir les articles favoris
- `PUT /api/articles/:id/read` - Marquer comme lu/non-lu
- `PUT /api/articles/:id/favorite` - Basculer favori
- `GET /api/articles/search` - Rechercher des articles

## Déploiement

### Production avec Docker
1. Mettre à jour `.env` avec les valeurs de production
2. Utiliser un service PostgreSQL cloud (Neon, AWS RDS, etc.)
3. Configurer un reverse proxy (Nginx, Cloudflare)
4. Activer SSL/TLS
5. Configurer la surveillance et les sauvegardes

### Fournisseurs Cloud Recommandés
- **Base de données** : Neon PostgreSQL (serverless)
- **Hébergement** : Railway, Render, ou DigitalOcean
- **CDN** : Cloudflare pour les ressources statiques

## Structure du Projet

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants UI
│   │   ├── pages/          # Pages de routes
│   │   ├── lib/            # Utilitaires
│   │   └── hooks/          # Hooks personnalisés
├── server/                 # Backend Express
│   ├── services/           # Logique métier
│   ├── auth.ts             # Configuration authentification
│   ├── routes.ts           # Routes API
│   └── storage.ts          # Opérations base de données
├── shared/                 # Types TypeScript partagés
├── migrations/             # Migrations de base de données
└── docker-compose.yml      # Configuration Docker
```

## Contribuer

1. Faire un fork du dépôt
2. Créer une branche de fonctionnalité
3. Faire vos modifications
4. Ajouter des tests si applicable
5. Soumettre une pull request

## Support

Pour les problèmes et questions :
- Vérifier le point de terminaison de santé : `/api/health`
- Examiner les logs dans les conteneurs Docker
- Vérifier les variables d'environnement
- S'assurer de la connectivité de la base de données

## Licence

Licence MIT - voir le fichier LICENSE pour les détails.