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
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/server ./server

# Pre-create database directory (owned by the non-root user)
RUN mkdir -p /app/database && chown node:node /app/database && chmod 755 /app/database

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Run as non-root user
USER node

# Use dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server/index.js"]
