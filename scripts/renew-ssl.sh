#!/bin/bash
echo "$(date): Iniciando renovación SSL..."

# Detener containers para liberar puerto 80
cd /var/www/avenidastickers
docker-compose down

# Renovar certificados
certbot renew --standalone --quiet

# Copiar certificados actualizados
cp /etc/letsencrypt/live/avenidastickers.me/fullchain.pem /var/www/avenidastickers/ssl/
cp /etc/letsencrypt/live/avenidastickers.me/privkey.pem /var/www/avenidastickers/ssl/

# Permisos correctos
chown avenida:avenida /var/www/avenidastickers/ssl/*
chmod 644 /var/www/avenidastickers/ssl/fullchain.pem
chmod 600 /var/www/avenidastickers/ssl/privkey.pem

# Levantar containers
cd /var/www/avenidastickers
docker-compose up -d

echo "$(date): Renovacion ssl completada"