# Transcendence

## Access

> **Note:** Use `/dev` for `localhost`, `/main` for your custom IP.

- Open Docker Desktop
  
```bash
git clone
cd transcendence
make all
```
- Define your IP in .env and nginx/conf.d/daefault.conf

```markdown
https://<defined_host_ip>
```


## Overview

Transcendence is a Multiplayer Pong game. Combining Django, Node.js, and PostgreSQL for a scalable, high-performance architecture. The application is only accessible via `https://`, with all requests being routed through an Nginx reverse proxy.

## Components

- **Django**: Python backend for APIs using Django REST Framework (DRF).
- **Node.js**: Handles WebSocket connections, real-time events, and proxy requests.
- **PostgreSQL**: Database system for data storage and complex queries.
- **pgAdmin**: Web-based tool for managing PostgreSQL databases.

## Reverse Proxy

- **Nginx**: Routes incoming `https://` requests to the appropriate backend services and serves static files for the frontend.

## Workflow

1. User accesses the application via `https://<defined_host_ip>`.
2. Nginx routes API requests to Django and WebSocket connections to Node.js.
3. Django processes API requests and interacts with PostgreSQL.
4. Responses update the frontend UI.
5. Node.js handles real-time updates via WebSockets.

