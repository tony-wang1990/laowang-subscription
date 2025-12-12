# Build Stage
FROM node:20 AS builder

WORKDIR /app

# Full node image has python/make/g++ pre-installed usually, but let's be safe
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
# Use FULL node image to ensure all shared libraries (glibc, libstdc++, etc.) are present
FROM node:20

WORKDIR /app

# Install dumb-init for signal handling
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Install production dependencies directly in the container
# This ensures native modules (sqlite3) must work on this specific architecture/OS
RUN npm install --production

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Pre-create database directory
RUN mkdir -p /app/database && chmod 777 /app/database

# Copy debug scripts
COPY server/debug.js ./server/debug.js
COPY server/debug-express.js ./server/debug-express.js

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Run Express Debug directly
CMD ["node", "server/debug-express.js"]
