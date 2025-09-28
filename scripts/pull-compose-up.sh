#!/bin/bash

set -e
cd /var/www/avenidastickers
git pull origin main
docker-compose up -d