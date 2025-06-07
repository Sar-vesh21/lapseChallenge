FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port 5173 (Vite's default port)
EXPOSE 5173

# Set host to allow external connections
ENV HOST=0.0.0.0

# Start the development server
CMD ["npm", "run", "dev", "--", "--host"] 