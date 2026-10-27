# Use official Node.js 20 LTS slim image (Debian-based for optimal native binary compatibility with bcrypt)
FROM node:20-slim

# Install system dependencies: python3, ffmpeg, ca-certificates, and curl for yt-dlp media extraction
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python-is-python3 \
    ffmpeg \
    ca-certificates \
    curl \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package dependency specifications
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy backend application source code
COPY . .

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run defaults to port 8080
EXPOSE 8080

# Start production server
CMD ["node", "server.js"]
