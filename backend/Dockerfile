# Use official Node.js 20 LTS slim image (Debian-based for optimal native binary compatibility with bcrypt)
FROM node:20-slim

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
