# Transcendence
Test
s
## Access

- **NodeJS**: [localhost:4000](http://localhost:4000)
- **Django**: [localhost:8000](http://localhost:8000)
- **pgAdmin**: [localhost:5050](http://localhost:5050)
- **Postgres**: `docker exec -it <postgres_container_id> psql -U user -d postgres`
  - Find container ID: `docker ps`

## Overview

Transcendence is a web application built using a combination of Django, Node.js, and PostgreSQL. This stack leverages the strengths of each component to deliver a robust, scalable, and high-performance application.

## Components and Their Roles

### Django

- **Role**: Backend framework
- **Description**: A high-level Python web framework known for its "batteries-included" philosophy. It handles data models, business logic, and REST API endpoints through Django REST Framework (DRF).
- **Key Features**: User authentication, content administration, session management.

### Node.js

- **Role**: Real-time services and server-side rendering
- **Description**: A JavaScript runtime used to build scalable network applications. It handles server-side rendering, manages real-time events with WebSockets, and can serve as a proxy server.
- **Key Features**: WebSocket connections, middleware/proxy functions.

### PostgreSQL

- **Role**: Database system
- **Description**: A powerful, open-source object-relational database system known for its robustness and performance. It stores and queries data.
- **Key Features**: Full-text search, JSON support.

### pgAdmin

- **Role**: Database management tool
- **Description**: A web-based administration tool for PostgreSQL. It provides a graphical interface to manage PostgreSQL databases.
- **Key Features**: Query tool, database designer, data visualization.

## Integration Overview

### Backend (Django)

- Handles main server logic and database interactions.
- Provides RESTful API endpoints through Django REST Framework (DRF).
- Uses PostgreSQL as the database engine for data storage and retrieval.

### Real-time Services (Node.js)

- Handles WebSocket connections for real-time updates.
- Acts as a middleware or proxy, managing requests and responses between the client and Django server, or handling specific tasks like logging and caching.

## Example Workflow

1. **User Request**: A user interacts with the frontend, triggering an event (e.g., submitting a form, navigating to a page).
2. **API Call**: The frontend makes an HTTP request to a REST API endpoint served by Django.
3. **Data Processing**: Django processes the request, interacts with the PostgreSQL database if necessary, and performs any business logic.
4. **Response**: Django returns a response to the frontend.
5. **Rendering**: The frontend updates the UI based on the response.
6. **Real-time Updates**: If the application requires real-time updates (e.g., notifications, live chats), Node.js handles WebSocket connections and pushes updates to the frontend as needed.

## Benefits of This Stack

- **Scalability**: Each component can be scaled independently. The frontend can be scaled horizontally, Node.js can manage multiple real-time connections efficiently, and Django can handle complex business logic and database interactions.
- **Flexibility**: Using Django and Node.js together allows leveraging Python's robust libraries and Node.js's asynchronous capabilities.
- **Performance**: PostgreSQL provides efficient data handling and supports advanced queries, enhancing overall performance.
- **Separation of Concerns**: This stack clearly separates concerns between the frontend, backend, and real-time services, making it easier to manage and develop complex applications.

## Conclusion

This combination of technologies represents a powerful and flexible stack suitable for building modern web applications. The Django, Node.js, and PostgreSQL stack offers a well-balanced approach to developing scalable and high-performance applications.