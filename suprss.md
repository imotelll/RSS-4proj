# SUPRSS - Collaborative RSS Reader

## Overview

SUPRSS is a modern, collaborative RSS reader web application built for InfoFlux Pro. It allows users to subscribe to RSS feeds, organize content into shared collections, and collaborate with team members through real-time messaging and commenting features. The application provides a comprehensive solution for managing and sharing RSS content across teams with robust authentication, feed management, and social features.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Theme Support**: Built-in dark/light mode with system preference detection

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling
- **Real-time Communication**: WebSocket implementation for live messaging
- **RSS Processing**: Custom RSS parser supporting RSS 2.0 and Atom formats
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection Pooling**: Neon serverless connection pooling

## Key Components

### Authentication System
- **Provider**: Replit Auth with OAuth2 support (Google, Microsoft, GitHub)
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **User Management**: Profile management with preferences storage
- **Security**: Secure cookie-based sessions with CSRF protection

### Feed Management System
- **RSS Parser**: Custom implementation supporting multiple feed formats
- **Feed Validation**: Real-time URL validation before subscription
- **Article Storage**: Persistent article storage with metadata
- **Auto-refresh**: Configurable feed update intervals
- **Tag System**: Flexible tagging for feed organization

### Collection System
- **Shared Collections**: Multi-user collections with role-based permissions
- **Privacy Levels**: Private, public, and invite-only collection types
- **Member Management**: Invite system with role assignments
- **Feed Sharing**: Collections can contain multiple RSS feeds

### Real-time Features
- **WebSocket Service**: Real-time messaging within collections
- **Live Updates**: Instant feed updates and notifications
- **Comment System**: Article-level commenting with real-time updates
- **Presence Indicators**: Online user status in collections

## Data Flow

### Feed Processing Flow
1. User submits RSS feed URL
2. Backend validates feed URL accessibility
3. RSS parser extracts feed metadata and articles
4. Articles stored in database with deduplication
5. Frontend receives updated feed data via React Query
6. Auto-refresh scheduled based on feed settings

### Collection Collaboration Flow
1. User creates or joins collection
2. WebSocket connection established for real-time updates
3. Messages and comments synchronized across all members
4. Feed additions/removals propagated to all collection members
5. Real-time notifications for new content and activities

### Authentication Flow
1. User initiates login via Replit Auth
2. OAuth2 flow completed with external provider
3. User session created and stored in PostgreSQL
4. Frontend receives user data and authentication state
5. Protected routes and API endpoints enforce authentication

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL for primary data storage
- **Authentication**: Replit Auth infrastructure
- **UI Components**: Radix UI primitives for accessible components
- **Validation**: Zod for runtime type validation
- **HTTP Client**: Fetch API for RSS feed retrieval

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting
- **Vite**: Development server and build optimization
- **Drizzle Studio**: Database management and visualization

### RSS Processing
- **xml2js**: XML parsing for RSS and Atom feeds
- **Custom Parser**: Handles multiple feed formats and edge cases
- **Feed Validation**: URL accessibility and format verification

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild creates single Node.js bundle
- **Database**: Drizzle migrations ensure schema consistency
- **Environment**: Production/development environment separation

### Production Architecture
- **Static Assets**: Vite-optimized bundle with code splitting
- **API Server**: Express.js serving RESTful endpoints
- **WebSocket Server**: Real-time communication layer
- **Database**: Neon PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-backed session management

### Docker Support
- Complete Docker Compose configuration with multi-container setup
- Backend containerized with Node.js/TypeScript (port 5000)
- Frontend containerized with Nginx serving built React app (port 4173)
- PostgreSQL database container with persistent volumes (port 5432)
- Health checks and proper service dependencies
- Environment variable configuration for production deployment

### Scalability Considerations
- Stateless backend design for horizontal scaling
- Database connection pooling for concurrent users
- WebSocket service designed for cluster deployment
- CDN-ready static asset organization

## Changelog

Changelog:
- June 28, 2025. Initial setup
- June 29, 2025. Added Docker Compose configuration with multi-container setup
  - Created docker-compose.yml with PostgreSQL, backend, and frontend services
  - Added Dockerfiles for server (Node.js/TypeScript) and client (Nginx)
  - Implemented health checks and service dependencies
  - Added environment configuration files and documentation
  - Fixed RSS feed deletion constraint issues

## User Preferences

Preferred communication style: Simple, everyday language.
