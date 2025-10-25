# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all source files
COPY . .

# Expose application port
EXPOSE 3000

# Use environment variables inside container
ENV NODE_ENV=production

# Start the server
CMD ["node", "src/server.js"]
