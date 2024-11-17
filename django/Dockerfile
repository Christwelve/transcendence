FROM python:3.9-alpine
WORKDIR /app

# Install dependencies for psycopg2-binary
RUN apk add --no-cache \
    gcc \
    python3-dev \
    musl-dev \
    postgresql-dev

COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
CMD ["sh", "-c", "python manage.py makemigrations && python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]