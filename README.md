# SUPRSS - Collaborative RSS Reader

🚀 A modern, collaborative RSS feed reader that brings teams together around the content that matters most.

## Features

### 🔐 Multi-Provider Authentication
- **Email Registration**: Create accounts with email and password
- **Google OAuth**: Quick sign-in with Google accounts
- **Facebook OAuth**: Sign-in with Facebook accounts  
- **Replit Auth**: Native integration with Replit authentication

### 📰 RSS Feed Management
- Subscribe to RSS feeds with automatic validation
- Shared feeds accessible to all users
- Auto-refresh feeds with configurable intervals
- Tag-based organization and categorization
- Real-time feed updates

### 👥 Collaborative Features
- Shared collections with role-based permissions
- Real-time chat within collections
- Article commenting and discussions
- Member invitation and management

### 📱 Article Management
- Read/unread tracking per user
- Personal favorites system
- Full-text search across articles
- Responsive design with dark/light themes

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js + Express, TypeScript, WebSocket
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with multiple strategies
- **Real-time**: WebSocket for live updates

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- PostgreSQL database (local or cloud like Neon)

### 1. Clone and Setup

```bash
git clone <your-repo>
cd suprss
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your configuration:

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@host:5432/database
PGDATABASE=database_name
PGHOST=localhost
PGPASSWORD=password
PGPORT=5432
PGUSER=user

# Session (Required)
SESSION_SECRET=your-super-secret-session-key-here

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### 3. Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### 4. Initialize Database

The database will be automatically migrated on first startup. Default RSS feeds are included for testing.

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database

### Install Dependencies
```bash
npm install
```

### Setup Database
```bash
# Generate and run migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Start Development Server
```bash
npm run dev
```

## Authentication Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Add redirect URI: `http://localhost:5000/api/auth/facebook/callback`
5. Add `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` to `.env`

## Docker Configuration

### Multi-Service Architecture
- **Frontend Container**: Nginx serving React build
- **Backend Container**: Node.js Express server
- **Database**: External PostgreSQL (Neon recommended)

### Environment Variables
- Development: `.env`
- Production: Set environment variables in your deployment platform

### Health Monitoring
- Health check endpoint: `/api/health`
- Database connectivity monitoring
- Automatic service restart on failure

## API Endpoints

### Authentication
- `POST /api/auth/register` - Email registration
- `POST /api/auth/login` - Email login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/facebook` - Facebook OAuth
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Feeds
- `GET /api/feeds` - Get user feeds
- `POST /api/feeds` - Add new feed
- `PUT /api/feeds/:id` - Update feed
- `DELETE /api/feeds/:id` - Delete feed
- `POST /api/feeds/:id/refresh` - Refresh feed

### Articles
- `GET /api/articles` - Get articles with filters
- `GET /api/articles/favorites` - Get favorite articles
- `PUT /api/articles/:id/read` - Mark as read/unread
- `PUT /api/articles/:id/favorite` - Toggle favorite
- `GET /api/articles/search` - Search articles

## Deployment

### Production with Docker
1. Update `.env` with production values
2. Use a cloud PostgreSQL service (Neon, AWS RDS, etc.)
3. Set up reverse proxy (Nginx, Cloudflare)
4. Enable SSL/TLS
5. Configure monitoring and backups

### Recommended Cloud Providers
- **Database**: Neon PostgreSQL (serverless)
- **Hosting**: Railway, Render, or DigitalOcean
- **CDN**: Cloudflare for static assets

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── lib/            # Utilities
│   │   └── hooks/          # Custom hooks
├── server/                 # Express backend
│   ├── services/           # Business logic
│   ├── auth.ts             # Authentication config
│   ├── routes.ts           # API routes
│   └── storage.ts          # Database operations
├── shared/                 # Shared TypeScript types
├── migrations/             # Database migrations
└── docker-compose.yml      # Docker configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the health endpoint: `/api/health`
- Review logs in Docker containers
- Verify environment variables
- Ensure database connectivity

## License

MIT License - see LICENSE file for details.