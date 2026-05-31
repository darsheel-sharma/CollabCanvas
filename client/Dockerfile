# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy workspace packages configurations
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY shared/package.json ./shared/

# Install dependencies for all workspaces
RUN npm ci --include=dev

# Copy source code of dependencies and client
COPY shared/ ./shared/
COPY client/ ./client/

# Build client bundle
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build --workspace=client

# Stage 2: Serve via Nginx
FROM nginx:alpine

COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
