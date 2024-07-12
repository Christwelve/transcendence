#!/bin/bash
set -e


./wait-for-it.sh postgres:5432 --timeout=30 --strict -- echo -e "\e[32mPostgres is up and running\e[0m"

python manage.py migrate

# python manage.py createsuperuser
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    python manage.py createsuperuser --noinput || true
fi

python manage.py runserver 0.0.0.0:8000


