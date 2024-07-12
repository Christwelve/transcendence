#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' /pgadmin4/.env | xargs)

echo "POSTGRES_HOST: ${POSTGRES_HOST}"
echo "POSTGRES_PORT: ${POSTGRES_PORT}"
echo "POSTGRES_USER: ${POSTGRES_USER}"
echo "POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}"

# Replace placeholders in servers.template.json with environment variables
envsubst < /pgadmin4/servers.json > /pgadmin4/servers.json

#Creation of pgpass file
echo "${POSTGRES_HOST}:${POSTGRES_PORT}:*:${POSTGRES_USER}:${POSTGRES_PASSWORD}" > /pgpass
chmod 600 /pgpass

# Start pgAdmin
/entrypoint.sh

