FROM node:18-alpine

# Install system dependencies for HEIC conversion
RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads output dist

# Build the React app
RUN npm run build

# Clean install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy server files
COPY server/ ./server/

# Expose port
EXPOSE 4545

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Start the server
CMD ["node", "server/index.js"]