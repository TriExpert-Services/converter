FROM node:18-alpine

# Instalar dependencias necesarias para conversión HEIC
RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++

# Crear carpeta de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo dev para el build)
RUN npm install

# Copiar código fuente completo
COPY . .

# Crear directorios necesarios con permisos correctos
RUN mkdir -p uploads output dist && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app /app/uploads /app/output /tmp

# Construir la app React
RUN npm run build

# Limpiar e instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Cambiar al usuario no-root
USER nextjs

# Exponer el puerto
EXPOSE 4545

# Iniciar el servidor
CMD ["node", "server/index.js"]
