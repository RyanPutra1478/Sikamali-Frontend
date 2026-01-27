# Stage 1: build React
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copy dan install dependencies dari folder frontend
COPY frontend/package*.json ./
RUN npm install

# Copy seluruh source code frontend
COPY frontend/ .
RUN npm run build

# Stage 2: Nginx serve file static
FROM nginx:alpine

# Hapus default config, ganti dengan config kita sendiri
RUN rm /etc/nginx/conf.d/default.conf

# Copy hasil build ke html root
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy config Nginx dari folder nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
