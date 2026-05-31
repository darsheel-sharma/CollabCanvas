FROM node:20-alpine

WORKDIR /app

# Copy workspace configurations
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install dependencies
RUN npm ci

# Copy server and shared source code
COPY shared/ ./shared/
COPY server/ ./server/

# Generate Prisma client
RUN npm run prisma:generate --workspace=server

EXPOSE 4000

# Execute database migrations and start server
CMD npx prisma db push --schema=server/prisma/schema.prisma && npm start --workspace=server
