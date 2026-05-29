# Build stage
FROM node:20-slim as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage  
FROM node:20-slim

WORKDIR /app

# Instalar servidor HTTP simple para servir archivos estáticos
RUN npm install -g http-server

# Copiar los archivos compilados desde el builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Servir la aplicación
CMD ["http-server", "dist", "-p", "3000", "--cors"]