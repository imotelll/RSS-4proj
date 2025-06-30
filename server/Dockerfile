FROM node:18-alpine

WORKDIR /app

# Install curl and postgresql-client for health checks and database connectivity
RUN apk add --no-cache curl postgresql-client

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (include dev dependencies for tsx and drizzle-kit)
RUN npm ci

# Copy only backend related files
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./

# Make start script executable
RUN chmod +x server/start.sh

EXPOSE 5000

# Use the start script that handles migrations
CMD ["sh", "server/start.sh"]