# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for Biome if needed, but here just for build)
RUN npm install

# Copy source code
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source from builder
COPY --from=builder /app .

# Create directory for images if it doesn't exist
RUN mkdir -p mi-carpeta-imagenes

# Set environment variables
ENV NODE_ENV=production
ENV SERVER_PORT=3030

# Expose the application port
EXPOSE 3030

# Start the application
CMD ["node", "server.js"]
