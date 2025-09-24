FROM node:20-alpine

# Instalar pnpm
RUN npm install -g pnpm@latest

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema si son necesarias
RUN apk add --no-cache git

# Copiar package.json y pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# Limpiar caché de pnpm antes de instalar
RUN pnpm store prune

# Instalar dependencias con logs verbosos para debugging
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Verificar que Tailwind se instaló correctamente
RUN pnpm list tailwindcss || echo "⚠️ Tailwind no encontrado"
RUN ls -la node_modules/ | grep tailwind || echo "⚠️ No hay carpeta tailwind"

# Copiar archivos de configuración primero
COPY postcss.config.js tailwind.config.js ./

# Verificar que los archivos de configuración existen
RUN ls -la *.config.js

# Copiar el resto del código
COPY . .

# Verificar estructura del proyecto
RUN ls -la src/

# Exponer puerto
EXPOSE 5173

# Comando de desarrollo con host binding
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]