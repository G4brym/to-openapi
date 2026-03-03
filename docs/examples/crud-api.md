# CRUD API Example

Build a complete task management REST API specification using to-openapi. This example demonstrates all standard CRUD operations with query parameters, request bodies, path parameters, and multiple response types.

## Define Your Schemas

First, define schemas using any Standard Schema-compatible library. The examples below use placeholder variables -- replace them with your Zod, ArkType, Valibot, or other Standard Schema objects.

```ts
// Your Zod/ArkType/Valibot schemas -- any Standard Schema-compatible library works
const TaskSchema = /* your schema here */;
const CreateTaskSchema = /* your schema here */;
const UpdateTaskSchema = /* your schema here */;
const TaskListSchema = /* your schema here */;
const TaskQuerySchema = /* your schema here */;
const ErrorSchema = /* your schema here */;
```

## Generate the OpenAPI Spec

Use the `openapi()` function to declare every route in a single definition object. Routes are specified as `"METHOD /path"` keys.

```ts
import { openapi } from "to-openapi";

const spec = openapi({
  info: {
    title: "Task Management API",
    version: "1.0.0",
    description: "A complete task management service",
  },
  servers: [
    { url: "https://api.example.com/v1", description: "Production" },
    { url: "http://localhost:3000/v1", description: "Local development" },
  ],
  tags: [
    { name: "Tasks", description: "Task management operations" },
  ],

  // Register schemas as reusable components
  schemas: {
    Task: TaskSchema,
    CreateTask: CreateTaskSchema,
    UpdateTask: UpdateTaskSchema,
    TaskList: TaskListSchema,
    Error: ErrorSchema,
  },

  paths: {
    // List tasks with filtering and pagination
    "GET /tasks": {
      summary: "List all tasks",
      description: "Retrieve a paginated list of tasks, optionally filtered by status.",
      tags: ["Tasks"],
      operationId: "listTasks",
      query: TaskQuerySchema,
      200: TaskListSchema,
      400: ErrorSchema,
    },

    // Create a new task
    "POST /tasks": {
      summary: "Create a task",
      description: "Create a new task with a title and optional description.",
      tags: ["Tasks"],
      operationId: "createTask",
      body: CreateTaskSchema,
      201: TaskSchema,
      400: ErrorSchema,
    },

    // Get a single task by ID
    "GET /tasks/{id}": {
      summary: "Get a task",
      description: "Retrieve a single task by its unique identifier.",
      tags: ["Tasks"],
      operationId: "getTask",
      200: TaskSchema,
      404: ErrorSchema,
    },

    // Update a task
    "PUT /tasks/{id}": {
      summary: "Update a task",
      description: "Replace all fields of an existing task.",
      tags: ["Tasks"],
      operationId: "updateTask",
      body: UpdateTaskSchema,
      200: TaskSchema,
      404: ErrorSchema,
    },

    // Delete a task (no response body)
    "DELETE /tasks/{id}": {
      summary: "Delete a task",
      description: "Permanently remove a task.",
      tags: ["Tasks"],
      operationId: "deleteTask",
      204: null,
      404: ErrorSchema,
    },
  },
});
```

Key details:

- **Route keys** follow the format `"METHOD /path"` -- path parameters use `{param}` syntax (or `:param`, which is auto-converted).
- **`query`** accepts a Standard Schema object whose properties become individual query parameters.
- **`body`** accepts a Standard Schema and produces an `application/json` request body.
- **Status code keys** (`200`, `201`, `204`, `404`) define response schemas. Use `null` for empty-body responses like `204 No Content`.
- **`schemas`** registers named schemas under `components/schemas` so they can be referenced via `$ref`.

## Generated Output

The resulting `spec` is a fully valid OpenAPI 3.1.0 document. Here is an abbreviated look at the structure:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Task Management API",
    "version": "1.0.0",
    "description": "A complete task management service"
  },
  "servers": [
    { "url": "https://api.example.com/v1", "description": "Production" },
    { "url": "http://localhost:3000/v1", "description": "Local development" }
  ],
  "tags": [
    { "name": "Tasks", "description": "Task management operations" }
  ],
  "paths": {
    "/tasks": {
      "get": {
        "operationId": "listTasks",
        "summary": "List all tasks",
        "tags": ["Tasks"],
        "parameters": [
          { "name": "status", "in": "query", "schema": { "type": "string" } },
          { "name": "page", "in": "query", "schema": { "type": "integer" } },
          { "name": "limit", "in": "query", "schema": { "type": "integer" } }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": { "schema": { "$ref": "#/components/schemas/TaskList" } }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "application/json": { "schema": { "$ref": "#/components/schemas/Error" } }
            }
          }
        }
      },
      "post": {
        "operationId": "createTask",
        "summary": "Create a task",
        "tags": ["Tasks"],
        "requestBody": {
          "content": {
            "application/json": { "schema": { "$ref": "#/components/schemas/CreateTask" } }
          }
        },
        "responses": {
          "201": {
            "description": "Created",
            "content": {
              "application/json": { "schema": { "$ref": "#/components/schemas/Task" } }
            }
          }
        }
      }
    },
    "/tasks/{id}": {
      "get": {
        "operationId": "getTask",
        "summary": "Get a task",
        "tags": ["Tasks"],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": { "schema": { "$ref": "#/components/schemas/Task" } }
            }
          }
        }
      },
      "put": { "..." : "..." },
      "delete": {
        "operationId": "deleteTask",
        "summary": "Delete a task",
        "tags": ["Tasks"],
        "parameters": [
          { "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "204": { "description": "No Content" },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": { "schema": { "$ref": "#/components/schemas/Error" } }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Task": { "..." : "..." },
      "CreateTask": { "..." : "..." },
      "UpdateTask": { "..." : "..." },
      "TaskList": { "..." : "..." },
      "Error": { "..." : "..." }
    }
  }
}
```

## Using the Class API

The same spec can be built incrementally with the `OpenAPI` class. This is useful when routes are registered dynamically or across multiple files.

```ts
import { OpenAPI } from "to-openapi";

const api = new OpenAPI({
  info: {
    title: "Task Management API",
    version: "1.0.0",
    description: "A complete task management service",
  },
  servers: [
    { url: "https://api.example.com/v1", description: "Production" },
  ],
  tags: [
    { name: "Tasks", description: "Task management operations" },
  ],
});

// Register reusable schemas
api.schema("Task", TaskSchema);
api.schema("CreateTask", CreateTaskSchema);
api.schema("Error", ErrorSchema);

// Add routes one at a time
api.route("get", "/tasks", {
  summary: "List all tasks",
  tags: ["Tasks"],
  query: TaskQuerySchema,
  200: TaskListSchema,
});

api.route("post", "/tasks", {
  summary: "Create a task",
  tags: ["Tasks"],
  body: CreateTaskSchema,
  201: TaskSchema,
  400: ErrorSchema,
});

api.route("get", "/tasks/{id}", {
  summary: "Get a task",
  tags: ["Tasks"],
  200: TaskSchema,
  404: ErrorSchema,
});

api.route("put", "/tasks/{id}", {
  summary: "Update a task",
  tags: ["Tasks"],
  body: UpdateTaskSchema,
  200: TaskSchema,
  404: ErrorSchema,
});

api.route("delete", "/tasks/{id}", {
  summary: "Delete a task",
  tags: ["Tasks"],
  204: null,
  404: ErrorSchema,
});

// Generate the OpenAPI document
const spec = api.document();
```

Both approaches produce identical output. Use whichever style fits your project.
