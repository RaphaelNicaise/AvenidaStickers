#!/bin/bash
cd /var/www/avenidastickers
docker-compose down

certbot renew --standalone --quiet

cp /etc/letsencrypt/live/avenidastickers.me/fullchain.pem /var/www/avenidastickers/ssl/
cp /etc/letsencrypt/live/avenidastickers.me/privkey.pem /var/www/avenidastickers/ssl/

chown root /var/www/avenidastickers/ssl/*
chmod 644 /var/www/avenidastickers/ssl/fullchain.pem
chmod 600 /var/www/avenidastickers/ssl/privkey.pem

cd /var/www/avenidastickers
docker-compose up -d

echo "$(date): Renovacion ssl completada"