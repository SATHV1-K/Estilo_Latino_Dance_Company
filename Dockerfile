# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Set the API URL for the production build
ENV VITE_API_URL=https://estilolatinodancecompany-production.up.railway.app

# Copy package files
COPY package.json ./

# Fresh install without cache - this ensures Linux binaries are installed
RUN npm install

# Copy source files
COPY . .

# Build the application with the env var baked in
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner

WORKDIR /app

# Install serve to host static files
RUN npm install -g serve

# Copy built files from builder stage (vite outputs to 'build' folder per vite.config.ts)
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Start the server - listen on all interfaces so Railway can access
CMD ["serve", "build", "-l", "tcp://0.0.0.0:3000"]
