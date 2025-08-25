FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./
COPY frontend/next.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

# Install dependencies
RUN npm install

# Copy shared package
COPY shared ./shared

# Copy source code
COPY frontend/src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]
