# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Install ALL dependencies (including dev)
RUN npm ci

COPY . .
# Build frontend
RUN npm run build

# Remove devDependencies to prepare for production copy
RUN npm prune --production

# Production Stage
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies (python3 might be needed for sqlite3 runtime binding)
RUN apt-get update && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*

# Copy package.json for reference
COPY package*.json ./

# COPY pre-built node_modules from builder (Critical Step!)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Pre-create database directory
RUN mkdir -p /app/database && chmod 777 /app/database

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Simple, direct start command
CMD ["node", "server/index.js"]
