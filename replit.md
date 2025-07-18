# SUPRSS - Collaborative RSS Reader

## Overview

SUPRSS is a modern, collaborative RSS reader web application built for InfoFlux Pro. It enables users to subscribe to RSS feeds, organize content into shared collections, and collaborate with team members through real-time messaging and commenting. The application features a full-stack architecture with React frontend, Node.js/Express backend, and PostgreSQL database, all designed for scalability and modern web development practices.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for build tooling
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for comprehensive theming support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Theme System**: Built-in dark/light mode with system preference detection

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules support
- **Environment**: dotenv configuration management
- **API Design**: RESTful API with structured error handling and middleware
- **Real-time**: WebSocket implementation for live messaging and notifications
- **RSS Processing**: Custom RSS parser supporting RSS 2.0 and Atom formats
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple

### Database Architecture
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL for scalable cloud deployment
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Connection Management**: Connection pooling through Neon's serverless architecture

## Key Components

### Authentication System
- **Multi-Provider Support**: Email registration, Google OAuth, and Replit Auth
- **Email Registration**: Local account creation with bcrypt password hashing
- **Google OAuth**: Seamless Google account integration with profile sync
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL (7 days default)
- **User Management**: Complete profile system with preferences and settings
- **Security**: Secure cookie-based sessions with CSRF protection and domain validation
- **Mixed Authentication**: Middleware supporting both Replit and local authentication methods

### Feed Management System
- **RSS Parser**: Custom implementation supporting multiple feed formats with fallback handling
- **Feed Validation**: Real-time URL validation before subscription to prevent invalid feeds
- **Article Storage**: Persistent article storage with metadata and content preservation
- **Auto-refresh**: Configurable feed update intervals with background processing
- **Tag System**: Flexible tagging system for feed organization and categorization

### Collection System
- **Shared Collections**: Multi-user collections with role-based permissions (owner, member, viewer)
- **Permissions**: Granular access control for reading, adding feeds, and commenting
- **Real-time Collaboration**: Live updates when members join, leave, or modify collections
- **Feed Aggregation**: Unified view of articles from all feeds within a collection

### Real-time Communication
- **WebSocket Server**: Custom WebSocket service for real-time messaging
- **Chat System**: Instant messaging within collections with message persistence
- **Notifications**: Real-time notifications for new articles, comments, and collection updates
- **Connection Management**: Automatic reconnection with exponential backoff

### Article Management
- **Read/Unread Tracking**: Per-user article read status with bulk operations
- **Favorites System**: Personal bookmarking system for important articles
- **Search & Filtering**: Full-text search with filtering by source, tags, and status
- **Comment System**: Article-level commenting with threaded discussions

## Data Flow

### Feed Processing Flow
1. User adds RSS feed URL
2. System validates feed URL and format
3. Feed metadata is stored in database
4. Background job fetches initial articles
5. Articles are parsed, deduplicated, and stored
6. Users receive real-time notifications of new content

### User Interaction Flow
1. User authenticates via Replit OAuth
2. Session is created and stored in PostgreSQL
3. User preferences and collections are loaded
4. Real-time WebSocket connection is established
5. Article interactions (read/favorite) are tracked per-user
6. Collection activities are broadcast to all members

### Collection Collaboration Flow
1. Collection owner creates shared collection
2. Members are invited via email or direct sharing
3. Real-time chat is established for collection
4. Feed additions/removals are synchronized across members
5. Comments and discussions are shared in real-time

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for Neon
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **express**: Web application framework for Node.js
- **passport**: Authentication middleware with OpenID Connect strategy
- **ws**: WebSocket library for real-time communication
- **xml2js**: XML parsing for RSS feed processing

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/react-***: Comprehensive UI component primitives
- **wouter**: Lightweight routing library
- **react-hook-form**: Performant form library with validation
- **zod**: TypeScript-first schema validation

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration and schema management

## Deployment Strategy

### Docker Deployment
- **Multi-container Setup**: Separate containers for frontend, backend, and database
- **Frontend Container**: Nginx serving built React application
- **Backend Container**: Node.js Express server with WebSocket support
- **Database Container**: PostgreSQL with persistent volume storage
- **Environment Configuration**: Docker Compose with environment-specific overrides

### Production Considerations
- **Database**: Neon serverless PostgreSQL for scalability and reliability
- **Session Storage**: PostgreSQL-backed sessions for horizontal scaling
- **Static Assets**: Frontend served via CDN or reverse proxy
- **WebSocket Scaling**: WebSocket connections handled by backend instances
- **Environment Variables**: Secure configuration management via .env files

### Health Monitoring
- **Health Check Endpoint**: `/api/health` for container orchestration
- **Database Connectivity**: Connection pool monitoring
- **WebSocket Status**: Real-time connection health tracking
- **Error Logging**: Structured logging for debugging and monitoring

## Changelog

```
Changelog:
- June 30, 2025. Initial setup
- June 30, 2025. Migration complète vers .env et déploiement Docker autonome
  * Suppression des dépendances au fichier .replit
  * Configuration complète avec docker-compose.yml
  * Migration automatique de base de données au démarrage Docker
  * Endpoint de santé pour les vérifications Docker
  * Documentation complète du déploiement Docker
- June 30, 2025. Résolution du problème critique de build Docker
  * Séparation complète des builds client/serveur
  * Frontend: vite build uniquement, Backend: tsx direct
  * Script de démarrage intelligent avec gestion des migrations
  * Dockerfiles optimisés sans dépendances croisées
  * Script de test docker-test.sh pour validation
- January 17, 2025. Système d'authentification multi-provider
  * Inscription par email avec validation des mots de passe
  * Intégration Google OAuth pour connexion rapide
  * Schema utilisateur étendu avec authProvider et password
  * Page d'accueil avec formulaires d'inscription
  * Middleware d'authentification mixte (Replit + local)
  * Routes API complètes pour inscription et connexion
- January 18, 2025. Corrections majeures du partage de flux et persistance Google
  * Correction des erreurs "Feed not found" - tous les flux publics sont maintenant accessibles
  * Amélioration de la persistence des comptes Google avec googleId unique
  * Mise à jour des contrôles d'accès pour permettre l'accès aux flux partagés
  * Ajout de la colonne googleId dans le schéma utilisateur
  * Optimisation de la sérialisation/désérialisation des sessions Google
  * Correction des favoris spécifiques à chaque utilisateur avec route API dédiée
  * Ajout de statistiques temps réel avec compteurs automatiques dans la Sidebar
  * Mise à jour automatique des compteurs lors des interactions (lecture, favoris)
  * Route /api/articles/favorites pour les favoris spécifiques utilisateur
  * Route /api/stats pour les compteurs temps réel (total, non lus, favoris)
  * Service de rafraîchissement automatique des flux RSS toutes les 30 minutes
  * Boutons de rafraîchissement manuel dans les pages Articles et Favoris
  * Service feedRefreshService pour gérer les mises à jour intelligentes des flux
  * Respect des intervalles de rafraîchissement pour éviter la surcharge des serveurs
  * Correction des boutons "Read" en double et amélioration des filtres d'articles
  * Correction des statistiques par flux dans "My Feeds" avec compteurs corrects
  * Configuration Docker Compose complète avec Dockerfiles optimisés
  * Health check endpoint /api/health pour monitoring des conteneurs
  * Guides de déploiement complets (DEPLOYMENT-GUIDE.md et QUICK-START.md)
  * Configuration .env.docker prête pour la production avec variables sécurisées
  * Script de test automatique docker-test.sh pour validation du déploiement
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```