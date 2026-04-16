# Etapa de construcción (Build stage)
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias (incluyendo bun.lock para versiones exactas)
COPY package.json bun.lock ./

# Instalar todas las dependencias
RUN bun install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Etapa de producción
FROM oven/bun:1-alpine

WORKDIR /app

# Copiar instalar solo dependencias de producción
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Copiar el código desde la etapa del constructor
COPY --from=builder /app .

# Crear el directorio para imágenes en caso de que no exista
RUN mkdir -p mi-carpeta-imagenes

# Configurar las variables de entorno
ENV NODE_ENV=production
ENV SERVER_PORT=3030

# Exponer el puerto de la aplicación
EXPOSE 3030

# Iniciar la aplicación
CMD ["bun", "run", "server.js"]
