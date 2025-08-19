# SUPRSS - Collaborative RSS Reader

## Overview

SUPRSS is a modern, collaborative RSS feed reader designed to bring teams together around shared content. The application allows users to subscribe to RSS feeds, organize them with tags, and collaborate through shared collections with real-time chat and commenting features. Built with a full-stack TypeScript architecture, it supports multiple authentication providers and provides a responsive, accessible user interface with both light and dark themes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built as a modern React 18 single-page application using:
- **Framework**: Vite for fast development and optimized builds
- **UI Framework**: React with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme provider supporting light/dark/system themes

### Backend Architecture
The server follows a RESTful API design with WebSocket support:
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Authentication**: Multi-provider system using Passport.js supporting email/password, Google OAuth, Facebook OAuth, and Replit Auth
- **Real-time Features**: WebSocket integration for live chat and updates
- **Session Management**: PostgreSQL-based session store with configurable TTL

### Database Design
Uses PostgreSQL with Drizzle ORM for type-safe database operations:
- **Users Table**: Supports multiple auth providers with profile information and preferences
- **Feeds Table**: Shared RSS feeds with metadata and tagging
- **Articles Table**: Parsed RSS content with relationships to feeds
- **Collections System**: Collaborative spaces with role-based permissions
- **Real-time Features**: Message and comment tables for collaborative features
- **Session Storage**: Dedicated table for auth session management

### Authentication System
Multi-provider authentication strategy:
- **Email/Password**: Traditional registration with bcrypt password hashing
- **OAuth Providers**: Google and Facebook integration with profile synchronization
- **Replit Integration**: Native Replit authentication for development environment
- **Session Security**: Secure cookie-based sessions with HTTPS enforcement

### RSS Processing
Automated feed management system:
- **Parser Service**: Custom RSS/Atom feed parser supporting multiple formats
- **Auto-refresh**: Configurable background service for feed updates
- **Content Processing**: XML parsing with fallback handling and validation
- **Duplicate Prevention**: GUID-based article deduplication

### Real-time Features
WebSocket-based collaboration:
- **Live Chat**: Real-time messaging within collections
- **Article Updates**: Instant notifications for new articles
- **User Presence**: Connection status and activity tracking
- **Message Broadcasting**: Efficient message distribution to collection members

## External Dependencies

### Database Services
- **PostgreSQL**: Primary database (can be cloud-hosted like Neon)
- **Connection Pooling**: Neon serverless driver with WebSocket support

### Authentication Providers
- **Google OAuth**: Optional integration requiring client credentials
- **Facebook OAuth**: Optional social login integration
- **Replit Auth**: Native Replit environment authentication

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Vite Development**: Hot reload and development server
- **TypeScript Compiler**: Type checking and compilation

### UI and Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Consistent icon library
- **Google Fonts**: Inter font family for typography

### Feed Processing
- **xml2js**: RSS/Atom feed parsing
- **Fetch API**: RSS feed retrieval with proper user agent headers

### Build and Deployment
- **esbuild**: Fast JavaScript bundling for production
- **PostCSS**: CSS processing with autoprefixer
- **Docker Support**: Containerized deployment configuration