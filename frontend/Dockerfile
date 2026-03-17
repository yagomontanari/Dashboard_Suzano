# Estágio 1: Build da aplicação React/Vite
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Estágio 2: Subir servidor Nginx estático com proxy reverso
FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm -rf /usr/share/nginx/html/* && rm /etc/nginx/conf.d/default.conf

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos gerados no estágio de build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
