# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build tools for native modules (sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Install runtime dependencies for sqlite3
RUN apt-get update && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Install production dependencies
RUN apt-get update && apt-get install -y python3 make g++ \
    && npm install --production \
    && apt-get purge -y make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Copy server and built frontend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
