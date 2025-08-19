# SUPRSS - Collaborative RSS Reader

## Overview

SUPRSS is a modern, collaborative RSS feed reader designed to bring teams together around shared content. It provides multi-provider authentication, real-time collaboration features, and comprehensive RSS feed management. Users can subscribe to feeds, organize articles, participate in discussions, and collaborate through shared collections with role-based permissions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern React features
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design system
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Authentication**: Passport.js with multiple strategies (local, Google OAuth, Facebook OAuth, Replit Auth)
- **Real-time Communication**: WebSocket implementation for live chat and updates
- **RSS Processing**: Custom RSS parser supporting RSS 2.0 and Atom formats
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Structure**:
  - Users table with multi-provider auth support (email, Google, Facebook, Replit)
  - Feeds table for RSS feed metadata and configuration
  - Articles table for parsed RSS content
  - Collections for collaborative workspaces with role-based access
  - Real-time messaging and comments system
  - User-article relationships for read/favorite tracking

### Authentication System
- **Multi-Provider Support**: Email/password, Google OAuth 2.0, Facebook OAuth, and Replit native auth
- **Session Management**: Secure session-based authentication with PostgreSQL storage
- **Password Security**: bcrypt for password hashing with salt rounds
- **Authorization**: Role-based permissions for collection access and management

### Real-time Features
- **WebSocket Server**: Custom implementation for real-time chat and notifications
- **Live Updates**: Automatic feed refresh service with configurable intervals
- **Collaborative Features**: Real-time chat within collections, live article updates

## External Dependencies

### Database Services
- **PostgreSQL**: Primary database (can be local or cloud-hosted like Neon)
- **Connection Pool**: @neondatabase/serverless for efficient database connections

### Authentication Providers
- **Google OAuth**: Google OAuth 2.0 for Google account authentication
- **Facebook OAuth**: Facebook Login API for Facebook account authentication  
- **Replit Auth**: Native Replit authentication integration for Replit-hosted deployments

### UI Components
- **Radix UI**: Accessible, unstyled UI primitives for complex components
- **Lucide Icons**: Consistent icon library for UI elements
- **React Icons**: Additional icons for social provider branding

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast bundling for production server builds
- **PostCSS**: CSS processing with Tailwind CSS compilation
- **TypeScript**: Static type checking across frontend and backend

### RSS Processing
- **xml2js**: XML parsing for RSS and Atom feed formats
- **Custom Parser**: Built-in RSS parser supporting multiple feed formats and validation

### Deployment
- **Docker Support**: Containerization with multi-stage builds
- **Environment Configuration**: Support for development, staging, and production environments
- **Health Checks**: Built-in health check endpoints for container orchestration