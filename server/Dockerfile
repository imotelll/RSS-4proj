FROM node:18-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies including tsx
RUN npm ci

# Copy source files
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./

EXPOSE 5000

# Use tsx to run TypeScript directly in production
CMD ["npx", "tsx", "server/index.ts"]