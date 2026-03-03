# Cloudflare Workers Example

Serve a machine-readable OpenAPI specification directly from a Cloudflare Worker. This example shows how to define your API with to-openapi and expose the generated spec at `GET /openapi.json` alongside your regular endpoints.

## Project Setup

Create a new Worker project or add to-openapi to an existing one:

```bash
npm create cloudflare@latest my-api -- --type=hello-world --lang=ts
cd my-api
npm install to-openapi
```

## wrangler.toml

A minimal Wrangler configuration is all you need:

```toml
name = "my-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"
```

## Worker Code

The full Worker lives in a single file. It defines the OpenAPI spec using to-openapi and serves it alongside the API endpoints.

```ts
// src/index.ts
import { z } from "zod";
import { openapi } from "to-openapi";

// --- Schemas ---

const HealthSchema = z.object({
  status: z.enum(["healthy", "degraded"]),
  uptime: z.number(),
  version: z.string(),
});

const MessageSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  createdAt: z.string().datetime(),
});

const CreateMessageSchema = z.object({
  text: z.string().min(1).max(500),
});

const ErrorSchema = z.object({
  error: z.string(),
});

// --- OpenAPI spec ---

const spec = openapi({
  info: {
    title: "My Worker API",
    version: "1.0.0",
    description: "A Cloudflare Worker with a self-documenting API",
  },
  servers: [
    { url: "https://my-api.workers.dev" },
  ],
  tags: [
    { name: "Health", description: "Service health checks" },
    { name: "Messages", description: "Message operations" },
  ],
  schemas: {
    Health: HealthSchema,
    Message: MessageSchema,
    CreateMessage: CreateMessageSchema,
    Error: ErrorSchema,
  },
  paths: {
    "GET /health": {
      summary: "Health check",
      tags: ["Health"],
      operationId: "getHealth",
      200: HealthSchema,
    },
    "GET /messages": {
      summary: "List messages",
      tags: ["Messages"],
      operationId: "listMessages",
      200: MessageSchema,
    },
    "POST /messages": {
      summary: "Create a message",
      tags: ["Messages"],
      operationId: "createMessage",
      body: CreateMessageSchema,
      201: MessageSchema,
      400: ErrorSchema,
    },
    "GET /messages/{id}": {
      summary: "Get a message",
      tags: ["Messages"],
      operationId: "getMessage",
      200: MessageSchema,
      404: ErrorSchema,
    },
    "DELETE /messages/{id}": {
      summary: "Delete a message",
      tags: ["Messages"],
      operationId: "deleteMessage",
      204: null,
      404: ErrorSchema,
    },
  },
});

// Pre-serialize the spec once at module load time
const specJson = JSON.stringify(spec, null, 2);

// --- Request handler ---

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Serve the OpenAPI spec
    if (method === "GET" && pathname === "/openapi.json") {
      return new Response(specJson, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Health check
    if (method === "GET" && pathname === "/health") {
      return Response.json({
        status: "healthy",
        uptime: performance.now(),
        version: "1.0.0",
      });
    }

    // List messages
    if (method === "GET" && pathname === "/messages") {
      // In a real app, fetch from KV, D1, or Durable Objects
      return Response.json([]);
    }

    // Create a message
    if (method === "POST" && pathname === "/messages") {
      const body = await request.json();
      const parsed = CreateMessageSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json({ error: "Invalid input" }, { status: 400 });
      }
      const message = {
        id: crypto.randomUUID(),
        text: parsed.data.text,
        createdAt: new Date().toISOString(),
      };
      return Response.json(message, { status: 201 });
    }

    // Get a message by ID
    const getMatch = pathname.match(/^\/messages\/([^/]+)$/);
    if (method === "GET" && getMatch) {
      const id = getMatch[1];
      // Look up message by id in your data store
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Delete a message by ID
    if (method === "DELETE" && getMatch) {
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler;
```

## How It Works

1. The OpenAPI spec is generated at module load time using `openapi()`. This happens once when the Worker starts -- not on every request.
2. The spec is pre-serialized to JSON with `JSON.stringify(spec, null, 2)` so the `/openapi.json` endpoint returns instantly.
3. The same schemas (e.g., `CreateMessageSchema`) are used both for the OpenAPI definition and for runtime validation in the route handlers. This keeps the spec and the implementation in sync.

## Deploying

Deploy with the Wrangler CLI:

```bash
npx wrangler deploy
```

After deployment, your spec is available at:

```
https://my-api.workers.dev/openapi.json
```

You can paste that URL directly into tools like [Swagger UI](https://swagger.io/tools/swagger-ui/), [Scalar](https://scalar.com/), or any OpenAPI-compatible client generator.

## Serving a Swagger UI Page

You can optionally serve a Swagger UI page that renders the spec. Add a route that returns an HTML page pointing at your `/openapi.json` endpoint:

```ts
if (method === "GET" && pathname === "/docs") {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" });
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
```

This gives you interactive API documentation hosted alongside your Worker with zero external dependencies.
