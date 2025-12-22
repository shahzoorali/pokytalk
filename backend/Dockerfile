FROM node:18-alpine

WORKDIR /app

# Copy root package.json for workspace setup
COPY package.json ./

# Copy and build shared package first
COPY shared ./shared
WORKDIR /app/shared
RUN npm install && npm run build
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install shared package as local dependency so Node.js can resolve @pokytalk/shared
RUN npm install ../shared

# Copy backend source code
COPY backend/src ./src

# Build backend (TypeScript will resolve @pokytalk/shared from node_modules)
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application from backend directory
WORKDIR /app/backend
CMD ["node", "dist/index.js"]
