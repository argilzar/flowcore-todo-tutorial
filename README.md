# flowcore-todo-tutorial

A full-stack todo list application showcasing event-driven architecture with Flowcore, featuring a modern web frontend and REST API backend built with Bun.

## Features

### Frontend
- ✨ Modern, responsive web interface
- 📱 Mobile-friendly design
- 🎯 Real-time todo management
- 🔍 Filter todos by status (All, Pending, Completed)
- ✏️ Inline editing of todo titles
- 📊 Live statistics (total, completed, pending)

### Backend
- 🚀 Event-driven architecture with Flowcore pathways
- 🔗 REST API for frontend integration
- 📡 Webhook endpoint for Flowcore events
- 🗄️ PostgreSQL database integration
- ⚡ Built with Bun for high performance

## Quick Start

### Installation

To install dependencies:

```bash
bun install
```

### Environment Setup

Create a `.env` file with the following variables:

| Variable | Type | Description | Default | Required |
|----------|------|-------------|----------|----------|
| FLOWCORE_API_KEY | string | Your Flowcore API key | - | ✓ |
| POSTGRES_URL | string | PostgreSQL connection string | - | ✓ |
| FLOWCORE_TENANT | string | Your Flowcore tenant ID | - | ✓ |
| FLOWCORE_WEBHOOK_BASE_URL | string | Base URL for Flowcore webhooks | "https://webhook.api.flowcore.io" | |

### Running the Application

To start the server with frontend:

```bash
bun run index.ts
```

The application will be available at:
- 🌐 **Frontend**: http://localhost:3000
- 📡 **Flowcore Webhook**: http://localhost:3000/api/transformer

## API Endpoints

### REST API for Frontend

- `GET /api/todos` - List all todos
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo (title or completion status)
- `DELETE /api/todos/:id` - Delete a todo

### Flowcore Integration

- `POST /api/transformer` - Webhook endpoint for Flowcore events

## Event-Driven Architecture

The application uses Flowcore pathways to handle the following events:

- `todo-items/todo-item.created.v0` - Creates a new todo item
- `todo-items/todo-item.renamed.v0` - Updates todo title
- `todo-items/todo-item.completed.v0` - Marks todo as completed
- `todo-items/todo-item.reopened.v0` - Marks todo as pending
- `todo-items/todo-item.deleted.v0` - Deletes a todo item

## Database Schema

The application uses a PostgreSQL table with the following structure:

```sql
CREATE TABLE todo (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    done BOOLEAN NOT NULL DEFAULT false
);
```

## Demo Script

To test the event-driven functionality:

```bash
bun run write-demo.ts
```

This script will create sample todo events through the Flowcore pathways.

## Technology Stack

- **Runtime**: Bun
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: TypeScript, Flowcore Pathways
- **Database**: PostgreSQL
- **Validation**: Zod schemas
- **Styling**: Modern CSS with gradients and animations

## Development

This project demonstrates modern event-driven architecture patterns with a clean separation between:

1. **Event Processing**: Flowcore pathways handle domain events
2. **Data Persistence**: PostgreSQL stores the current state
3. **API Layer**: REST endpoints for frontend integration
4. **User Interface**: Modern web application for user interaction

The frontend communicates with the backend through REST API calls, while the backend processes events through Flowcore pathways, showcasing both traditional and event-driven approaches working together.

---

This project was created using `bun init` in bun v1.2.6. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
