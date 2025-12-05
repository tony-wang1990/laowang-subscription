# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native modules (sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for sqlite3
RUN apk add --no-cache python3

COPY package*.json ./

# Install build tools, install deps, then remove build tools to reduce image size
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && npm install --production \
    && apk del .build-deps

# Copy server and built frontend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/database ./database

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
