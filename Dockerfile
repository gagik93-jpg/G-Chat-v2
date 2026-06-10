FROM node:18-alpine

WORKDIR /app

# Copy server files
COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/prisma ./server/prisma/
COPY server/src ./server/src/

# Generate Prisma client
RUN cd server && npx prisma generate

# Copy client dist
COPY client/dist ./client/dist/

# Create uploads directory
RUN mkdir -p uploads data

# Set working directory to server
WORKDIR /app/server

# Expose port
EXPOSE 10000

# Start server
CMD npx prisma migrate deploy && npm start
