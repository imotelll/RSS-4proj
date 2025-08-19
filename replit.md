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
- **Multi-Provider Support**: Email registration, Google OAuth, Facebook OAuth, and Replit Auth
- **Email Registration**: Local account creation with bcrypt password hashing
- **Google OAuth**: Seamless Google account integration with profile sync
- **Facebook OAuth**: Facebook login integration with profile data
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL (7 days default)
- **User Management**: Complete profile system with preferences and settings
- **Security**: Secure cookie-based sessions with CSRF protection and domain validation
- **Mixed Authentication**: Middleware supporting all authentication methods

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
- **Single Container**: Unified container serving both frontend and backend
- **Simplified Setup**: One docker-compose.yml file for easy deployment
- **External Database**: Supports cloud PostgreSQL (Neon, AWS RDS, etc.)
- **Environment Configuration**: Single .env file for all configuration
- **Health Monitoring**: Built-in health checks and automatic restart

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
- August 19, 2025. Nettoyage final et déploiement Docker simplifié
  * Suppression de tous les fichiers de documentation redondants
  * Création d'un README.md complet pour le déploiement
  * Docker simplifié avec un seul conteneur pour frontend + backend
  * Configuration .env.example mise à jour avec toutes les variables nécessaires
  * Intégration Facebook OAuth complète (boutons UI + routes backend)
  * Structure de projet optimisée et nettoyée
  * Documentation consolidée dans un seul README principal
- January 18, 2025. Système d'authentification multi-provider complet
  * Authentification email/mot de passe avec bcrypt
  * Google OAuth avec persistence des comptes
  * Facebook OAuth avec interface utilisateur complète
  * Replit Auth pour l'environnement de développement
  * Pages de connexion et inscription avec toutes les options
  * Persistance des comptes utilisateurs confirmée et testée
  * Navigation fluide entre les formulaires d'authentification
- January 18, 2025. Fonctionnalités collaboratives et temps réel
  * Système de flux RSS partagés entre tous les utilisateurs
  * Service de rafraîchissement automatique des flux (30 minutes)
  * Statistiques temps réel (compteurs articles, favoris, non lus)
  * Interface utilisateur responsive avec thème sombre/clair
  * Gestion des favoris et articles lus par utilisateur
  * Recherche et filtrage des articles
  * Health check endpoint pour monitoring Docker
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```