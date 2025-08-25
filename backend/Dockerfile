FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Copy shared package
COPY shared ./shared

# Install dependencies (including dev deps for build)
RUN npm install

# Build shared package first
WORKDIR /app/shared
RUN npm install && npm run build
WORKDIR /app

# Copy source code
COPY backend/src ./src

# Update tsconfig paths for Docker build
RUN sed -i 's|"../shared/src"|"./shared/src"|g' tsconfig.json

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]
