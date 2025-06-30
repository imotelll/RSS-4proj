FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy only backend related files
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./

# Make start script executable
RUN chmod +x server/start.sh

EXPOSE 5000

# Use the start script that handles migrations
CMD ["sh", "server/start.sh"]