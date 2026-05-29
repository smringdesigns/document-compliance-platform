FROM node:20-slim

WORKDIR /app

# Instalar dependencias primero (mejor cache de Docker)
COPY package*.json ./
RUN npm install

# Copiar fuentes y compilar TypeScript a JavaScript
COPY . .
RUN npm run build

EXPOSE 4000

# Ejecutar el JS compilado, no ts-node-dev
CMD ["npm", "run", "start"]